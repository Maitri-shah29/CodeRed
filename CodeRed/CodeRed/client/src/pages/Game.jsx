// Game page
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../socket';
import CodeEditor from '../components/CodeEditor';
import Timer from '../components/Timer';
import Buzzer from '../components/Buzzer';
import PlayerList from '../components/PlayerList';

function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode, playerId, playerName, room: initialRoom } = location.state || {};

  const [room, setRoom] = useState(initialRoom);
  const [code, setCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [buzzedPlayerName, setBuzzedPlayerName] = useState(null);
  const [showFixModal, setShowFixModal] = useState(false);
  const [fixedCode, setFixedCode] = useState('');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!roomCode || !playerId || !room) {
      navigate('/');
      return;
    }

    // Set initial code
    if (room.currentCode) {
      if (getCurrentPlayer()?.role === 'bugger') {
        setCode(room.currentCode.currentBug.buggedCode);
      } else {
        setCode(room.currentCode.currentBug.buggedCode);
      }
    }

    // Socket event listeners
    socket.on('timerUpdate', ({ remaining }) => {
      setTimeRemaining(remaining);
    });

    socket.on('playerBuzzed', ({ playerId: buzzerId, playerName }) => {
      setBuzzedPlayerName(playerName);
      
      // If current player buzzed, show fix modal
      if (buzzerId === playerId) {
        setShowFixModal(true);
        setFixedCode(code);
      }
    });

    socket.on('codeUpdated', ({ code: newCode }) => {
      setCode(newCode);
    });

    socket.on('fixSubmitted', ({ playerId: submitterId, isCorrect, correctCode, bugDescription }) => {
      setFeedback({
        isCorrect,
        correctCode,
        bugDescription,
        submittedBy: submitterId
      });
      setBuzzedPlayerName(null);
      setShowFixModal(false);

      setTimeout(() => {
        setFeedback(null);
      }, 5000);
    });

    socket.on('roundEnded', ({ room: updatedRoom }) => {
      setRoom(updatedRoom);
    });

    socket.on('roundStarted', ({ room: updatedRoom }) => {
      setRoom(updatedRoom);
      setBuzzedPlayerName(null);
      setShowFixModal(false);
      setFeedback(null);
      
      if (updatedRoom.currentCode) {
        const currentPlayer = updatedRoom.players.find((p) => p.id === playerId);
        if (currentPlayer?.role === 'bugger') {
          setCode(updatedRoom.currentCode.currentBug.buggedCode);
        } else {
          setCode(updatedRoom.currentCode.currentBug.buggedCode);
        }
      }
    });

    socket.on('gameEnded', ({ room: updatedRoom }) => {
      navigate('/result', {
        state: {
          roomCode,
          playerId,
          playerName,
          room: updatedRoom
        }
      });
    });

    socket.on('playerLeft', ({ room: updatedRoom }) => {
      setRoom(updatedRoom);
    });

    return () => {
      socket.off('timerUpdate');
      socket.off('playerBuzzed');
      socket.off('codeUpdated');
      socket.off('fixSubmitted');
      socket.off('roundEnded');
      socket.off('roundStarted');
      socket.off('gameEnded');
      socket.off('playerLeft');
    };
  }, [roomCode, playerId, navigate, room, code, playerName]);

  const getCurrentPlayer = () => {
    return room?.players.find((p) => p.id === playerId);
  };

  const handleBuzz = () => {
    socket.emit('buzz', (response) => {
      if (!response.success) {
        alert(response.error || 'Failed to buzz');
      }
    });
  };

  const handleSubmitFix = () => {
    socket.emit('submitFix', { fixedCode }, (response) => {
      if (!response.success) {
        alert('Failed to submit fix');
      }
    });
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    
    // If bugger, emit code update
    if (getCurrentPlayer()?.role === 'bugger') {
      socket.emit('submitBug', { buggedCode: newCode });
    }
  };

  if (!room) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading game...</div>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer();
  const isBugger = currentPlayer?.role === 'bugger';
  const canBuzz = !isBugger && !buzzedPlayerName;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>🔴 CodeRed</h1>
            <div style={styles.roundInfo}>
              Round {room.currentRound} / {room.totalRounds}
            </div>
          </div>
          <Timer duration={90} />
        </div>

        <div style={styles.main}>
          <div style={styles.leftPanel}>
            <PlayerList
              players={room.players}
              hostId={room.hostId}
              currentPlayerId={playerId}
              scores={room.scores}
              showRoles={true}
            />

            <div style={styles.roleCard}>
              <h3 style={styles.roleTitle}>Your Role</h3>
              <div style={styles.roleContent}>
                {isBugger ? (
                  <>
                    <span style={styles.roleIcon}>🐛</span>
                    <div>
                      <div style={styles.roleName}>Bugger</div>
                      <div style={styles.roleDescription}>
                        Introduce subtle bugs in the code without getting caught!
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={styles.roleIcon}>🔍</span>
                    <div>
                      <div style={styles.roleName}>Debugger</div>
                      <div style={styles.roleDescription}>
                        Find and fix bugs before time runs out!
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isBugger && (
              <Buzzer
                onBuzz={handleBuzz}
                disabled={!canBuzz}
                buzzedPlayer={buzzedPlayerName}
              />
            )}
          </div>

          <div style={styles.rightPanel}>
            {room.currentCode && (
              <div style={styles.codeSection}>
                <div style={styles.codeHeader}>
                  <h2 style={styles.codeTitle}>{room.currentCode.title}</h2>
                </div>
                <CodeEditor
                  code={code}
                  onChange={handleCodeChange}
                  readOnly={!isBugger && !showFixModal}
                  language={room.currentCode.language}
                  height="500px"
                />
              </div>
            )}

            {feedback && (
              <div
                style={{
                  ...styles.feedback,
                  ...(feedback.isCorrect
                    ? styles.feedbackSuccess
                    : styles.feedbackError)
                }}
              >
                <div style={styles.feedbackTitle}>
                  {feedback.isCorrect ? '✅ Correct Fix!' : '❌ Incorrect Fix'}
                </div>
                <div style={styles.feedbackText}>
                  <strong>Bug:</strong> {feedback.bugDescription}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fix Modal */}
        {showFixModal && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2 style={styles.modalTitle}>Submit Your Fix</h2>
              <p style={styles.modalDescription}>
                Edit the code below to fix the bug you found:
              </p>
              <CodeEditor
                code={fixedCode}
                onChange={setFixedCode}
                language={room.currentCode.language}
                height="400px"
              />
              <div style={styles.modalActions}>
                <button onClick={handleSubmitFix} style={styles.submitButton}>
                  Submit Fix
                </button>
                <button
                  onClick={() => setShowFixModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    overflow: 'auto'
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)'
  },
  roundInfo: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#667eea'
  },
  main: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '24px',
    alignItems: 'start'
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'sticky',
    top: '20px'
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  roleTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#1f2937'
  },
  roleContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  roleIcon: {
    fontSize: '48px'
  },
  roleName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px'
  },
  roleDescription: {
    fontSize: '14px',
    color: '#6b7280'
  },
  codeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  codeHeader: {
    backgroundColor: 'white',
    padding: '16px 20px',
    borderRadius: '12px 12px 0 0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  codeTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  feedback: {
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  feedbackSuccess: {
    backgroundColor: '#d1fae5',
    border: '2px solid #10b981'
  },
  feedbackError: {
    backgroundColor: '#fee2e2',
    border: '2px solid #ef4444'
  },
  feedbackTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  feedbackText: {
    fontSize: '14px',
    color: '#374151'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#1f2937'
  },
  modalDescription: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '20px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px'
  },
  submitButton: {
    flex: 1,
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  loading: {
    color: 'white',
    fontSize: '20px',
    textAlign: 'center',
    marginTop: '100px'
  }
};

// Add media query for responsive layout
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(max-width: 1024px)');
  if (mediaQuery.matches) {
    styles.main.gridTemplateColumns = '1fr';
    styles.leftPanel.position = 'static';
  }
}

export default Game;
