#!/bin/bash

# Move to project root directory
cd "$(dirname "$0")/.."

echo "🧹 Cleaning up SaaS Insight Engine..."

# Kill any running Flask or Node processes
echo "💀 Killing running processes..."
if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "win32" ]; then
    taskkill /F /IM python.exe 2> /dev/null || true
    taskkill /F /IM node.exe 2> /dev/null || true
else
    pkill -f flask 2> /dev/null || true
    pkill -f node 2> /dev/null || true
fi

# Remove virtual environment
echo "🗑️ Removing virtual environment..."
rm -rf venv

# Remove node_modules
echo "🗑️ Removing node modules..."
rm -rf frontend/node_modules
rm -rf frontend/.cache
rm -rf frontend/build

# Clear data (but keep the CSV)
echo "🗑️ Cleaning data..."
rm -f data/users.json

echo "✨ Cleanup complete! Run install.sh to start fresh." 