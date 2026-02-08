// Game state management
const { shuffleArray, randomElement } = require('./utils');

// Store all active rooms
const rooms = new Map();

// Sample code snippets for the game
const codeSamples = [
  {
    id: 1,
    language: 'javascript',
    title: 'Array Sum Function',
    correctCode: `function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`,
    bugs: [
      {
        buggedCode: `function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i <= arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`,
        description: 'Off-by-one error: i <= arr.length should be i < arr.length'
      },
      {
        buggedCode: `function sumArray(arr) {
  let sum = 1;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`,
        description: 'Wrong initialization: sum should start at 0, not 1'
      },
      {
        buggedCode: `function sumArray(arr) {
  let sum = 0;
  for (let i = 1; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`,
        description: 'Skipping first element: i should start at 0, not 1'
      }
    ]
  },
  {
    id: 2,
    language: 'javascript',
    title: 'Find Maximum Value',
    correctCode: `function findMax(numbers) {
  if (numbers.length === 0) return null;
  let max = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] > max) {
      max = numbers[i];
    }
  }
  return max;
}`,
    bugs: [
      {
        buggedCode: `function findMax(numbers) {
  if (numbers.length === 0) return null;
  let max = 0;
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] > max) {
      max = numbers[i];
    }
  }
  return max;
}`,
        description: 'Wrong initialization: max should be numbers[0], not 0'
      },
      {
        buggedCode: `function findMax(numbers) {
  if (numbers.length === 0) return null;
  let max = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] >= max) {
      max = numbers[i];
    }
  }
  return max;
}`,
        description: 'Wrong comparison: should be >, not >='
      },
      {
        buggedCode: `function findMax(numbers) {
  if (numbers.length === 0) return null;
  let max = numbers[0];
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] > max) {
      max = numbers[i];
    }
  }
  return max;
}`,
        description: 'Redundant comparison: loop should start at i = 1'
      }
    ]
  },
  {
    id: 3,
    language: 'javascript',
    title: 'String Reversal',
    correctCode: `function reverseString(str) {
  let reversed = '';
  for (let i = str.length - 1; i >= 0; i--) {
    reversed += str[i];
  }
  return reversed;
}`,
    bugs: [
      {
        buggedCode: `function reverseString(str) {
  let reversed = '';
  for (let i = str.length; i >= 0; i--) {
    reversed += str[i];
  }
  return reversed;
}`,
        description: 'Off-by-one: i should start at str.length - 1, not str.length'
      },
      {
        buggedCode: `function reverseString(str) {
  let reversed = '';
  for (let i = str.length - 1; i > 0; i--) {
    reversed += str[i];
  }
  return reversed;
}`,
        description: 'Missing last character: condition should be i >= 0, not i > 0'
      }
    ]
  }
];

/**
 * Create a new game room
 */
function createRoom(roomCode, hostId, hostName) {
  const room = {
    code: roomCode,
    hostId: hostId,
    players: new Map(),
    gameState: 'lobby', // lobby, playing, results
    currentRound: 0,
    totalRounds: 3,
    roundStartTime: null,
    roundDuration: 90, // seconds
    currentCode: null,
    currentBug: null,
    bugger: null,
    debuggers: [],
    scores: new Map(),
    buzzedPlayer: null,
    createdAt: Date.now()
  };

  // Add host as first player
  room.players.set(hostId, {
    id: hostId,
    name: hostName,
    isHost: true,
    isReady: false,
    role: null
  });

  room.scores.set(hostId, 0);
  rooms.set(roomCode, room);
  
  return room;
}

/**
 * Get room by code
 */
function getRoom(roomCode) {
  return rooms.get(roomCode);
}

/**
 * Add player to room
 */
function addPlayerToRoom(roomCode, playerId, playerName) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  if (room.players.size >= 6) {
    return { error: 'Room is full' };
  }

  if (room.gameState !== 'lobby') {
    return { error: 'Game already in progress' };
  }

  room.players.set(playerId, {
    id: playerId,
    name: playerName,
    isHost: false,
    isReady: false,
    role: null
  });

  room.scores.set(playerId, 0);
  
  return room;
}

