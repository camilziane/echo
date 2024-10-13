#!/bin/bash

# Function to run a command in a new terminal window
run_in_new_terminal() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "tell app \"Terminal\" to do script \"cd $(pwd) && $1\""
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "$1; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -e bash -c "$1; exec bash" &
        else
            echo "Unable to open a new terminal window. Please install gnome-terminal or xterm."
            exit 1
        fi
    else
        echo "Unsupported operating system"
        exit 1
    fi
}

# Navigate to the frontend directory
cd front

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install --legacy-peer-deps

# Start the frontend in a new terminal window
echo "Starting frontend..."
run_in_new_terminal "npm start"

# Navigate back to the root directory
cd ..

# Navigate to the backend directory
cd back
# Set environment variables
export GROQ_API_KEY="=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"
export MISTRAL_API_KEY="lcDzRPm2CmmrxY020WnUBmDQ8Xe1Im1r"

# Sync backend dependencies
echo "Syncing backend dependencies..."
make sync

# Start the backend in a new terminal window
echo "Starting backend..."
run_in_new_terminal "make start"

echo "Project launched successfully!"

