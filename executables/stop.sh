#!/bin/bash

# Move to project root directory
cd "$(dirname "$0")/.."

echo "🛑 Stopping SaaS Insight Engine..."

# Kill Flask backend
echo "📡 Stopping backend server..."
if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "win32" ]; then
    # Windows
    taskkill /F /IM python.exe 2> /dev/null || true
else
    # Unix/Mac
    pkill -f "flask run" 2> /dev/null || true
fi

# Kill React frontend
echo "🌐 Stopping frontend..."
if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "win32" ]; then
    # Windows
    taskkill /F /IM node.exe 2> /dev/null || true
else
    # Unix/Mac
    pkill -f "react-scripts start" 2> /dev/null || true
fi

echo "✅ All processes stopped!" 