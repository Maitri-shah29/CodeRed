// Landing page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';

function Landing() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    socket.connect();
    
    return () => {
      // Don't disconnect on unmount, we need the connection
    };
  }, []);

  const handleCreateRoom = () => {
    if (!playerName.trim() || playerName.length < 2) {
      setError('Please enter a valid name (at least 2 characters)');
      return;
    }

    setError('');
    socket.emit('createRoom', { playerName: playerName.trim() }, (response) => {
      if (response.success) {
        navigate('/lobby', {
          state: {
            roomCode: response.roomCode,
            playerId: response.playerId,
            playerName: playerName.trim(),
            isHost: true
          }
        });
      } else {
        setError(response.error || 'Failed to create room');
      }
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || playerName.length < 2) {
      setError('Please enter a valid name (at least 2 characters)');
      return;
    }

    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }

    setError('');
    setIsJoining(true);

    socket.emit(
      'joinRoom',
      { roomCode: roomCode.toUpperCase(), playerName: playerName.trim() },
      (response) => {
        setIsJoining(false);
        if (response.success) {
          navigate('/lobby', {
            state: {
              roomCode: roomCode.toUpperCase(),
              playerId: response.playerId,
              playerName: playerName.trim(),
              isHost: false
            }
          });
        } else {
          setError(response.error || 'Failed to join room');
        }
      }
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🔴 CodeRed</h1>
          <p style={styles.subtitle}>Find bugs faster than they can be introduced!</p>
        </div>

        <div style={styles.card}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              style={styles.input}
              maxLength={20}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.buttonGroup}>
            <button onClick={handleCreateRoom} style={styles.primaryButton}>
              Create New Room
            </button>

            <div style={styles.divider}>
              <span style={styles.dividerText}>or</span>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                style={styles.input}
                maxLength={6}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              style={styles.secondaryButton}
              disabled={isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>

        <div style={styles.howToPlay}>
          <h3 style={styles.howToPlayTitle}>How to Play</h3>
          <ul style={styles.rulesList}>
            <li>👥 Play with 3-6 players</li>
            <li>🎭 Take turns being the Bugger or a Debugger</li>
            <li>🐛 Bugger: Introduce subtle bugs in the code</li>
            <li>🔍 Debuggers: Find and fix bugs before time runs out</li>
            <li>🏆 Earn points for successful bugs and fixes</li>
          </ul>
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
    maxWidth: '500px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)'
  },
  subtitle: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    marginBottom: '24px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit'
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px'
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  primaryButton: {
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
  },
  secondaryButton: {
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#667eea',
    backgroundColor: 'white',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '8px 0'
  },
  dividerText: {
    width: '100%',
    fontSize: '14px',
    color: '#9ca3af',
    position: 'relative',
    padding: '0 16px',
    '::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: '1px',
      backgroundColor: '#e5e7eb'
    }
  },
  howToPlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  },
  howToPlayTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '16px'
  },
  rulesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }
};

export default Landing;
