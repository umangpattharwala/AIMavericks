# NexaCore Total Rewards & Benefits AI

A full-stack AI assistant for employee rewards, benefits, HR policy guidance, and ticket support. The project combines a FastAPI backend, a Next.js frontend, a LangGraph-based multi-agent orchestration layer, and the Coforce AI Gateway for centralized AI routing and tool execution.

---

# What this project does

* Answers employee questions about benefits, policies, compensation, and rewards
* Uses a multi-agent workflow to route requests to specialized agents
* Supports HR-only capabilities such as research and directory access
* Stores conversations and tickets in SQLite
* Uses ChromaDB + document embeddings for retrieval-augmented answers
* Includes streaming chat responses and a ticketing experience
* Centralizes AI execution and integrations through the Coforce AI Gateway

---

# High-Level Architecture

* Frontend: Next.js 15 + React 19 + Tailwind CSS
* Backend: FastAPI + Uvicorn
* Agent Orchestration: LangGraph + LangChain + Anthropic Models
* Retrieval: ChromaDB + Sentence Transformers Embeddings
* Storage: SQLite for conversations and tickets
* API Gateway & Tool Layer: Coforce AI Gateway
* Observability: Langfuse and Phoenix (Optional)

---

# Architecture Flow

```text
User
  │
  ▼
Next.js Frontend
  │
  ▼
FastAPI Backend
  │
  ▼
Coforce AI Gateway
  │
  ├── LangGraph Multi-Agent System
  ├── Anthropic LLM Models
  ├── External Tools & APIs
  └── RAG Services
          │
          ▼
      ChromaDB
```

---

# Main Folders

```text
/
├── backend/
├── frontend/
├── data/
├── coforce-ai-gateway/
├── docker-compose.yml
├── start.sh
└── README.md
```

### Folder Description

* `backend/` — FastAPI application, agents, auth, DB, RAG logic, tests
* `frontend/` — Next.js UI and dashboard/chat components
* `data/` — RAG documents and vector store data
* `coforce-ai-gateway/` — AI gateway service for LLM routing, tool orchestration, and AI integrations
* `docker-compose.yml` — Containerized deployment configuration
* `start.sh` — Local development bootstrap script

---

# Key Features

## Employee Features

* Employee authentication
* Benefits and compensation Q&A
* HR policy assistance
* Streaming AI responses
* Conversation history
* Ticket creation and tracking

## HR Features

* Employee directory access
* Research workflows
* Ticket management
* Ticket status updates
* Internal HR support tools

## AI Features

* Multi-agent orchestration using LangGraph
* Retrieval-Augmented Generation (RAG)
* Semantic document search
* Context-aware responses
* Tool calling and external integrations

## Security Features

* JWT Authentication
* Role-Based Access Control (RBAC)
* Protected HR-only endpoints
* Secure API access

---

# Coforce AI Gateway

The project includes a dedicated AI Gateway located at:

```text
/coforce-ai-gateway
```

The gateway acts as a centralized execution layer between backend services, AI models, retrieval systems, and external tools.

## Responsibilities

* Unified access to LLM providers
* Tool execution and orchestration
* Request routing
* Context management
* Authentication and authorization
* Standardized AI interfaces
* Agent-to-agent communication
* Future MCP compatibility

## Benefits

* Decouples AI providers from business logic
* Simplifies model switching
* Centralized AI configuration
* Better scalability
* Easier maintenance
* Improved observability

---

# Technology Stack

| Layer           | Technology                         |
| --------------- | ---------------------------------- |
| Frontend        | Next.js 15, React 19, Tailwind CSS |
| Backend         | FastAPI, Uvicorn                   |
| AI Framework    | LangGraph, LangChain               |
| LLM Provider    | Anthropic                          |
| Vector Database | ChromaDB                           |
| Embeddings      | Sentence Transformers              |
| Database        | SQLite                             |
| Gateway         | Coforce AI Gateway                 |
| Authentication  | JWT                                |
| Observability   | Langfuse, Phoenix                  |

---

# Prerequisites

* Python 3.11+
* Node.js 18+
* Docker (Optional)
* Anthropic API Key
* Tavily API Key

---

# Local Development

## Option 1: Startup Script

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

---

## Option 2: Docker Compose

```bash
docker compose up --build
```

### Services

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8000 |
| Phoenix  | http://localhost:6006 |

---

# Backend Environment

Create the environment file:

```bash
cp backend/.env.example backend/.env
```

Important variables:

```env
ANTHROPIC_API_KEY=
TAVILY_API_KEY=
JWT_SECRET_KEY=
CORS_ORIGINS=
```

---

# API Documentation

Available after backend startup:

* http://localhost:8000/docs
* http://localhost:8000/redoc

---

# Main API Routes

## Authentication

```text
/api/auth/login
/api/auth/me
```

## Chat

```text
/api/chat
/api/chat/stream
```

## Tickets

```text
/api/tickets
```

## Conversations

```text
/api/conversations
```

## Documents

```text
/api/documents
```

## Health

```text
/api/health
```

---

# Testing

Run backend tests:

```bash
cd backend
pytest
```

---

# Observability & Monitoring

Optional integrations:

* Langfuse for tracing and evaluation
* Phoenix for debugging and observability

Track:

* Agent execution paths
* Response latency
* Tool usage
* Retrieval performance
* LLM costs
* User interactions
* System health

---

# Notes

* Designed for hackathons, demos, and enterprise HR assistant use cases.
* Supports Retrieval-Augmented Generation (RAG).
* Uses role-aware workflows for employee and HR users.
* Advanced capabilities depend on external AI providers and APIs.
* Sample employee directory and RAG documents are included under `data/`.

---

# Summary

NexaCore Total Rewards & Benefits AI is an enterprise-ready employee support platform that combines modern web technologies, Retrieval-Augmented Generation (RAG), multi-agent orchestration, and centralized AI gateway architecture.

The platform consists of:

* Next.js employee portal
* FastAPI backend services
* LangGraph multi-agent orchestration
* ChromaDB document retrieval
* SQLite conversation and ticket storage
* Coforce AI Gateway for AI routing and tool execution
* Langfuse and Phoenix observability

Together, these components provide secure, scalable, and intelligent employee support for benefits, compensation, rewards, HR policies, and ticket management.