/**
 * Remove player from room
 */
function removePlayerFromRoom(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  room.players.delete(playerId);
  room.scores.delete(playerId);

  // If host left, assign new host
  if (room.hostId === playerId && room.players.size > 0) {
    const newHost = Array.from(room.players.values())[0];
    newHost.isHost = true;
    room.hostId = newHost.id;
  }

  // Delete room if empty
  if (room.players.size === 0) {
    rooms.delete(roomCode);
    return null;
  }

  return room;
}

/**
 * Start the game
 */
function startGame(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  if (room.players.size < 3) {
    return { error: 'Need at least 3 players to start' };
  }

  room.gameState = 'playing';
  room.currentRound = 1;
  assignRoles(room);
  startRound(room);

  return room;
}

/**
 * Assign roles to players
 */
function assignRoles(room) {
  const playerIds = Array.from(room.players.keys());
  const shuffled = shuffleArray(playerIds);
  
  // First player is the bugger
  room.bugger = shuffled[0];
  room.debuggers = shuffled.slice(1);

  // Update player roles
  room.players.get(room.bugger).role = 'bugger';
  room.debuggers.forEach(id => {
    room.players.get(id).role = 'debugger';
  });
}

/**
 * Start a new round
 */
function startRound(room) {
  // Select random code sample
  const sample = randomElement(codeSamples);
  const bug = randomElement(sample.bugs);

  room.currentCode = {
    ...sample,
    currentBug: bug
  };

  room.roundStartTime = Date.now();
  room.buzzedPlayer = null;
}

/**
 * Handle buzz from debugger
 */
function handleBuzz(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room || room.gameState !== 'playing') return null;

  // Only debuggers can buzz
  if (room.players.get(playerId).role !== 'debugger') {
    return { error: 'Only debuggers can buzz' };
  }

  // Check if already buzzed
  if (room.buzzedPlayer) {
    return { error: 'Someone already buzzed' };
  }

  room.buzzedPlayer = playerId;
  return room;
}

/**
 * Validate bug fix
 */
function validateFix(roomCode, playerId, fixedCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const isCorrect = fixedCode.trim() === room.currentCode.correctCode.trim();

  if (isCorrect) {
    // Award points to debugger
    const currentScore = room.scores.get(playerId) || 0;
    room.scores.set(playerId, currentScore + 10);
  } else {
    // Penalty for wrong fix
    const currentScore = room.scores.get(playerId) || 0;
    room.scores.set(playerId, Math.max(0, currentScore - 5));
  }

  return { isCorrect, room };
}

/**
 * End current round
 */
function endRound(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  // If no one buzzed, bugger gets points
  if (!room.buzzedPlayer) {
    const currentScore = room.scores.get(room.bugger) || 0;
    room.scores.set(room.bugger, currentScore + 15);
  }

  // Check if game is over
  if (room.currentRound >= room.totalRounds) {
    room.gameState = 'results';
  } else {
    room.currentRound++;
    assignRoles(room); // Rotate roles
    startRound(room);
  }

  return room;
}

/**
 * Reset game for rematch
 */
function resetGame(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  room.gameState = 'lobby';
  room.currentRound = 0;
  room.roundStartTime = null;
  room.currentCode = null;
  room.bugger = null;
  room.debuggers = [];
  room.buzzedPlayer = null;

  // Reset scores
  room.scores.forEach((_, playerId) => {
    room.scores.set(playerId, 0);
  });

  // Reset ready status
  room.players.forEach(player => {
    player.isReady = false;
    player.role = null;
  });

  return room;
}

/**
 * Get all rooms (for debugging)
 */
function getAllRooms() {
  return Array.from(rooms.values());
}

module.exports = {
  createRoom,
  getRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  startGame,
  handleBuzz,
  validateFix,
  endRound,
  resetGame,
  getAllRooms,
  codeSamples
};
