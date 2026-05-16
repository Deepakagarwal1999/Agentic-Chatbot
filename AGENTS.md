# AGENTS.md

> This file is **machine-readable context** for any AI agent working on this project.  
> Treat it as a structured "cheatsheet" for every task you ever do here.

---

## 1. Project Overview

| Field | Value |
|-------|-------|
| **Name** | Chatbot — Production-Grade AI Chatbot |
| **Architecture** | DeepAgents / LangGraph → FastAPI → PostgreSQL (pgvector) + Redis |
| **Purpose** | AI chatbot with per-user session isolation, dual memory (short-term + long-term), and streaming (SSE) |
| **Python Version** | 3.12+ |
| **Language** | Python (FastAPI) |
| **License** | Private (no license file) |

---

## 2. Directory Structure

```
chatbot/
├── .env.example                # Environment variable template
├── requirements.txt            # Python deps
├── alembic.ini                 # Alembic config
├── docker-compose.yml          # PostgreSQL + pgvector + Redis
├── Dockerfile                  # Production container
├── pytest.ini                  # Pytest config
├── README.md                   # Human-facing readme ( quick start, API overview )
│
├── src/                        # Backend source code
│   ├── main.py                 # FastAPI app, lifespan, route registration
│   ├── core/                   # Infrastructure layer
│   │   ├── config.py           # Pydantic Settings (env-based)
│   │   ├── database.py         # Async SQLAlchemy engine + session
│   │   ├── di.py               # Dependency injection (agent singletons)
│   │   ├── exceptions.py       # Custom exception hierarchy
│   │   └── logging.py          # structlog configuration
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── base.py             # Base, TimestampMixin, UUIDMixin
│   │   ├── user.py             # User model
│   │   ├── conversation.py     # Conversation + ConversationStatus enum
│   │   └── message.py          # Message, MemoryEmbedding, ConversationSummary
│   ├── schemas/                # Pydantic request/response schemas
│   │   ├── auth.py             # Register, Login, Token
│   │   ├── conversation.py     # Conversation CRUD schemas
│   │   └── message.py          # Message, MemorySearch schemas
│   ├── repositories/           # Data access layer
│   │   ├── base.py             # Generic CRUD base repo
│   │   ├── user.py
│   │   ├── conversation.py
│   │   └── message.py          # Message + embedding + summary repo
│   ├── services/               # Business logic layer
│   │   ├── auth.py             # Registration, login, JWT, password hashing
│   │   ├── conversation.py       # Conversation lifecycle
│   │   └── message.py          # Message streaming, persistence, memory indexing
│   ├── agent/                  # AI Agent module (DeepAgents / LangGraph)
│   │   ├── graph.py            # LangGraph state graph builder (create_deep_agent)
│   │   ├── orchestrator.py     # Streaming orchestrator (AgentOrchestrator)
│   │   ├── tools.py            # Custom tools + built-in DeepAgents tools
│   │   ├── prompts.py          # SYSTEM_PROMPT, CONTEXT_TEMPLATE
│   │   └── state.py            # AgentState TypedDict
│   ├── memory/                 # Memory subsystem
│   │   ├── checkpoint.py         # AsyncPostgresSaver (LangGraph checkpointer)
│   │   ├── long_term.py          # pgvector embedding pipeline
│   │   ├── retriever.py          # Hybrid memory retriever
│   │   └── summarizer.py         # LLM-based conversation summarizer
│   └── api/                    # HTTP API layer
│       ├── deps.py             # FastAPI dependency injection (auth, repos)
│       ├── middleware.py         # Request ID, timing, structured logging
│       └── routes/
│           ├── auth.py           # POST /api/auth/register, /api/auth/login
│           ├── conversations.py  # CRUD /api/conversations
│           ├── messages.py       # SSE POST /api/conversations/{id}/messages
│           └── memory.py         # POST /api/memory/search, GET summary
│
├── ui/                         # React + Vite frontend
│   ├── README.md               # Frontend-specific readme
│   ├── package.json            # npm manifest (React 19, Vite 8)
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # TailwindCSS configuration
│   ├── postcss.config.js       # PostCSS configuration
│   ├── index.html              # Entry HTML
│   ├── .env.example            # Frontend env template (VITE_API_BASE_URL)
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── App.jsx             # Root router component
│       ├── index.css           # Global styles
│       ├── pages/
│       │   ├── LoginPage.jsx   # Auth/login page
│       │   └── ChatPage.jsx    # Main chat interface
│       ├── components/
│       │   ├── Sidebar.jsx     # Conversation sidebar
│       │   ├── ChatWindow.jsx  # Message list container
│       │   ├── MessageBubble.jsx # Individual message rendering
│       │   ├── InputBar.jsx    # Message input
│       │   └── PrivateRoute.jsx # Auth-guarded route wrapper
│       ├── contexts/
│       │   └── AuthContext.jsx # React auth context (JWT)
│       └── api/
│           ├── client.js       # Axios/fetch client with base URL
│           ├── auth.js         # Login / register API calls
│           ├── conversations.js # Conversation CRUD API calls
│           └── messages.js     # Send message + SSE stream handling
│
└── tests/
    ├── conftest.py             # Pytest fixtures
    ├── unit/
    │   ├── test_agent_graph.py
    │   ├── test_memory_retriever.py
    │   └── test_services.py
    └── integration/
        ├── test_conversations_api.py
        └── test_isolation.py
```

