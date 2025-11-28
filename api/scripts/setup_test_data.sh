#!/usr/bin/env bash
# Rebuild test data for LunchSaga development
# Run from project root: ./api/scripts/setup_test_data.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "🔧 LunchSaga Test Data Setup"
echo "============================"

# Check if pywrangler dev server is running
if ! curl -s http://localhost:3757/api/health > /dev/null 2>&1; then
    echo "⚠️  API server not running at localhost:3757"
    echo "   Starting pywrangler dev server..."
    cd "$PROJECT_ROOT"
    uv run pywrangler dev --port 3757 &
    DEV_PID=$!
    echo "   Waiting for server to start..."
    sleep 5
    
    if ! curl -s http://localhost:3757/api/health > /dev/null 2>&1; then
        echo "❌ Failed to start dev server"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi
    echo "   ✅ Dev server started (PID: $DEV_PID)"
fi

# Run the rebuild script
echo ""
echo "📊 Rebuilding test data..."
cd "$PROJECT_ROOT"
uv run python api/scripts/rebuild_test_data.py "$@"

echo ""
echo "✨ Done! Test data is ready."
echo ""
echo "To run tests:"
echo "  uv run pytest api/tests/ -v"
