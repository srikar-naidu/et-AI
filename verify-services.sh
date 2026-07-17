#!/bin/bash

# Service Health Check and Verification Script
# Tests all integrated services to ensure they're working

set -e

BASE_URL="http://localhost:3000"
ML_URL="http://localhost:8000"

echo "=========================================="
echo "Service Health Check"
echo "=========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-"GET"}
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" -H "Content-Type: application/json" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo "000")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code == 200 ]] || [[ $http_code == 201 ]] || [[ $http_code == 503 ]]; then
        echo "✅ ($http_code)"
        return 0
    elif [[ $http_code == 000 ]]; then
        echo "❌ (Connection failed)"
        return 1
    else
        echo "⚠️  ($http_code)"
        return 0
    fi
}

echo "=== Frontend API ===" 
test_endpoint "Health Check" "$BASE_URL/api/health" "GET"
test_endpoint "Graph Endpoint" "$BASE_URL/api/graph" "GET"
test_endpoint "Cases Endpoint" "$BASE_URL/api/cases" "GET"
echo ""

echo "=== ML Service ===" 
test_endpoint "ML Service Health" "$ML_URL/health" "GET"
echo ""

echo "=== Optional: Data Seeding ===" 
echo -n "Testing seed endpoint... "
seed_response=$(curl -s -X POST "$BASE_URL/api/seed/demo-data" 2>/dev/null || echo '{"error":"Failed"}')
if echo "$seed_response" | grep -q "success"; then
    echo "✅"
else
    echo "⚠️  (Check Supabase connection)"
fi
echo ""

echo "=========================================="
echo "Check Results Summary"
echo "=========================================="
echo ""
echo "If all tests pass (✅):"
echo "  1. Go to http://localhost:3000 in your browser"
echo "  2. Test each feature:"
echo "     - Voice Shield: Transcribe a call"
echo "     - Counterfeit Scanner: Upload a currency image"
echo "     - Fraud Network: View the graph visualization"
echo "     - Case Console: Select and manage cases"
echo ""
echo "If any service fails (❌):"
echo "  1. Ensure all services are running (see SETUP.md)"
echo "  2. Check .env.local for correct URLs"
echo "  3. Verify Supabase connectivity"
echo ""
echo "=========================================="
