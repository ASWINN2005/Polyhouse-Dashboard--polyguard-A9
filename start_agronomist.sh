#!/bin/bash

echo "🌱 Starting Agronomist AI System (Offline Mode Ready)..."

# 1. Start Ollama in the background if it's not running
if ! pgrep -x "ollama" > /dev/null
then
    echo "🤖 Starting Ollama Engine..."
    open -a Ollama
    sleep 5
fi

# 2. Start your Python AI Server (The Bridge)
echo "🐍 Starting Python AI Server (Mistral + ML Model)..."
# Replace 'ai_server.py' with your actual filename
python3 ai-backend/ai_server.py & 

# 3. Start the React Frontend
echo "💻 Starting Agronomist UI..."
npm run dev

# Keep script alive
wait