---

## 3. Technology Stack & Key Versions

| Layer | Technology | Key Constraints |
|-------|-----------|---------------|
| **API Framework** | FastAPI 0.115+ | ASGI, auto-docs, DI |
| **Agent Orchestration** | DeepAgents 0.5.8+, LangGraph 0.2+ | `create_deep_agent` replaces legacy `create_react_agent` |
| **LLM** | OpenAI `gpt-4o` (configurable) | Streaming enabled |
| **ORM** | SQLAlchemy 2.0+ (async) | asyncpg driver |
| **Vector DB** | PostgreSQL + pgvector (16) | `pgvector/pgvector:pg16` |
| **Cache/State** | Redis 7 | `redis:7-alpine` |
| **Frontend** | React 19, Vite 8, TailwindCSS 3 | SPA served independently |
| **Auth** | python-jose (JWT) + passlib (bcrypt) | Bearer tokens |
| **Logging** | structlog 24+ | Structured or console |
| **Migrations** | Alembic 1.14+ | Async runner |

**Critical**: `deepagents` is the **primary** orchestration layer. LangGraph is used under the hood, but `build_agent_graph` and the orchestrator rely on `deepagents.create_deep_agent`.

---

## 4. Build, Run & Test

### Local Development (Backend Only)

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Configure environment
cp .env.example .env
# Edit .env — set LLM_API_KEY and a secure JWT_SECRET_KEY

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run migrations
alembic upgrade head

# 5. Start the server
uvicorn src.main:app --reload --port 8000
```

### Full-Stack Development (Backend + Frontend)

The project includes a React + Vite frontend in the `ui/` directory.

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Start infrastructure and backend (see above)
# ...

# 2. Configure CORS
# Ensure backend .env has:
# CORS_ORIGINS=["http://localhost:5173"]

# 3. Start the frontend dev server
cd ui
npm install
npm run dev
```

**Default ports:**
| Service | Port | URL |
|---------|------|-----|
| Backend (FastAPI) | 8000 | `http://localhost:8000` |
| Frontend (Vite) | 5173 | `http://localhost:5173` |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |

### Testing

```bash
pytest tests/ -v               # All tests
pytest tests/unit/ -v           # Unit tests only
pytest tests/integration/ -v    # Integration tests only
pytest tests/ --cov=src --cov-report=html  # With coverage
```

### Docker

```bash
docker build -t chatbot:latest .
docker run -d --name chatbot -p 8000:8000 --env-file .env chatbot:latest
```

---

## 5. Coding Conventions & Style

| Rule | Detail |
|------|--------|
| **Async everywhere** | All I/O is async (SQLAlchemy `AsyncSession`, `asyncpg`) |
| **Type hints** | Required for all function signatures, especially public methods |
| **Repository pattern** | All DB access goes through repositories; never raw SQL in routes |
| **Dependency injection** | Use `src/core/di.py` for singletons; route `deps` only for per-request objects (auth, repos) |
| **Exception hierarchy** | All custom errors inherit from `AppError` → handled by global FastAPI exception handler |
| **No real LLM calls in unit tests** | Mock the orchestrator via DI in `tests/unit/` |
| **UUID primary keys** | Use `uuid.UUID` for all entity IDs |
| **Environment config** | All secrets/config via `src/core/config.py` (`Settings` class) |
| **Logging** | Use `structlog.get_logger()`; include `request_id` from middleware in every log |

