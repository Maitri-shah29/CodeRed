import React, { useState } from 'react';

function Buzzer({ onBuzz, disabled = false, buzzedPlayer = null }) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleBuzz = () => {
    if (!disabled) {
      setIsAnimating(true);
      onBuzz();
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <div style={styles.container}>
      {buzzedPlayer ? (
        <div style={styles.buzzedMessage}>
          <span style={styles.buzzIcon}>🚨</span>
          <span>{buzzedPlayer} buzzed!</span>
        </div>
      ) : (
        <button
          onClick={handleBuzz}
          disabled={disabled}
          style={{
            ...styles.buzzer,
            ...(disabled ? styles.buzzerDisabled : {}),
            ...(isAnimating ? styles.buzzerAnimating : {})
          }}
        >
          <span style={styles.buzzerIcon}>🔔</span>
          <span style={styles.buzzerText}>BUZZ!</span>
          <span style={styles.buzzerSubtext}>Found a bug?</span>
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  buzzer: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 8px 16px rgba(239, 68, 68, 0.4)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    outline: 'none'
  },
  buzzerDisabled: {
    background: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    opacity: 0.6
  },
  buzzerAnimating: {
    transform: 'scale(0.9)',
    boxShadow: '0 4px 8px rgba(239, 68, 68, 0.6)'
  },
  buzzerIcon: {
    fontSize: '48px'
  },
  buzzerText: {
    fontSize: '28px',
    fontWeight: 'bold'
  },
  buzzerSubtext: {
    fontSize: '12px',
    fontWeight: 'normal',
    opacity: 0.9
  },
  buzzedMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '12px',
    fontSize: '20px',
    fontWeight: '600',
    color: '#92400e'
  },
  buzzIcon: {
    fontSize: '32px'
  }
};

export default Buzzer;
