#!/bin/bash

# Function to run a command and prefix its output
run_with_prefix() {
    prefix=$1
    shift
    "$@" 2>&1 | sed "s/^/[$prefix] /"
}

# Navigate to the frontend directory
cd front

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install --legacy-peer-deps

# Navigate back to the root directory
cd ..

# Navigate to the backend directory
cd back
# Print current directory


# Set environment variables
export GROQ_API_KEY=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
export MISTRAL_API_KEY=lcDzRPm2CmmrxY020WnUBmDQ8Xe1Im1r

# Sync backend dependencies
echo "Syncing backend dependencies..."
make sync
# Activate the virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate


# Start both frontend and backend processes
echo "Starting frontend and backend..."
(cd ../front && run_with_prefix FRONTEND npm start) &
(run_with_prefix BACKEND make start) &

# Wait for all background processes to finish
wait

echo "Project stopped."
