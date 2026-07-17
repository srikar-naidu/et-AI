#!/bin/bash

# Comprehensive setup and initialization script
# This script sets up the entire environment and seeds data

set -e

echo "=========================================="
echo "Public Safety Command Center - Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Node.js and Python found"
echo ""

# Step 1: Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install
echo "✅ Node.js dependencies installed"
echo ""

# Step 2: Setup ML service
echo "📦 Setting up ML service dependencies..."
cd ml-service
pip install --quiet -r requirements.txt
cd ..
echo "✅ ML service dependencies installed"
echo ""

# Step 3: Verify environment
echo "🔍 Verifying environment configuration..."
if grep -q "COUNTERFEIT_MODEL_API_URL=http://localhost:8000" .env.local; then
    echo "✅ Counterfeit model URL configured"
else
    echo "❌ COUNTERFEIT_MODEL_API_URL not properly configured"
fi

if grep -q "GROQ_API_KEY=gsk_" .env.local; then
    echo "✅ Groq API key configured"
else
    echo "⚠️  Groq API key missing - voice analysis will fail"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    echo "✅ Supabase configured"
else
    echo "❌ Supabase not configured"
    exit 1
fi
echo ""

# Step 4: Show startup instructions
echo "=========================================="
echo "Setup Complete! 🎉"
echo "=========================================="
echo ""
echo "To start the development environment:"
echo ""
echo "Option 1: Automatic (recommended)"
echo "  bash start-dev.sh"
echo ""
echo "Option 2: Manual (in separate terminals)"
echo "  Terminal 1: npm run dev"
echo "  Terminal 2: cd ml-service && uvicorn mock_app:app --reload --port 8000"
echo ""
echo "After starting, seed the database:"
echo "  curl -X POST http://localhost:3000/api/seed/demo-data"
echo ""
echo "=========================================="
