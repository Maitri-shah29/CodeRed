#!/bin/bash

# CodeRed Setup Script
# This script installs all dependencies for both server and client

echo "🚀 Setting up CodeRed..."
echo ""

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

echo ""
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the game:"
echo "  1. Start server: cd server && npm start"
echo "  2. Start client: cd client && npm start (in a new terminal)"
echo ""
