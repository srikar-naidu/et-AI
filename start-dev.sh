#!/bin/bash

# Quick startup script for local development

echo "[1/3] Starting Next.js dev server on port 3000..."
npm run dev &
NEXT_PID=$!

echo "[2/3] Waiting for Next.js to start..."
sleep 5

echo "[3/3] Starting mock ML service on port 8000..."
cd ml-service
uvicorn mock_app:app --reload --port 8000 &
ML_PID=$!

echo ""
echo "========================================"
echo "Public Safety Command Center"
echo "========================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "ML Service: http://localhost:8000"
echo ""
echo "Next steps:"
echo "1. Wait for both services to fully start"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Go to any feature tab to test"
echo "4. Check /api/health for service status"
echo ""
echo "To seed demo data:"
echo "  curl -X POST http://localhost:3000/api/seed/demo-data"
echo ""
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all services"
wait
