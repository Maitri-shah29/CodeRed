function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generatePlayerId() {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function isValidPlayerName(name) {
  return name && 
         typeof name === 'string' && 
         name.trim().length >= 2 && 
         name.trim().length <= 20;
}

function isValidRoomCode(code) {
  return code && 
         typeof code === 'string' && 
         /^[A-Z0-9]{6}$/.test(code);
}

function getTimeRemaining(endTime) {
  const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  return remaining;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
  generateRoomCode,
  generatePlayerId,
  shuffleArray,
  randomElement,
  isValidPlayerName,
  isValidRoomCode,
  getTimeRemaining,
  formatTime
};
