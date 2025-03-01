#!/bin/bash

# Move to project root directory
cd "$(dirname "$0")/.."

echo "🚀 Installing SaaS Insight Engine..."

# Function to check Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python is required but not installed."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Create and activate Python virtual environment
echo "📦 Setting up Python virtual environment..."
$PYTHON_CMD -m venv venv
if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "win32" ]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create necessary directories
echo "📁 Creating data directories..."
mkdir -p data/csv

# Create .env files if they don't exist
if [ ! -f .env ]; then
    echo "📝 Creating backend .env file..."
    echo "FLASK_APP=app.py
FLASK_ENV=development
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here" > .env
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend .env file..."
    echo "REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here" > frontend/.env
fi

echo "✅ Installation complete!"
echo "
Next steps:
1. Add your Stripe API keys to .env and frontend/.env
2. Start backend: cd backend && flask run
3. Start frontend: cd frontend && npm start
" 