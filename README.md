# NexaCore Total Rewards & Benefits AI

A full-stack AI assistant for employee rewards, benefits, HR policy guidance, and ticket support. The project combines a FastAPI backend, a Next.js frontend, and a LangGraph-based multi-agent orchestration layer powered by RAG and LLM tools.

## What this project does

- Answers employee questions about benefits, policies, compensation, and rewards
- Uses a multi-agent workflow to route requests to specialized agents
- Supports HR-only capabilities such as research and directory access
- Stores conversations and tickets in SQLite
- Uses ChromaDB + document embeddings for retrieval-augmented answers
- Includes streaming chat responses and a ticketing experience

## High-level architecture

- Frontend: Next.js 15 + React 19 + Tailwind CSS
- Backend: FastAPI + Uvicorn
- Agent orchestration: LangGraph + LangChain + Anthropic models
- Retrieval: ChromaDB + sentence-transformers embeddings
- Storage: SQLite for conversations and tickets
- Observability: Langfuse and Phoenix (optional)

## Main folders

- backend/ — FastAPI application, agents, auth, DB, RAG logic, tests
- frontend/ — Next.js UI and dashboard/chat components
- data/ — RAG documents and vector store data
- docker-compose.yml — containerized run configuration
- start.sh — local development bootstrap script

## Key features from the current code

- JWT-based authentication and RBAC
- Employee login flow with demo role support
- Chat and streaming chat endpoints
- Conversation history retrieval
- Ticket creation, listing, and HR-only updates
- Downloadable source documents from the RAG corpus
- Health check endpoint

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (optional, for containerized startup)
- Anthropic API key
- Tavily API key (for research-related flows)

## Local development

### Option 1: Use the provided startup script

From the project root:

```bash
./start.sh
```

This will:

1. Create or use a backend virtual environment
2. Install Python dependencies
3. Copy backend/.env from backend/.env.example if needed
4. Ingest RAG documents if the vector store is not present
5. Start the backend on http://localhost:8000
6. Start the frontend on http://localhost:3000

### Option 2: Run with Docker Compose

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Phoenix: http://localhost:6006 (optional profile)

## Backend environment

Copy the example environment file before running the backend:

```bash
cp backend/.env.example backend/.env
```

Important variables include:

- ANTHROPIC_API_KEY
- TAVILY_API_KEY
- JWT_SECRET_KEY
- CORS_ORIGINS

## API access

Once the backend is running, the FastAPI docs are available at:

- http://localhost:8000/docs
- http://localhost:8000/redoc

The main API routes include:

- /api/auth/login
- /api/auth/me
- /api/chat
- /api/chat/stream
- /api/tickets
- /api/conversations
- /api/documents
- /api/health

## Testing

Run backend tests from the backend folder:

```bash
cd backend
pytest
```

## Notes

- The system is designed as a hackathon/demo-oriented AI benefits assistant.
- Some advanced features depend on external LLM and research APIs.
- The repository includes a sample employee directory and RAG document set under data/.

## Summary

This project is a practical example of an AI-powered employee support platform: a modern frontend, secure API, retrieval-based answers, multi-agent routing, and HR-aware access controls all working together.
