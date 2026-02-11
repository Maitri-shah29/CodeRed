# CodeRed

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
S