@echo off
REM Comprehensive setup and initialization script for Windows

setlocal enabledelayedexpansion

echo ==========================================
echo Public Safety Command Center - Setup
echo ==========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo X Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo X Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

echo OK Node.js and Python found
echo.

REM Step 1: Install dependencies
echo [*] Installing Node.js dependencies...
call npm install
echo OK Node.js dependencies installed
echo.

REM Step 2: Setup ML service
echo [*] Setting up ML service dependencies...
cd ml-service
pip install -q -r requirements.txt
cd ..
echo OK ML service dependencies installed
echo.

REM Step 3: Verify environment
echo [*] Verifying environment configuration...
findstr /M "COUNTERFEIT_MODEL_API_URL=http://localhost:8000" .env.local >nul
if !errorlevel! equ 0 (
    echo OK Counterfeit model URL configured
) else (
    echo X COUNTERFEIT_MODEL_API_URL not properly configured
)

findstr /M "GROQ_API_KEY=gsk_" .env.local >nul
if !errorlevel! equ 0 (
    echo OK Groq API key configured
) else (
    echo ^! Groq API key missing - voice analysis will fail
)

findstr /M "NEXT_PUBLIC_SUPABASE_URL" .env.local >nul
if !errorlevel! equ 0 (
    echo OK Supabase configured
) else (
    echo X Supabase not configured
    pause
    exit /b 1
)
echo.

REM Step 4: Show startup instructions
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo To start the development environment:
echo.
echo Option 1: Automatic
echo   start-dev.bat
echo.
echo Option 2: Manual (in separate terminals^)
echo   Terminal 1: npm run dev
echo   Terminal 2: cd ml-service ^&^& uvicorn mock_app:app --reload --port 8000
echo.
echo After starting, seed the database:
echo   curl -X POST http://localhost:3000/api/seed/demo-data
echo.
echo ==========================================
pause
