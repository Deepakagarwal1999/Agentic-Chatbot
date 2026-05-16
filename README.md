# Chatbot — Production-Grade AI Chatbot

FastAPI + LangGraph + DeepAgents powered chatbot with per-user session isolation, dual memory (short-term + long-term), and streaming responses.

## Quick Start

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Configure environment
cp .env.example .env
# Edit .env with your LLM API key and other settings

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run migrations
alembic upgrade head

# 5. Start the server
uvicorn src.main:app --reload --port 8000
```

## Running the Application

### Backend Only (API)

Follow the steps in [Quick Start](#quick-start) above to run just the backend API.

### Full Stack (Backend + Frontend)

The project includes a React + Vite frontend in the `ui/` directory.

#### Prerequisites

- **Backend**:
  - Python 3.12+
  - Docker and Docker Compose
  - An LLM API key (OpenAI by default)
- **Frontend**:
  - Node.js 18+ and npm

#### Step-by-Step Instructions

1. **Clone the repository and navigate to the project directory:**
   ```bash
   cd chatbot
   ```

2. **Start the required infrastructure (PostgreSQL with pgvector and Redis):**
   ```bash
   docker compose up -d
   ```
   This will start PostgreSQL (with pgvector extension) and Redis containers in the background.

3. **Configure the environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set the required values:
   - `LLM_API_KEY` — Your OpenAI API key
   - `JWT_SECRET_KEY` — A secure random string for JWT signing
   - `DATABASE_URL` — Update if your database credentials differ from the defaults
   - `CORS_ORIGINS` — Set to `["http://localhost:5173"]` to allow the frontend (or `["*"]` for development only)

4. **Create a virtual environment and install backend dependencies:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

5. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Start the FastAPI server:**
   ```bash
   uvicorn src.main:app --reload --port 8000
   ```

7. **Install frontend dependencies and start the dev server:**
   ```bash
   cd ui
   npm install
   npm run dev
   ```

8. **Open the application:**
   - **Frontend:** `http://localhost:5173`
   - **Backend API docs:** `http://localhost:8000/docs`

#### Default Ports

| Service | Port | URL |
|---------|------|-----|
| Backend (FastAPI) | 8000 | `http://localhost:8000` |
| Frontend (Vite) | 5173 | `http://localhost:5173` |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |

### Running with Docker

You can also run the backend using Docker:

```bash
# Build the Docker image
docker build -t chatbot:latest .

# Run the container
docker run -d --name chatbot -p 8000:8000 --env-file .env chatbot:latest
```

### Stopping the Application

To stop the running server, press `Ctrl+C` in the terminal where `uvicorn` is running.

To stop the infrastructure services:
```bash
docker compose down
```

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register a new user |
| `/api/auth/login` | POST | Login and get JWT |
| `/api/conversations` | POST | Create new conversation |
| `/api/conversations` | GET | List user's conversations |
| `/api/conversations/{id}` | GET | Get conversation details |
| `/api/conversations/{id}` | PATCH | Update conversation |
| `/api/conversations/{id}` | DELETE | Delete (soft) conversation |
| `/api/conversations/{id}/messages` | GET | List messages in conversation |
| `/api/conversations/{id}/messages` | POST | Send message (SSE stream) |
| `/api/memory/search` | POST | Semantic search across history |
| `/api/memory/conversations/{id}/summary` | GET | Get conversation summary |
| `/api/health` | GET | Health check |

## Architecture

```
Client → FastAPI (auth middleware)
           → Agent Orchestrator (LangGraph + DeepAgents)
                → Short-term Memory (LangGraph Checkpointer → Redis)
                → Long-term Memory (pgvector semantic search)
                → LLM (OpenAI / configurable)
           → PostgreSQL (users, conversations, messages, embeddings)
```

## Testing

```bash
pytest tests/ -v               # Run all tests
pytest tests/unit/ -v           # Run only unit tests
pytest tests/integration/ -v    # Run only integration tests
pytest tests/ --cov=src --cov-report=html  # Run with coverage report
```

## Environment Variables

See `.env.example` for all configuration options. Key variables:

- `LLM_API_KEY` — Your LLM provider API key
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET_KEY` — Secret for JWT token signing