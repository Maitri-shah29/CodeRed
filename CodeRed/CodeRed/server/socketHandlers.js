// Socket.IO event handlers
const {
  createRoom,
  getRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  startGame,
  handleBuzz,
  validateFix,
  endRound,
  resetGame
} = require('./gameState');

const { generateRoomCode, generatePlayerId, isValidPlayerName } = require('./utils');

// Track socket to player/room mappings
const socketToPlayer = new Map();
const playerToSocket = new Map();

/**
 * Setup all socket event handlers
 */
function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // CREATE ROOM
    socket.on('createRoom', ({ playerName }, callback) => {
      if (!isValidPlayerName(playerName)) {
        return callback({ success: false, error: 'Invalid player name' });
      }

      const roomCode = generateRoomCode();
      const playerId = generatePlayerId();
      
      const room = createRoom(roomCode, playerId, playerName);
      
      // Track mappings
      socketToPlayer.set(socket.id, { playerId, roomCode });
      playerToSocket.set(playerId, socket.id);
      
      socket.join(roomCode);
      
      callback({
        success: true,
        roomCode,
        playerId,
        room: serializeRoom(room)
      });

      console.log(`Room created: ${roomCode} by ${playerName}`);
    });

    // JOIN ROOM
    socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
      if (!isValidPlayerName(playerName)) {
        return callback({ success: false, error: 'Invalid player name' });
      }

      const room = getRoom(roomCode);
      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      const playerId = generatePlayerId();
      const result = addPlayerToRoom(roomCode, playerId, playerName);

      if (result.error) {
        return callback({ success: false, error: result.error });
      }

      // Track mappings
      socketToPlayer.set(socket.id, { playerId, roomCode });
      playerToSocket.set(playerId, socket.id);
      
      socket.join(roomCode);
      
      callback({
        success: true,
        playerId,
        room: serializeRoom(result)
      });

      // Notify others in room
      socket.to(roomCode).emit('playerJoined', {
        player: result.players.get(playerId),
        room: serializeRoom(result)
      });

      console.log(`${playerName} joined room ${roomCode}`);
    });

    // PLAYER READY
    socket.on('playerReady', (callback) => {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) return;

      const { playerId, roomCode } = playerData;
      const room = getRoom(roomCode);
      if (!room) return;

      const player = room.players.get(playerId);
      if (player) {
        player.isReady = !player.isReady;
        
        io.to(roomCode).emit('roomUpdated', {
          room: serializeRoom(room)
        });

        if (callback) callback({ success: true });
      }
    });

    // START GAME
    socket.on('startGame', (callback) => {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) return;

      const { playerId, roomCode } = playerData;
      const room = getRoom(roomCode);
      
      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      if (room.hostId !== playerId) {
        return callback({ success: false, error: 'Only host can start game' });
      }

      const result = startGame(roomCode);
      
      if (result.error) {
        return callback({ success: false, error: result.error });
      }

      io.to(roomCode).emit('gameStarted', {
        room: serializeRoom(result)
      });

      // Start round timer
      startRoundTimer(io, roomCode);

      callback({ success: true });
      console.log(`Game started in room ${roomCode}`);
    });

    // BUZZ
    socket.on('buzz', (callback) => {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) return;

      const { playerId, roomCode } = playerData;
      const result = handleBuzz(roomCode, playerId);

      if (result && result.error) {
        return callback({ success: false, error: result.error });
      }

      if (result) {
        const player = result.players.get(playerId);
        
        io.to(roomCode).emit('playerBuzzed', {
          playerId,
          playerName: player.name
        });

        callback({ success: true });
      }
    });

    // SUBMIT FIX
    socket.on('submitFix', ({ fixedCode }, callback) => {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) return;

      const { playerId, roomCode } = playerData;
      const result = validateFix(roomCode, playerId, fixedCode);

      if (!result) {
        return callback({ success: false, error: 'Invalid submission' });
      }

      const { isCorrect, room } = result;

      callback({ success: true, isCorrect });

      io.to(roomCode).emit('fixSubmitted', {
        playerId,
        playerName: room.players.get(playerId).name,
        isCorrect,
        correctCode: room.currentCode.correctCode,
        bugDescription: room.currentCode.currentBug.description
      });

      // End round after fix submission
      setTimeout(() => {
        handleEndRound(io, roomCode);
      }, 3000);
    });

    // SUBMIT BUG (from bugger)
    socket.on('submitBug', ({ buggedCode }, callback) => {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) return;

      const { playerId, roomCode } = playerData;
      const room = getRoom(roomCode);

      if (!room || room.bugger !== playerId) {
        return callback({ success: false, error: 'Only bugger can submit bugs' });
      }

      // Update the bugged code
      room.currentCode.buggedCode = buggedCode;

      callback({ success: true });

      // Notify debuggers that code was updated
      socket.to(roomCode).emit('codeUpdated', {
        code: buggedCode
      });
    });

    // NEXT ROUND (after results shown)
    socket.on('nextRound', () => {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) return;

      const { roomCode } = playerData;
      const room = getRoom(roomCode);

      if (room && room.gameState === 'playing') {
        io.to(roomCode).emit('roundStarted', {
          room: serializeRoom(room)
        });

        startRoundTimer(io, roomCode);
      }
    });

    // PLAY AGAIN
    socket.on('playAgain', (callback) => {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) return;

      const { roomCode } = playerData;
      const room = resetGame(roomCode);

      if (room) {
        io.to(roomCode).emit('gameReset', {
          room: serializeRoom(room)
        });

        callback({ success: true });
      }
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      const playerData = socketToPlayer.get(socket.id);
      
      if (playerData) {
        const { playerId, roomCode } = playerData;
        const room = removePlayerFromRoom(roomCode, playerId);

        if (room) {
          io.to(roomCode).emit('playerLeft', {
            playerId,
            room: serializeRoom(room)
          });
        }

        socketToPlayer.delete(socket.id);
        playerToSocket.delete(playerId);
      }

      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Start round timer
 */
function startRoundTimer(io, roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;

  const timer = setInterval(() => {
    const room = getRoom(roomCode);
    if (!room || room.gameState !== 'playing') {
      clearInterval(timer);
      return;
    }

    const elapsed = Math.floor((Date.now() - room.roundStartTime) / 1000);
    const remaining = room.roundDuration - elapsed;

    io.to(roomCode).emit('timerUpdate', { remaining });

    if (remaining <= 0) {
      clearInterval(timer);
      handleEndRound(io, roomCode);
    }
  }, 1000);
}

/**
 * Handle end of round
 */
function handleEndRound(io, roomCode) {
  const room = endRound(roomCode);
  
  if (!room) return;

  if (room.gameState === 'results') {
    // Game over - show final results
    io.to(roomCode).emit('gameEnded', {
      room: serializeRoom(room)
    });
  } else {
    // Next round
    io.to(roomCode).emit('roundEnded', {
      room: serializeRoom(room)
    });

    // Start next round after brief delay
    setTimeout(() => {
      io.to(roomCode).emit('roundStarted', {
        room: serializeRoom(room)
      });

      startRoundTimer(io, roomCode);
    }, 5000);
  }
}

/**
 * Serialize room for client
 */
function serializeRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    players: Array.from(room.players.values()),
    gameState: room.gameState,
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    currentCode: room.currentCode,
    bugger: room.bugger,
    debuggers: room.debuggers,
    scores: Object.fromEntries(room.scores),
    buzzedPlayer: room.buzzedPlayer
  };
}

module.exports = { setupSocketHandlers };
