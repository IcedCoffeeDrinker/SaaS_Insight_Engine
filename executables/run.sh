#!/bin/bash

# Move to project root directory
cd "$(dirname "$0")/.."

echo "🚀 Starting SaaS Insight Engine..."

# Activate virtual environment based on OS
if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "win32" ]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Start backend in background
echo "📡 Starting backend server..."
cd backend
flask run &
BACKEND_PID=$!
cd ..

# Start frontend
echo "🌐 Starting frontend..."
cd frontend
npm start

# Cleanup when frontend is closed
if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "win32" ]; then
    taskkill /F /PID $BACKEND_PID
else
    kill $BACKEND_PID
fi
echo "👋 Shutting down..." 