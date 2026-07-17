@echo off
REM Service Health Check and Verification Script for Windows

setlocal enabledelayedexpansion

set BASE_URL=http://localhost:3000
set ML_URL=http://localhost:8000

echo ==========================================
echo Service Health Check
echo ==========================================
echo.

echo === Frontend API === 
echo Testing Health Check...
curl -s "%BASE_URL%/api/health" >nul 2>&1 && echo OK or check Supabase connection

echo Testing Graph Endpoint...
curl -s "%BASE_URL%/api/graph" >nul 2>&1 && echo OK or seeded data needed

echo Testing Cases Endpoint...
curl -s "%BASE_URL%/api/cases" >nul 2>&1 && echo OK or seeded data needed
echo.

echo === ML Service === 
echo Testing ML Service Health...
curl -s "%ML_URL%/health" >nul 2>&1 && echo OK or service not running
echo.

echo === Optional: Data Seeding === 
echo Testing seed endpoint...
curl -s -X POST "%BASE_URL%/api/seed/demo-data" >nul 2>&1 && echo OK - data seeded or Supabase issue
echo.

echo ==========================================
echo Check Results Summary
echo ==========================================
echo.
echo If tests pass:
echo   1. Go to http://localhost:3000 in your browser
echo   2. Test each feature:
echo      - Voice Shield: Transcribe a call
echo      - Counterfeit Scanner: Upload a currency image
echo      - Fraud Network: View the graph visualization
echo      - Case Console: Select and manage cases
echo.
echo If any service fails:
echo   1. Ensure all services are running (see SETUP.md^)
echo   2. Check .env.local for correct URLs
echo   3. Verify Supabase connectivity
echo.
echo ==========================================
pause
