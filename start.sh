#!/bin/bash
# Quick start script for local development

set -e

echo "=========================================="
echo "NexaCore Total Rewards & Benefits AI"
echo "=========================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi

# Backend setup
echo ""
echo "[1/4] Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt --quiet 2>/dev/null

# Check for .env
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "   → Please edit backend/.env with your API keys"
fi

# Create data dir for SQLite
mkdir -p data

# Ingest documents (only if vector store doesn't exist)
if [ ! -d "../data/vectorstore" ]; then
    echo ""
    echo "[2/4] Ingesting RAG documents..."
    python scripts/ingest_documents.py
else
    echo ""
    echo "[2/4] Vector store already exists, skipping ingestion..."
fi

# Start backend
echo ""
echo "[3/4] Starting backend on :8000..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd ..

# Frontend setup
echo ""
echo "[4/4] Starting frontend on :3000..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install --quiet 2>/dev/null
fi
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "=========================================="
echo "✅ System running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services"

# Trap to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
