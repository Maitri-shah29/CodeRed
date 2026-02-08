// Result page
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../socket';

function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode, playerId, playerName, room: initialRoom } = location.state || {};

  const [room, setRoom] = useState(initialRoom);

  useEffect(() => {
    if (!roomCode || !playerId || !room) {
      navigate('/');
      return;
    }

    socket.on('gameReset', ({ room: updatedRoom }) => {
      navigate('/lobby', {
        state: {
          roomCode,
          playerId,
          playerName,
          isHost: updatedRoom.hostId === playerId
        }
      });
    });

    socket.on('playerLeft', ({ room: updatedRoom }) => {
      setRoom(updatedRoom);
      if (!updatedRoom.players.find((p) => p.id === playerId)) {
        navigate('/');
      }
    });

    return () => {
      socket.off('gameReset');
      socket.off('playerLeft');
    };
  }, [roomCode, playerId, playerName, navigate, room]);

  const handlePlayAgain = () => {
    socket.emit('playAgain', (response) => {
      if (!response.success) {
        alert('Failed to restart game');
      }
    });
  };

  const handleLeave = () => {
    socket.disconnect();
    navigate('/');
  };

  if (!room) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading results...</div>
      </div>
    );
  }

  // Sort players by score
  const sortedPlayers = [...room.players].sort((a, b) => {
    return (room.scores[b.id] || 0) - (room.scores[a.id] || 0);
  });

  const winner = sortedPlayers[0];
  const isCurrentPlayerWinner = winner?.id === playerId;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎉 Game Over!</h1>
          {winner && (
            <div style={styles.winnerCard}>
              <div style={styles.winnerIcon}>👑</div>
              <div style={styles.winnerInfo}>
                <div style={styles.winnerLabel}>Winner</div>
                <div style={styles.winnerName}>
                  {winner.name}
                  {isCurrentPlayerWinner && ' (You!)'}
                </div>
                <div style={styles.winnerScore}>
                  {room.scores[winner.id]} points
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.main}>
          <div style={styles.leaderboard}>
            <h2 style={styles.leaderboardTitle}>Final Scores</h2>
            <div style={styles.leaderboardList}>
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    ...styles.leaderboardItem,
                    ...(player.id === playerId ? styles.currentPlayerItem : {}),
                    ...(index === 0 ? styles.firstPlace : {}),
                    ...(index === 1 ? styles.secondPlace : {}),
                    ...(index === 2 ? styles.thirdPlace : {})
                  }}
                >
                  <div style={styles.rank}>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  <div style={styles.playerInfo}>
                    <div style={styles.playerName}>
                      {player.name}
                      {player.id === playerId && (
                        <span style={styles.youBadge}>You</span>
                      )}
                    </div>
                  </div>
                  <div style={styles.score}>{room.scores[player.id] || 0}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.stats}>
            <h3 style={styles.statsTitle}>Game Stats</h3>
            <div style={styles.statsList}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Rounds:</span>
                <span style={styles.statValue}>{room.totalRounds}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Players:</span>
                <span style={styles.statValue}>{room.players.length}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Room Code:</span>
                <span style={styles.statValue}>{roomCode}</span>
              </div>
            </div>
          </div>

          <div style={styles.actions}>
            <button onClick={handlePlayAgain} style={styles.playAgainButton}>
              🔄 Play Again
            </button>
            <button onClick={handleLeave} style={styles.leaveButton}>
              🚪 Leave Game
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
    maxWidth: '700px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '24px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)'
  },
  winnerCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    border: '3px solid #fbbf24'
  },
  winnerIcon: {
    fontSize: '64px'
  },
  winnerInfo: {
    textAlign: 'left'
  },
  winnerLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px'
  },
  winnerName: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px'
  },
  winnerScore: {
    fontSize: '20px',
    color: '#f59e0b',
    fontWeight: '600'
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  leaderboard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  leaderboardTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '20px'
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid transparent',
    transition: 'all 0.2s'
  },
  currentPlayerItem: {
    backgroundColor: '#ede9fe',
    border: '2px solid #8b5cf6'
  },
  firstPlace: {
    backgroundColor: '#fef3c7'
  },
  secondPlace: {
    backgroundColor: '#f3f4f6'
  },
  thirdPlace: {
    backgroundColor: '#fef2f2'
  },
  rank: {
    fontSize: '32px',
    fontWeight: 'bold',
    minWidth: '60px',
    textAlign: 'center'
  },
  playerInfo: {
    flex: 1
  },
  playerName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  youBadge: {
    fontSize: '12px',
    color: '#8b5cf6',
    backgroundColor: '#ede9fe',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '600'
  },
  score: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#059669'
  },
  stats: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  statsTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '16px'
  },
  statsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '16px'
  },
  statLabel: {
    color: '#6b7280'
  },
  statValue: {
    fontWeight: '600',
    color: '#1f2937'
  },
  actions: {
    display: 'flex',
    gap: '12px'
  },
  playAgainButton: {
    flex: 1,
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
    transition: 'transform 0.2s'
  },
  leaveButton: {
    flex: 1,
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#ef4444',
    backgroundColor: 'white',
    border: '2px solid #ef4444',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  loading: {
    color: 'white',
    fontSize: '20px',
    textAlign: 'center'
  }
};

export default Result;
