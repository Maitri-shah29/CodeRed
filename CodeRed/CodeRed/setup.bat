@echo off
REM CodeRed Setup Script for Windows
REM This script installs all dependencies for both server and client

echo Setting up CodeRed...
echo.

REM Install server dependencies
echo Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo Installing client dependencies...
cd client
call npm install
cd ..

echo.
echo Setup complete!
echo.
echo To start the game:
echo   1. Start server: cd server ^&^& npm start
echo   2. Start client: cd client ^&^& npm start (in a new terminal)
echo.
pause
