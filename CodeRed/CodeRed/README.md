# CodeRed - Bug Hunting Game 🐛🔴

A real-time multiplayer game where players compete to find and fix bugs in code!

## Game Overview

- **Players**: 3-6 players per room
- **Roles**: Debuggers (fix bugs) vs Bugger (introduces bugs)
- **Rounds**: Multiple rounds with role rotation
- **Objective**: Debuggers find bugs faster than the Bugger can introduce them

## Features

- Real-time multiplayer using Socket.IO
- Code editor with syntax highlighting
- Buzzer system for bug detection
- Timer-based rounds
- Score tracking
- Responsive UI

## Tech Stack

**Frontend:**
- React
- Socket.IO Client
- Monaco Editor (code editor)
- React Router

**Backend:**
- Node.js
- Express
- Socket.IO

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Quick Setup

**Option 1: Automatic Setup (Recommended)**

**For Mac/Linux:**
```bash
cd CodeRed
./setup.sh
```

**For Windows:**
```bash
cd CodeRed
setup.bat
```

**Option 2: Manual Setup**

1. Install server dependencies
```bash
cd server
npm install
```

2. Install client dependencies
```bash
cd client
npm install
```

**Note:** `node_modules` folders will be created separately in the `server/` and `client/` directories during installation. These folders are gitignored and not included in the zip file to keep the download size small.

## Running the Game

### Start the server
```bash
cd server
npm start
```
Server will run on `http://localhost:3001`

### Start the client (in a new terminal)
```bash
cd client
npm start
```
Client will run on `http://localhost:3000`

## How to Play

1. **Landing Page**: Enter your name and create/join a room
2. **Lobby**: Wait for players (3-6) and start the game
3. **Game**: 
   - **Debuggers**: Watch the code, buzz when you spot a bug, fix it
   - **Bugger**: Introduce subtle bugs without being caught
4. **Results**: See scores and play again

## Game Rules

- Debuggers earn points for correctly identifying and fixing bugs
- Bugger earns points for bugs that go undetected
- False buzzes result in point penalties
- Roles rotate each round

## Project Structure

```
CodeRed/
├── server/                # Node.js backend
│   ├── index.js          # Server entry point
│   ├── gameState.js      # Game state management
│   ├── socketHandlers.js # Socket event handlers
│   ├── utils.js          # Helper functions
│   ├── package.json      # Server dependencies
│   └── node_modules/     # (Created after npm install)
│
├── client/               # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/       # Main screens
│   │   ├── components/  # Reusable components
│   │   ├── socket.js    # Socket.IO setup
│   │   ├── App.jsx      # Route controller
│   │   └── index.js
│   ├── package.json     # Client dependencies
│   └── node_modules/    # (Created after npm install)
│
├── setup.sh             # Setup script for Mac/Linux
├── setup.bat            # Setup script for Windows
├── .gitignore
└── README.md
```

## Development

### Adding New Features
- Code samples: Edit `server/gameState.js`
- UI components: Add to `client/src/components/`
- Game logic: Modify `server/socketHandlers.js`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
