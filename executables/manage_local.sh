#!/bin/bash

# Navigate to the project root directory (assuming the script is in executables/)
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# --- Configuration ---
VENV_DIR="venv"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKEND_PID_FILE=".backend.pid"
FRONTEND_PID_FILE=".frontend.pid"

# Detect shell type for activation
SHELL_TYPE=$(basename "$SHELL")
ACTIVATE_CMD="source $VENV_DIR/bin/activate"
if [ "$SHELL_TYPE" = "fish" ]; then
    ACTIVATE_CMD="source $VENV_DIR/bin/activate.fish"
fi

# --- Helper Functions ---

ensure_venv() {
    if [ ! -d "$VENV_DIR" ]; then
        echo "🐍 Creating Python virtual environment..."
        python3 -m venv "$VENV_DIR"
        if [ $? -ne 0 ]; then
            echo "❌ Error creating virtual environment. Make sure Python 3 is installed."
            exit 1
        fi
    fi
}

install_backend_deps() {
    echo "📦 Installing backend dependencies..."
    ensure_venv
    eval "$ACTIVATE_CMD"
    pip install -r "$BACKEND_DIR/requirements.txt"
    if [ $? -ne 0 ]; then
        echo "❌ Error installing backend dependencies."
        deactivate > /dev/null 2>&1 || true # Try to deactivate even on error
        exit 1
    fi
    deactivate > /dev/null 2>&1 || true
    echo "✅ Backend dependencies installed."
}

install_frontend_deps() {
    echo "📦 Installing frontend dependencies..."
    cd "$FRONTEND_DIR" || exit 1
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error installing frontend dependencies."
        cd "$PROJECT_ROOT" || exit 1
        exit 1
    fi
    cd "$PROJECT_ROOT" || exit 1
    echo "✅ Frontend dependencies installed."
}

check_process() {
    local pid_file=$1
    local name=$2
    if [ -f "$pid_file" ]; then
        local pid
        pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null; then
            echo "🟢 $name is running (PID: $pid)"
            return 0 # Running
        else
            echo "🟠 $name PID file found, but process $pid is not running. Cleaning up PID file."
            rm "$pid_file"
            return 1 # Not running
        fi
    else
        echo "🔴 $name is not running (no PID file)"
        return 1 # Not running
    fi
}

# --- Main Actions ---

build_env() {
    echo "🛠️ Building environment..."
    ensure_venv
    install_backend_deps
    install_frontend_deps
    echo "✨ Build complete."
}

reset_env() {
    echo "🧹 Resetting environment..."
    stop_servers # Stop servers before resetting
    echo "🔥 Removing virtual environment ($VENV_DIR)..."
    rm -rf "$VENV_DIR"
    echo "🔥 Removing frontend node_modules..."
    rm -rf "$FRONTEND_DIR/node_modules"
    echo "🔥 Removing frontend build directory..."
    rm -rf "$FRONTEND_DIR/build"
    echo "🔥 Removing frontend package-lock.json..."
    rm -f "$FRONTEND_DIR/package-lock.json"
    echo "🔥 Removing PID files..."
    rm -f "$BACKEND_PID_FILE"
    rm -f "$FRONTEND_PID_FILE"
    echo "✅ Environment cleaned. Rebuilding..."
}

start_servers() {
    echo "🚀 Starting servers..."

    # Start Backend
    if ! check_process "$BACKEND_PID_FILE" "Backend"; then
        echo "   Starting Backend (Flask)..."
        ensure_venv
        eval "$ACTIVATE_CMD"
        cd "$BACKEND_DIR" || exit 1
        # Start in background, redirect output, save PID
        nohup flask run > ../backend.log 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > "../$BACKEND_PID_FILE"
        cd "$PROJECT_ROOT" || exit 1
        deactivate > /dev/null 2>&1 || true
        sleep 2 # Give it a moment to start
        if ps -p $BACKEND_PID > /dev/null; then
             echo "   ✅ Backend started (PID: $BACKEND_PID). Logs in backend.log"
        else
             echo "   ❌ Backend failed to start. Check backend.log for details."
             rm -f "$BACKEND_PID_FILE"
        fi
    fi

    # Start Frontend
    if ! check_process "$FRONTEND_PID_FILE" "Frontend"; then
        echo "   Starting Frontend (React)..."
        cd "$FRONTEND_DIR" || exit 1
        # Start in background, redirect output, save PID
        nohup npm start > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "../$FRONTEND_PID_FILE"
        cd "$PROJECT_ROOT" || exit 1
        sleep 5 # Give React more time
         if ps -p $FRONTEND_PID > /dev/null; then
             echo "   ✅ Frontend started (PID: $FRONTEND_PID). Logs in frontend.log"
         else
             echo "   ❌ Frontend failed to start. Check frontend.log for details."
             rm -f "$FRONTEND_PID_FILE"
         fi
    fi

    echo "✨ Servers started (or were already running)."
}

stop_servers() {
    echo "🛑 Stopping servers..."

    # Stop Backend
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        echo "   Stopping Backend (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID" > /dev/null 2>&1
        rm -f "$BACKEND_PID_FILE"
        sleep 1
        if ps -p "$BACKEND_PID" > /dev/null; then
            echo "   Force stopping Backend (PID: $BACKEND_PID)..."
            kill -9 "$BACKEND_PID" > /dev/null 2>&1
        fi
        echo "   ✅ Backend stopped."
    else
        echo "   ℹ️ Backend already stopped (no PID file)."
        # Attempt cleanup just in case
        pkill -f "flask run" > /dev/null 2>&1
    fi

    # Stop Frontend
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        echo "   Stopping Frontend (PID: $FRONTEND_PID)..."
        # Node might spawn child processes, attempt to kill the process group
        kill -- -"$FRONTEND_PID" > /dev/null 2>&1 || kill "$FRONTEND_PID" > /dev/null 2>&1
        rm -f "$FRONTEND_PID_FILE"
        sleep 1
        if ps -p "$FRONTEND_PID" > /dev/null; then
             echo "   Force stopping Frontend (PID: $FRONTEND_PID)..."
             kill -9 "$FRONTEND_PID" > /dev/null 2>&1
        fi
        echo "   ✅ Frontend stopped."
    else
        echo "   ℹ️ Frontend already stopped (no PID file)."
        # Attempt cleanup just in case
        pkill -f "react-scripts start" > /dev/null 2>&1
    fi

    echo "✨ Servers stopped."
}

show_status() {
    echo "📊 Checking status..."
    check_process "$BACKEND_PID_FILE" "Backend"
    check_process "$FRONTEND_PID_FILE" "Frontend"
}

# --- Interactive Menu ---

PS3='Please enter your choice: '
options=("Build" "Reset" "Start" "Stop" "Status" "Quit")

echo "====================================="
echo " SaaS Insight Engine Local Manager   "
echo "====================================="
show_status # Show status initially
echo "-------------------------------------"

select opt in "${options[@]}"
do
    case $opt in
        "Build")
            build_env
            break
            ;;
        "Reset")
            read -p "❓ Are you sure you want to reset? This will delete venv and node_modules. (y/N): " confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                reset_env
            else
                echo "   Reset cancelled."
            fi
            break
            ;;
        "Start")
            start_servers
            break
            ;;
        "Stop")
            stop_servers
            break
            ;;
         "Status")
            show_status
            break
            ;;
        "Quit")
            echo "👋 Exiting."
            break
            ;;
        *)
            echo "❌ Invalid option $REPLY"
            ;;
    esac
done 