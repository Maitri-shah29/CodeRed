// Utility functions for the game server

/**
 * Generate a random room code
 * @returns {string} 6-character room code
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a unique player ID
 * @returns {string} Unique player ID
 */
function generatePlayerId() {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Select a random element from an array
 * @param {Array} array - Array to select from
 * @returns {*} Random element
 */
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Validate player name
 * @param {string} name - Player name to validate
 * @returns {boolean} Whether name is valid
 */
function isValidPlayerName(name) {
  return name && 
         typeof name === 'string' && 
         name.trim().length >= 2 && 
         name.trim().length <= 20;
}

/**
 * Validate room code format
 * @param {string} code - Room code to validate
 * @returns {boolean} Whether code format is valid
 */
function isValidRoomCode(code) {
  return code && 
         typeof code === 'string' && 
         /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Calculate time remaining in seconds
 * @param {number} endTime - End timestamp
 * @returns {number} Seconds remaining
 */
function getTimeRemaining(endTime) {
  const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  return remaining;
}

/**
 * Format time in MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
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
