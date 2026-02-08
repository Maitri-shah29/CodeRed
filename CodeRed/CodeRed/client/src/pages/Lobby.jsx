// Lobby page
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../socket';
import PlayerList from '../components/PlayerList';

function Lobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode, playerId, playerName, isHost } = location.state || {};

  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!roomCode || !playerId) {
      navigate('/');
      return;
    }

    // Listen for room updates
    socket.on('roomUpdated', ({ room }) => {
      setRoom(room);
    });

    socket.on('playerJoined', ({ room }) => {
      setRoom(room);
    });

    socket.on('playerLeft', ({ room }) => {
      setRoom(room);
      if (!room.players.find((p) => p.id === playerId)) {
        navigate('/');
      }
    });

    socket.on('gameStarted', ({ room }) => {
      navigate('/game', {
        state: {
          roomCode,
          playerId,
          playerName,
          room
        }
      });
    });

    return () => {
      socket.off('roomUpdated');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
    };
  }, [roomCode, playerId, playerName, navigate]);

  const handleToggleReady = () => {
    socket.emit('playerReady', (response) => {
      if (!response.success) {
        setError('Failed to update ready status');
      }
    });
  };

  const handleStartGame = () => {
    if (!room || room.players.length < 3) {
      setError('Need at least 3 players to start');
      return;
    }

    socket.emit('startGame', (response) => {
      if (!response.success) {
        setError(response.error || 'Failed to start game');
      }
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    socket.disconnect();
    navigate('/');
  };

  if (!room) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading lobby...</div>
      </div>
    );
  }

  const currentPlayer = room.players.find((p) => p.id === playerId);
  const allReady = room.players.length >= 3 && room.players.every((p) => p.isReady);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🔴 Game Lobby</h1>
          <div style={styles.roomCodeContainer}>
            <span style={styles.roomCodeLabel}>Room Code:</span>
            <div style={styles.roomCodeBox} onClick={handleCopyCode}>
              <span style={styles.roomCode}>{roomCode}</span>
              <button style={styles.copyButton}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
        </div>

        <div style={styles.main}>
          <PlayerList
            players={room.players}
            hostId={room.hostId}
            currentPlayerId={playerId}
            scores={null}
            showRoles={false}
          />

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.info}>
            <div style={styles.infoBox}>
              <span style={styles.infoIcon}>👥</span>
              <span>
                {room.players.length} / 6 players
                {room.players.length < 3 && ' (need 3+ to start)'}
              </span>
            </div>
            <div style={styles.infoBox}>
              <span style={styles.infoIcon}>🎮</span>
              <span>{room.totalRounds} rounds per game</span>
            </div>
            <div style={styles.infoBox}>
              <span style={styles.infoIcon}>⏱️</span>
              <span>90 seconds per round</span>
            </div>
          </div>

          <div style={styles.actions}>
            {!isHost && (
              <button
                onClick={handleToggleReady}
                style={{
                  ...styles.readyButton,
                  ...(currentPlayer?.isReady ? styles.readyButtonActive : {})
                }}
              >
                {currentPlayer?.isReady ? '✓ Ready!' : 'Ready Up'}
              </button>
            )}

            {isHost && (
              <button
                onClick={handleStartGame}
                style={{
                  ...styles.startButton,
                  ...(room.players.length < 3 ? styles.buttonDisabled : {})
                }}
                disabled={room.players.length < 3}
              >
                {room.players.length < 3
                  ? `Waiting for ${3 - room.players.length} more player(s)`
                  : allReady
                  ? '🚀 Start Game'
                  : '⏳ Waiting for players to ready up'}
              </button>
            )}

            <button onClick={handleLeave} style={styles.leaveButton}>
              Leave Lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  content: {
    width: '100%',
    maxWidth: '600px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '20px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)'
  },
  roomCodeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  roomCodeLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  roomCodeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '12px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  roomCode: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    letterSpacing: '4px',
    fontFamily: 'monospace'
  },
  copyButton: {
    padding: '6px 12px',
    fontSize: '12px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  loading: {
    color: 'white',
    fontSize: '20px',
    textAlign: 'center'
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '14px'
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '20px',
    borderRadius: '12px'
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '16px',
    color: '#374151'
  },
  infoIcon: {
    fontSize: '24px'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  readyButton: {
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
  },
  readyButtonActive: {
    backgroundColor: '#059669'
  },
  startButton: {
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  leaveButton: {
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ef4444',
    backgroundColor: 'white',
    border: '2px solid #ef4444',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};

export default Lobby;
