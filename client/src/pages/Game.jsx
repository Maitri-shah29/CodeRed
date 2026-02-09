import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import socket from "../socket";
import CodeEditor from "../components/CodeEditor";
import { Bell, LogOut } from "lucide-react";

function Game() {
  // Intercept browser back navigation and trigger leave logic
  useEffect(() => {
    const onPopState = (e) => {
      e.preventDefault();
      handleLeaveRoom();
      window.history.pushState(null, "", window.location.pathname);
    };
    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    roomCode,
    playerId,
    playerName,
    room: initialRoom,
  } = location.state || {};

  const [room, setRoom] = useState(initialRoom);
  const [code, setCode] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [buzzedPlayerName, setBuzzedPlayerName] = useState(null);
  const [showFixModal, setShowFixModal] = useState(false);
  const [fixedCode, setFixedCode] = useState("");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!roomCode || !playerId || !room) {
      navigate("/");
      return;
    }

    if (room.currentCode) {
      if (getCurrentPlayer()?.role === "bugger") {
        setCode(room.currentCode.currentBug.buggedCode);
      } else {
        setCode(room.currentCode.currentBug.buggedCode);
      }
    }

    socket.on("timerUpdate", ({ remaining }) => {
      setTimeRemaining(remaining);
    });

    socket.on("playerBuzzed", ({ playerId: buzzerId, playerName }) => {
      setBuzzedPlayerName(playerName);

      if (buzzerId === playerId) {
        setShowFixModal(true);
        setFixedCode(code);
      }
    });

    socket.on("codeUpdated", ({ code: newCode }) => {
      setCode(newCode);
    });

    socket.on(
      "fixSubmitted",
      ({ playerId: submitterId, isCorrect, correctCode, bugDescription }) => {
        setFeedback({
          isCorrect,
          correctCode,
          bugDescription,
          submittedBy: submitterId,
        });
        setBuzzedPlayerName(null);
        setShowFixModal(false);

        setTimeout(() => {
          setFeedback(null);
        }, 5000);
      },
    );

    socket.on("roundEnded", ({ room: updatedRoom }) => {
      setRoom(updatedRoom);
    });

    socket.on("roundStarted", ({ room: updatedRoom }) => {
      setRoom(updatedRoom);
      setBuzzedPlayerName(null);
      setShowFixModal(false);
      setFeedback(null);

      if (updatedRoom.currentCode) {
        const currentPlayer = updatedRoom.players.find(
          (p) => p.id === playerId,
        );
        if (currentPlayer?.role === "bugger") {
          setCode(updatedRoom.currentCode.currentBug.buggedCode);
        } else {
          setCode(updatedRoom.currentCode.currentBug.buggedCode);
        }
      }
    });

    socket.on("gameEnded", ({ room: updatedRoom }) => {
      navigate("/result", {
        state: {
          roomCode,
          playerId,
          playerName,
          room: updatedRoom,
        },
      });
    });

    socket.on("playerLeft", ({ room: updatedRoom }) => {
      setRoom(updatedRoom);
    });

    return () => {
      socket.off("timerUpdate");
      socket.off("playerBuzzed");
      socket.off("codeUpdated");
      socket.off("fixSubmitted");
      socket.off("roundEnded");
      socket.off("roundStarted");
      socket.off("gameEnded");
      socket.off("playerLeft");
    };
  }, [roomCode, playerId, navigate, room, code, playerName]);

  const getCurrentPlayer = () => {
    return room?.players.find((p) => p.id === playerId);
  };

  const handleBuzz = () => {
    socket.emit("buzz", (response) => {
      if (!response.success) {
        alert(response.error || "Failed to buzz");
      }
    });
  };

  const handleSubmitFix = () => {
    socket.emit("submitFix", { fixedCode }, (response) => {
      if (!response.success) {
        alert("Failed to submit fix");
      }
    });
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);

    if (getCurrentPlayer()?.role === "bugger") {
      socket.emit("submitBug", { buggedCode: newCode });
    }
  };

  const handleLeaveRoom = () => {
    if (window.confirm("Are you sure you want to leave the game?")) {
      socket.disconnect();
      navigate("/");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!room) {
    return (
      <div className="game-container">
        <div className="loading">Loading game...</div>
        <style>{`
          .game-container {
            min-height: 100vh;
            background: #0a0e27;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading {
            color: #00ff88;
            font-size: 20px;
            font-family: "Share Tech Mono", monospace;
          }
        `}</style>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer();
  const isBugger = currentPlayer?.role === "bugger";
  const canBuzz = !isBugger && !buzzedPlayerName;

  const bugsList = room.currentCode?.currentBug
    ? [
        { id: 1, title: "Off-by-one error", location: "calculateTotal loop" },
        { id: 2, title: "Missing async/await", location: "fetchUserData" },
        { id: 3, title: "No input sanitization", location: "sanitizeInput" },
        {
          id: 4,
          title: "Potential prototype pollution",
          location: "mergeObjects",
        },
      ]
    : [];

  const playerColors = ["#00ddff", "#00ff88", "#dd00ff", "#ffcc00"];

  return (
    <div className="game-container">
      <div className="top-bar">
        <div className="left">
          <span className="title">CODERED</span>
          <span className="status">● ONLINE</span>
        </div>
        <div className="right">
          <span className="room-code">ROOM: #{roomCode}</span>
          <span className="role-badge">
            {isBugger ? "BUGGER" : "DEVELOPER"}
          </span>
        </div>
      </div>

      <div className="game-header">
        <div className="timer-display">
          <span className="timer-icon">⏱</span>
          <span className="timer-text">{formatTime(timeRemaining)}</span>
        </div>

        <div className="header-right">
          <div className="players-display">
            {room.players.slice(0, 4).map((player, idx) => (
              <div
                key={player.id}
                className="player-dot"
                style={{ backgroundColor: playerColors[idx] }}
                title={player.name}
              />
            ))}
          </div>

          <div className="bugs-counter">
            <span className="bug-emoji">🐛</span>
            <span className="count">{bugsList.length}</span>
            <span className="label">BUGS</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="left-panel">
          <div className="bugs-panel">
            <div className="panel-header">
              <span className="icon">🐛</span>
              <span>BUGS TO REMOVE</span>
            </div>
            <div className="bugs-list">
              {bugsList.map((bug) => (
                <div key={bug.id} className="bug-item">
                  <span className="bug-icon">🐛</span>
                  <div className="bug-info">
                    <div className="bug-title">{bug.title}</div>
                    <div className="bug-location">in {bug.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isBugger && (
            <div className="tools-panel">
              <div className="panel-header purple">
                <span className="icon">🔧</span>
                <span>DEVELOPER TOOLS</span>
              </div>
              <div className="tools-content">
                <p className="tools-text">
                  You have ONE chance to reveal a bug:
                </p>
                <button className="reveal-btn">
                  <span className="icon">👁</span>
                  REVEAL BUG
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="center-panel">
          <div className="code-editor-container">
            {room.currentCode && (
              <CodeEditor
                code={code}
                onChange={handleCodeChange}
                language={room.currentCode.language}
                height="calc(100vh - 180px)"
                roomCode={roomCode}
                playerId={playerId}
                playerName={playerName}
                playerColor={playerColors[room.players.findIndex(p => p.id === playerId) % playerColors.length] || '#00ff88'}
              />
            )}
          </div>
        </div>
      </div>

      {!isBugger && (
        <div className="buzzer-section">
          <button
            className={`buzzer-button ${!canBuzz ? "disabled" : ""}`}
            onClick={handleBuzz}
            disabled={!canBuzz}
          >
            <Bell size={40} />
          </button>
          <div className="buzzer-text">
            {buzzedPlayerName
              ? `${buzzedPlayerName} is fixing...`
              : "Press to pause & start voting"}
          </div>
          <button className="leave-btn" onClick={handleLeaveRoom}>
            <LogOut size={18} />
            LEAVE ROOM
          </button>
        </div>
      )}

      {showFixModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Submit Your Fix</h2>
            <p>Edit the code below to fix the bug you found:</p>
            <CodeEditor
              code={fixedCode}
              onChange={setFixedCode}
              language={room.currentCode.language}
              height="400px"
            />
            <div className="modal-actions">
              <button onClick={handleSubmitFix} className="submit-btn">
                Submit Fix
              </button>
              <button
                onClick={() => setShowFixModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className={`feedback ${feedback.isCorrect ? "success" : "error"}`}>
          <div className="feedback-title">
            {feedback.isCorrect ? "✅ Correct Fix!" : "❌ Incorrect Fix"}
          </div>
          <div className="feedback-text">
            <strong>Bug:</strong> {feedback.bugDescription}
          </div>
        </div>
      )}

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap");

        .game-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          color: #00ff88;
          font-family: "Share Tech Mono", monospace;
          position: relative;
          overflow: hidden;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 30px;
          border-bottom: 2px solid #00ff88;
          background: rgba(0, 255, 136, 0.05);
        }

        .top-bar .left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .top-bar .title {
          font-size: 20px;
          font-weight: bold;
          letter-spacing: 2px;
          color: #00ff88;
          text-shadow: 0 0 10px #00ff88;
        }

        .top-bar .status {
          font-size: 12px;
          color: #00ff88;
        }

        .top-bar .right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .top-bar .room-code {
          font-size: 14px;
          color: #999;
        }

        .top-bar .role-badge {
          background: #00ff88;
          color: #0a0e27;
          padding: 5px 15px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: bold;
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          gap: 20px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .main-content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
          padding: 20px;
          height: calc(100vh - 140px);
        }

        .left-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .bugs-panel,
        .tools-panel {
          border: 2px solid #00ff88;
          border-radius: 8px;
          background: rgba(0, 255, 136, 0.05);
          overflow: hidden;
        }

        .tools-panel {
          border-color: #dd00ff;
          background: rgba(221, 0, 255, 0.05);
        }

        .panel-header {
          background: rgba(0, 255, 136, 0.1);
          padding: 12px 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 2px solid #00ff88;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .panel-header.purple {
          background: rgba(221, 0, 255, 0.1);
          border-bottom-color: #dd00ff;
          color: #dd00ff;
        }

        .panel-header .icon {
          font-size: 16px;
        }

        .bugs-list {
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .bug-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .bug-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .bug-info {
          flex: 1;
        }

        .bug-title {
          color: #00ff88;
          font-size: 11px;
          line-height: 1.4;
          margin-bottom: 3px;
        }

        .bug-location {
          color: #666;
          font-size: 10px;
        }

        .tools-content {
          padding: 15px;
        }

        .tools-text {
          color: #999;
          font-size: 11px;
          margin-bottom: 15px;
          line-height: 1.5;
        }

        .reveal-btn {
          width: 100%;
          background: rgba(221, 0, 255, 0.2);
          border: 2px solid #dd00ff;
          color: #dd00ff;
          padding: 12px;
          border-radius: 5px;
          font-family: "Share Tech Mono", monospace;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .reveal-btn:hover {
          background: rgba(221, 0, 255, 0.3);
          box-shadow: 0 0 20px rgba(221, 0, 255, 0.5);
        }

        .center-panel {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .timer-display {
          border: 2px solid #00ddff;
          border-radius: 8px;
          padding: 10px 25px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0, 221, 255, 0.05);
        }

        .timer-icon {
          font-size: 20px;
        }

        .timer-text {
          font-size: 24px;
          font-weight: bold;
          color: #00ddff;
          letter-spacing: 2px;
        }

        .code-editor-container {
          flex: 1;
          border: 2px solid #00ff88;
          border-radius: 8px;
          overflow: hidden;
          background: #1e1e1e;
        }

        .players-display {
          display: flex;
          gap: 8px;
        }

        .player-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 10px currentColor;
        }

        .bugs-counter {
          border: 2px solid #ffcc00;
          border-radius: 8px;
          padding: 8px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 204, 0, 0.05);
        }

        .bugs-counter .bug-emoji {
          font-size: 20px;
        }

        .bugs-counter .count {
          font-size: 20px;
          font-weight: bold;
          color: #ffcc00;
        }

        .bugs-counter .label {
          font-size: 12px;
          color: #ffcc00;
          letter-spacing: 1px;
        }

        .buzzer-section {
          position: fixed;
          bottom: 30px;
          left: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          z-index: 100;
        }

        .buzzer-button {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 4px solid #ff3366;
          background: radial-gradient(
            circle,
            #ff6b6b 0%,
            #ff3366 50%,
            #cc0033 100%
          );
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow:
            0 0 40px rgba(255, 51, 102, 0.6),
            inset 0 0 20px rgba(255, 255, 255, 0.2);
        }

        .buzzer-button:hover:not(.disabled) {
          transform: scale(1.05);
          box-shadow:
            0 0 50px rgba(255, 51, 102, 0.8),
            inset 0 0 25px rgba(255, 255, 255, 0.3);
        }

        .buzzer-button:active:not(.disabled) {
          transform: scale(0.95);
        }

        .buzzer-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #666;
          border-color: #444;
          box-shadow: none;
        }

        .buzzer-text {
          color: #999;
          font-size: 11px;
          text-align: center;
          max-width: 150px;
        }

        .leave-btn {
          background: transparent;
          border: 2px solid #ff3366;
          color: #ff3366;
          padding: 10px 20px;
          border-radius: 5px;
          font-family: "Share Tech Mono", monospace;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .leave-btn:hover {
          background: rgba(255, 51, 102, 0.1);
          box-shadow: 0 0 15px rgba(255, 51, 102, 0.5);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: #1a1f3a;
          border: 2px solid #00ff88;
          border-radius: 8px;
          padding: 30px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow: auto;
        }

        .modal-content h2 {
          color: #00ff88;
          font-size: 24px;
          margin-bottom: 10px;
        }

        .modal-content p {
          color: #999;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          margin-top: 20px;
        }

        .submit-btn,
        .cancel-btn {
          flex: 1;
          padding: 15px;
          border-radius: 5px;
          font-family: "Share Tech Mono", monospace;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-btn {
          background: #00ff88;
          border: none;
          color: #0a0e27;
        }

        .submit-btn:hover {
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }

        .cancel-btn {
          background: transparent;
          border: 2px solid #666;
          color: #999;
        }

        .cancel-btn:hover {
          border-color: #00ff88;
          color: #00ff88;
        }

        .feedback {
          position: fixed;
          top: 80px;
          right: 220px;
          padding: 20px;
          border-radius: 8px;
          max-width: 350px;
          z-index: 200;
          animation: slideIn 0.3s ease;
        }

        .feedback.success {
          background: rgba(0, 255, 136, 0.1);
          border: 2px solid #00ff88;
          color: #00ff88;
        }

        .feedback.error {
          background: rgba(255, 51, 102, 0.1);
          border: 2px solid #ff3366;
          color: #ff3366;
        }

        .feedback-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .feedback-text {
          font-size: 12px;
          color: #999;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default Game;
