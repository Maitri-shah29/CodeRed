import React, { useState, useEffect, useRef } from 'react';

function RoleReveal({ role, onComplete }) {
  const [phase, setPhase] = useState('intro');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const isBugger = role === 'bugger';
  
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1500);
    const t2 = setTimeout(() => setPhase('briefing'), 3000);
    const t3 = setTimeout(() => setPhase('fade'), 5000);
    const t4 = setTimeout(() => {
      if (onCompleteRef.current) onCompleteRef.current();
    }, 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []); 
  return (
    <div className={`role-reveal-overlay ${phase}`}>
      <div className="role-reveal-container">
        {phase === 'intro' && (
          <div className="intro-text">
            <span className="glitch-text">ASSIGNING ROLE</span>
            <div className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}

        {(phase === 'reveal' || phase === 'briefing' || phase === 'fade') && (
          <div className={`role-card ${isBugger ? 'bugger' : 'debugger'}`}>
            <div className="role-icon">
              {isBugger ? '🐛' : '🔍'}
            </div>
            <h1 className="role-title">
              {isBugger ? 'BUGGER' : 'DEBUGGER'}
            </h1>
            <div className="role-subtitle">
              {isBugger ? 'You are the Imposter' : 'You are a Crewmate'}
            </div>
            
            {(phase === 'briefing' || phase === 'fade') && (
              <div className="mission-briefing">
                <div className="briefing-title">MISSION BRIEFING</div>
                <p className="briefing-text">
                  {isBugger 
                    ? 'Sabotage the code without getting caught. Blend in with the debuggers.'
                    : 'Find and fix the bugs. Vote out the bugger before time runs out.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        .role-reveal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #0a0e27;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          font-family: 'Press Start 2P', monospace;
          transition: opacity 0.5s ease;
        }

        .role-reveal-overlay.fade {
          opacity: 0;
        }

        .role-reveal-container {
          text-align: center;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .intro-text {
          color: #00ff88;
          font-size: 1.5rem;
          text-shadow: 0 0 20px #00ff88;
        }

        .glitch-text {
          animation: glitch 0.3s infinite;
          display: block;
          margin-bottom: 20px;
        }

        @keyframes glitch {
          0% { text-shadow: 2px 0 #ff3366, -2px 0 #00ddff; }
          25% { text-shadow: -2px 0 #ff3366, 2px 0 #00ddff; }
          50% { text-shadow: 2px -2px #ff3366, -2px 2px #00ddff; }
          75% { text-shadow: -2px -2px #ff3366, 2px 2px #00ddff; }
          100% { text-shadow: 2px 0 #ff3366, -2px 0 #00ddff; }
        }

        .loading-dots span {
          animation: blink 1.4s infinite both;
          font-size: 2rem;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }

        .role-card {
          padding: 40px 60px;
          border-radius: 12px;
          animation: cardReveal 0.8s ease;
        }

        .role-card.bugger {
          background: rgba(255, 51, 102, 0.1);
          border: 3px solid #ff3366;
          box-shadow: 0 0 50px rgba(255, 51, 102, 0.4);
        }

        .role-card.debugger {
          background: rgba(0, 255, 136, 0.1);
          border: 3px solid #00ff88;
          box-shadow: 0 0 50px rgba(0, 255, 136, 0.4);
        }

        @keyframes cardReveal {
          0% { transform: rotateY(90deg) scale(0.5); opacity: 0; }
          100% { transform: rotateY(0) scale(1); opacity: 1; }
        }

        .role-icon {
          font-size: 5rem;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .role-title {
          font-size: 2.5rem;
          margin: 0 0 10px 0;
          letter-spacing: 4px;
        }

        .role-card.bugger .role-title {
          color: #ff3366;
          text-shadow: 0 0 20px #ff3366;
        }

        .role-card.debugger .role-title {
          color: #00ff88;
          text-shadow: 0 0 20px #00ff88;
        }

        .role-subtitle {
          font-size: 0.8rem;
          color: #888;
          letter-spacing: 2px;
        }

        .mission-briefing {
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          animation: slideUp 0.5s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .briefing-title {
          font-size: 0.7rem;
          color: #00ddff;
          letter-spacing: 3px;
          margin-bottom: 15px;
        }

        .briefing-text {
          font-size: 0.6rem;
          color: #aaa;
          line-height: 2;
          max-width: 400px;
          margin: 0 auto;
        }

        @media (max-width: 600px) {
          .role-title { font-size: 1.5rem; }
          .role-icon { font-size: 3rem; }
          .role-card { padding: 30px 40px; }
        }
      `}</style>
    </div>
  );
}

export default RoleReveal;