---

## 6. Key File Locations

| What | Where |
|------|-------|
| **Entry point** | `src/main.py` |
| **Config / env vars** | `src/core/config.py` |
| **DB engine / session** | `src/core/database.py` |
| **Agent graph** | `src/agent/graph.py` |
| **Agent tools (custom)** | `src/agent/tools.py` |
| **Memory retriever** | `src/memory/retriever.py` |
| **Auth logic (JWT, bcrypt)** | `src/services/auth.py` |
| **API routes** | `src/api/routes/*.py` |
| **Equivalent of .env** | `.env` (create from `.env.example`) |

---

## 7. Config & Secrets

All secrets and environment variables go through `src.core.config.Settings` (Pydantic `BaseSettings`).

Key env vars (full list in `.env.example`):
- `DATABASE_URL` / `DATABASE_URL_SYNC`
- `REDIS_URL`
- `LLM_API_KEY`
- `JWT_SECRET_KEY`
- `CORS_ORIGINS` (set `["http://localhost:5173"]` for full-stack dev)
- `EMBEDDING_...`

Never commit `.env` — it's in `.gitignore`.

---

## 8. Extension Points / "How Do I..."

| Task | File/Pattern |
|------|-------------|
| Add a new custom tool | Define in `src/agent/tools.py`, add to `CUSTOM_TOOLS`, re-register in `build_agent_graph` |
| Add a new API route | Create `src/api/routes/<module>.py`, register in `src/main.py` |
| Add a new model | SQLAlchemy model in `src/models/`, Alembic migration, Pydantic schema in `src/schemas/` |
| Change the LLM | Update `src/core/di.py::_build_llm` or config vars |
| Change memory retrieval logic | Edit `src/memory/retriever.py` |
| Change the system prompt | Edit `src/agent/prompts.py` |
| Background tasks | Currently in-memory (asyncio tasks); for production consider Celery/ARQ |

---

## 9. Testing Principles

- **Unit tests** mock the orchestrator + repositories; never hit real DB or LLM.
- **Integration tests** hit the FastAPI test client + test DB; verify HTTP layer.
- **Isolation tests** verify user A cannot read user B's data (JWT scoping).
- Fixtures are defined in `tests/conftest.py`.

---

## 10. Known Gotchas & Anti-Patterns

| Gotcha | Why / Fix |
|--------|-----------|
| `deepagents` vs raw `langgraph` | Use `build_agent_graph` from `src/agent/graph.py`. It wraps `deepagents.create_deep_agent`, which is the single source of truth for tool injection. |
| Stateless API, but LangGraph checkpoints | Checkpoints are stored in PostgreSQL, so the API is horizontally scalable, but **never** depend on in-memory state across requests. |
| Embedding indexing is synchronous | Happens inline after each message. It can block the event loop on very heavy traffic. Consider a background worker in production. |
| Summary generation threshold | Currently triggers at 20 messages (`SUMMARY_TRIGGER_MESSAGE_COUNT`). Adjust via env. |
| `execute` tool | DeepAgents built-in `execute` (shell) is **disabled in production** for security by default. Adjust `permissions` in `build_agent_graph` if needed. |

---

## 11. Architecture Summary

```
Client ──▶ FastAPI (auth middleware)
              │
              ▼
         AgentOrchestrator (DeepAgents / LangGraph)
              │
      ┌──────┴──────┐
      ▼             ▼
Short-term     Long-term
LangGraph      pgvector (semantic search)
Checkpointer   + conversation summaries
      │             │
      └───▶ PostgreSQL (users, conversations, messages, embeddings)
              Redis (cache / session—future use)
```

- **Streaming**: SSE (`text/event-stream`) yields tokens one-by-one; final `[DONE]` event signals completion.
- **Auth**: JWT Bearer tokens; `user_id` extracted server-side, never from request body.
- **Isolation**: Every repo query is scoped by `user_id`; `conversation_id` acts as the LangGraph `thread_id`.

---

*This `AGENTS.md` was created for machine agent context. Keep it updated whenever you modify architecture, dependencies, or critical build/run steps.*
