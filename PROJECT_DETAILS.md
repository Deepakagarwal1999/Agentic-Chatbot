# Chatbot — Production-Grade AI Chatbot

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Memory Architecture](#memory-architecture)
7. [User Isolation & Security](#user-isolation--security)
8. [Chat Lifecycle](#chat-lifecycle)
9. [Agent Design](#agent-design)
10. [API Reference](#api-reference)
11. [Configuration](#configuration)
12. [Setup & Deployment](#setup--deployment)
13. [Scaling Considerations](#scaling-considerations)
14. [Testing](#testing)
15. [Error Handling & Observability](#error-handling--observability)

---

## Overview

A production-grade AI chatbot backend built with **LangGraph**, **DeepAgents**, and **LangChain**, served via **FastAPI** with full support for:

- Per-user session isolation with multi-user concurrency
- Dual memory architecture (short-term + long-term semantic memory)
- Multiple conversations per user with thread-level isolation
- Streaming token-by-token responses via Server-Sent Events (SSE)
- JWT-based authentication
- PostgreSQL + pgvector + Redis persistence stack

---

## System Architecture

```
┌──────────┐   ┌──────────────────┐   ┌──────────────────────────────────────┐
│  Client  │──▶│  FastAPI (ASGI)   │──▶│  Agent Orchestrator                   │
│  (SSE)   │   │                  │   │  ┌────────────────────────────────┐   │
└──────────┘   │  Middleware:      │   │  │ DeepAgents (agent loop)        │   │
               │  • Auth (JWT)     │   │  │   ↕                            │   │
               │  • Request ID     │   │  │ LangGraph StateGraph            │   │
               │  • CORS           │   │  │   ↕                            │   │
               │  • Error Handler  │   │  │ LangChain (tools, LLM, embeds)  │   │
               │  • Structured Log │   │  └────────────────────────────────┘   │
               └───┬────────┬──────┘   └───────────────┬──────────────────────┘
                   │        │                          │
         ┌─────────▼──┐ ┌──▼──────────┐  ┌────────────▼───────────────┐
         │   Redis     │ │ PostgreSQL  │  │   pgvector Index            │
         │             │ │             │  │                             │
         │ • Cache     │ │ • users     │  │ • memory_embeddings          │
         │ • Sessions  │ │ • conversations│ • cosine similarity search    │
         │             │ │ • messages   │  │ • ivfflat index             │
         └─────────────┘ │ • summaries │  └─────────────────────────────┘
                         └─────────────┘
```

### Request Data Flow

1. **Incoming Request** — Hits FastAPI middleware stack (request ID assigned, CORS validated)
2. **Authentication** — JWT extracted from `Authorization: Bearer <token>` header, decoded server-side, `user_id` bound to request context
3. **Request Routing** — Routed to appropriate handler (`/api/conversations`, `/api/memory/search`, etc.)
4. **Agent Preparation** — For message sends:
   - Short-term context loaded from LangGraph checkpoint (keyed by `user_id:thread_id`)
   - Long-term context loaded via pgvector semantic search across user's entire history
   - Latest conversation summary loaded if available
5. **Agent Execution** — DeepAgents ReAct agent loop runs with injected context
6. **Streaming Response** — Tokens streamed back to client via SSE as they're generated
7. **Post-Completion** — Checkpoint saved, messages persisted, embeddings indexed, summary triggered if needed

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **API Framework** | FastAPI 0.115+ | Async REST API with auto-docs, dependency injection |
| **ASGI Server** | Uvicorn 0.30+ | High-performance async server |
| **Agent Orchestration** | DeepAgents / LangGraph 0.2+ | State graph management, ReAct agent loop |
| **LLM Integration** | LangChain 0.3+ (OpenAI, Anthropic, Groq) | Provider-agnostic LLM interface |
| **ORM** | SQLAlchemy 2.0+ (async) | Async database access with connection pooling |
| **Migrations** | Alembic 1.14+ | Schema versioning and migration management |
| **Vector Database** | pgvector (PostgreSQL extension) | In-database vector similarity search |
| **Cache/State** | Redis 7 | Session caching, distributed state |
| **Auth** | python-jose (JWT) | Token-based authentication |
| **Password Hashing** | passlib (bcrypt) | Secure password hashing |
| **Logging** | structlog 24+ | Structured JSON logging |
| **Metrics** | prometheus-client | Application metrics export |
| **Validation** | Pydantic 2.9+ | Request/response schema validation |
| **Retries** | tenacity 9+ | Exponential backoff retry logic |

---

## Project Structure

```
chatbot/
│
├── alembic/                              # Database migrations
│   ├── env.py                            # Migration runner (async)
│   └── versions/
│       └── 001_initial_schema.py          # Initial tables + pgvector index
│
├── alembic.ini                           # Alembic configuration
├── docker-compose.yml                    # PostgreSQL+pgvector + Redis services
├── Dockerfile                            # Production container
├── requirements.txt                      # Python dependencies
├── pytest.ini                            # Pytest configuration
├── .env.example                          # Environment variable template
├── .gitignore
├── README.md
│
├── src/
│   ├── __init__.py
│   ├── main.py                           # FastAPI app, lifespan, route registration
│   │
│   ├── core/                             # Core infrastructure
│   │   ├── __init__.py
│   │   ├── config.py                     # Pydantic Settings (env-based)
│   │   ├── database.py                   # Async SQLAlchemy engine + session
│   │   ├── di.py                         # Dependency injection container (agent singletons)
│   │   ├── exceptions.py                 # Custom exception hierarchy
│   │   └── logging.py                    # structlog configuration
│   │
│   ├── models/                           # SQLAlchemy ORM models
│   │   ├── __init__.py                   # Re-exports all models
│   │   ├── base.py                       # Base, TimestampMixin, UUIDMixin
│   │   ├── user.py                       # User model
│   │   ├── conversation.py               # Conversation + ConversationStatus enum
│   │   └── message.py                    # Message, MemoryEmbedding, ConversationSummary
│   │
│   ├── schemas/                          # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── auth.py                       # Register, Login, Token schemas
│   │   ├── conversation.py               # Conversation CRUD schemas
│   │   └── message.py                    # Message, MemorySearch schemas
│   │
│   ├── repositories/                     # Data access layer (user-scoped)
│   │   ├── __init__.py
│   │   ├── base.py                       # Generic CRUD base repository
│   │   ├── user.py                       # User repository
│   │   ├── conversation.py               # Conversation repository
│   │   └── message.py                    # Message + embedding + summary repository
│   │
│   ├── services/                         # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth.py                       # Registration, login, JWT, password hashing
│   │   ├── conversation.py               # Conversation lifecycle management
│   │   └── message.py                    # Message streaming, persistence, memory indexing
│   │
│   ├── agent/                            # AI Agent module
│   │   ├── __init__.py
│   │   ├── state.py                      # AgentState TypedDict
│   │   ├── tools.py                      # Tool definitions (get_current_datetime, web_search)
│   │   ├── prompts.py                    # SYSTEM_PROMPT, CONTEXT_TEMPLATE
│   │   ├── graph.py                      # LangGraph state graph builder
│   │   └── orchestrator.py              # Streaming orchestrator (AgentOrchestrator)
│   │
│   ├── memory/                           # Memory subsystem
│   │   ├── __init__.py
│   │   ├── checkpoint.py                 # AsyncPostgresSaver (LangGraph checkpointer)
│   │   ├── long_term.py                  # pgvector embedding pipeline
│   │   ├── retriever.py                  # Hybrid memory retriever
│   │   └── summarizer.py                # LLM-based conversation summarizer
│   │
│   └── api/                              # HTTP API layer
│       ├── __init__.py
│       ├── deps.py                       # FastAPI dependency injection (auth, repos)
│       ├── middleware.py                 # Request ID, timing, structured logging
│       └── routes/
│           ├── __init__.py
│           ├── auth.py                   # POST /api/auth/register, /api/auth/login
│           ├── conversations.py          # CRUD /api/conversations
│           ├── messages.py               # SSE POST /api/conversations/{id}/messages
│           └── memory.py                 # POST /api/memory/search, GET summary
│
└── tests/
    ├── __init__.py
    ├── conftest.py                       # Pytest fixtures (test client, auth headers)
    ├── unit/
    │   ├── test_agent_graph.py           # Agent graph + prompt tests
    │   ├── test_memory_retriever.py      # Retriever creation + empty context test
    │   └── test_services.py              # Password hashing, conversation creation
    └── integration/
        ├── test_conversations_api.py     # Health, auth, conversation, message endpoint tests
        └── test_isolation.py             # Token creation/validation, key namespace tests
```

---

## Database Schema

### Table: `users`

Stores registered user accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique user identifier |
| `email` | VARCHAR(320) | UNIQUE, NOT NULL, INDEX | User email address |
| `display_name` | VARCHAR(100) | NOT NULL | User display name |
| `hashed_password` | VARCHAR(128) | NOT NULL | bcrypt-hashed password |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

### Table: `conversations`

Represents a chat thread. One user can have many conversations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique conversation/thread ID |
| `user_id` | UUID | FK → users.id, NOT NULL, INDEX | Owning user |
| `title` | VARCHAR(500) | NULLABLE | Auto-generated from first message |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'active' | One of: active, archived, deleted |
| `message_count` | INTEGER | NOT NULL, DEFAULT 0 | Counter cache for message count |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last activity timestamp |

### Table: `messages`

Each row is a single chat message (user, assistant, system, or tool).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique message identifier |
| `conversation_id` | UUID | FK → conversations.id, NOT NULL, INDEX | Parent conversation |
| `user_id` | UUID | FK → users.id, NOT NULL, INDEX | Message author |
| `role` | TEXT | NOT NULL | One of: user, assistant, system, tool |
| `content` | TEXT | NOT NULL | Message body |
| `tool_calls` | JSONB | NULLABLE | Serialized tool call data from agent |
| `metadata` | JSONB | NULLABLE | Arbitrary metadata (e.g., token counts) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now(), INDEX | Message timestamp (sorted chronologically) |

### Table: `memory_embeddings`

Vector-indexed chunks of message content for semantic search.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique embedding identifier |
| `user_id` | UUID | FK → users.id, NOT NULL, INDEX | User for access scoping |
| `conversation_id` | UUID | FK → conversations.id, NOT NULL | Source conversation |
| `message_id` | UUID | FK → messages.id, NOT NULL | Source message |
| `content` | TEXT | NOT NULL | Chunked text (~500 chars) |
| `embedding` | VECTOR(N) | NOT NULL | Embedding vector (1536 or 3072 dims) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Index timestamp |

**Index:** IVFFlat index with cosine distance (`vector_cosine_ops`) on `embedding` column for efficient approximate nearest neighbor search.

### Table: `conversation_summaries`

Periodic LLM-generated summaries. One per conversation (upserted).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique summary identifier |
| `conversation_id` | UUID | FK → conversations.id, UNIQUE | Parent conversation |
| `summary_text` | TEXT | NOT NULL | Generated summary |
| `message_range_start` | INTEGER | NOT NULL | First message index covered |
| `message_range_end` | INTEGER | NOT NULL | Last message index covered |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Generation timestamp |

### Entity Relationship Diagram

```
users (1) ──── (N) conversations (1) ──── (N) messages
  │                                            
  │                                            
  └────────────────── (N) memory_embeddings ──── references messages
```

---

## Memory Architecture

The system implements a **dual memory architecture** — short-term for active conversation context, long-term for persistent recall across sessions.

### Short-Term Memory

| Property | Detail |
|----------|--------|
| **Backend** | LangGraph `AsyncPostgresSaver` (checkpoints stored in PostgreSQL) |
| **Scope** | Per `(user_id, thread_id)` pair |
| **Content** | Agent state graph position, message history, pending tool calls |
| **Lifecycle** | Active during conversation, preserved across server restarts |
| **Retrieval** | Loaded automatically when agent is invoked for a given `thread_id` |
| **Key Pattern** | `{thread_id}` in LangGraph configurable (thread_id = conversation UUID) |

The LangGraph checkpointer persists the entire agent state graph after each interaction. When a new message arrives for an existing conversation, the agent resumes from the exact state where it left off, preserving all conversation context including tool call history.

### Long-Term Memory

| Property | Detail |
|----------|--------|
| **Backend** | PostgreSQL + pgvector extension |
| **Scope** | Per `user_id` (cross-conversation) |
| **Content** | All message text, chunked and embedded as vectors |
| **Lifecycle** | Persistent; indexed on message send, never deleted (unless conversation is deleted) |
| **Retrieval** | Cosine similarity search via IVFFlat index |
| **Embedding Model** | OpenAI `text-embedding-3-small` (1536d, configurable) |

**Indexing Strategy:**
1. Every message (user and assistant) is split into 500-character chunks
2. Each chunk is embedded via the configured embedding model
3. Vectors are stored in `memory_embeddings` with foreign keys to the source user, conversation, and message
4. An IVFFlat index with 100 lists enables approximate nearest neighbor search

### Conversation Summaries

Periodic LLM-generated summaries provide condensed context for long conversations.

| Property | Detail |
|----------|--------|
| **Trigger** | When `message_count` reaches `summary_trigger_message_count` (default: 20) |
| **Input** | Last 20 messages of the conversation |
| **Output** | Single compact paragraph (max 300 words) covering key topics, decisions, and action items |
| **Storage** | Upserted into `conversation_summaries` (one per conversation) |

### Retrieval Strategy (Hybrid)

When the agent processes a new user message, the `MemoryRetriever` composes context from three sources in priority order:

1. **Conversation Summary** (if available) — High-level context of prior messages
2. **Recent Messages** — Last N messages from current conversation (default: 20), most recent first
3. **Semantic Search Results** — Top-K semantically similar messages from the user's entire history (default: 5), across all conversations

This hybrid approach ensures the agent has:
- **Immediate continuity** from recent conversation messages
- **Long-term recall** of related topics discussed in any past conversation
- **Condensed awareness** of lengthy conversation history via summaries

---

## User Isolation & Security

### Authentication Flow

```
1. Client registers/logs in → receives JWT
2. Client sends Authorization: Bearer <token> on every request
3. Middleware/Dep extracts user_id server-side via token decode
4. All downstream operations scoped by user_id
```

### Isolation Mechanisms

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **API** | JWT extraction | `user_id` decoded from token, never from request body |
| **Repository** | Query scoping | Every repository method takes `user_id` as first parameter; SQLAlchemy WHERE clauses enforce `user_id = :user_id` |
| **Conversations** | Ownership check | `get_by_user_and_id(user_id, conversation_id)` — returns None if user doesn't own the conversation → 404 |
| **Checkpoints** | Thread ID namespacing | LangGraph checkpoints are keyed by `thread_id` (which equals `conversation_id`); cross-user access blocked at conversation ownership level |
| **Redis (future)** | Key prefixing | All user-scoped cache keys prefixed with `user:{user_id}:` |

### Security Principles

1. **Never trust the client** — `user_id` is ALWAYS extracted server-side from the JWT
2. **Row-level ownership** — Every database query scoped by `user_id` at the repository layer
3. **Fail closed** — Missing/invalid token → 401; valid token but wrong user → 404 (not 403, to avoid leaking existence)
4. **Password security** — bcrypt hashing via passlib, never stored in plaintext
5. **Environment isolation** — All secrets loaded from `.env`, never committed to source

---

## Chat Lifecycle

### 1. Create Conversation (`POST /api/conversations`)

```
Triggers: User clicks "New Chat" or sends first message
Action:
  1. INSERT into conversations (new UUID, user_id, status='active')
  2. Return { conversation_id, thread_id: <same UUID> }

Agent State: Fresh (no LangGraph checkpoint exists yet)
History: Conversation appears in user's conversation list
```

### 2. Send Message (`POST /api/conversations/{id}/messages`)

```
Triggers: User types and sends a message in an existing conversation
Pre-checks:
  1. Verify conversation.user_id == auth.user_id (404 if not)
  2. Validate message content (1-32000 chars)

Flow:
  ┌─ 1. Persist user message to DB ───────────────────────┐
  │   INSERT INTO messages (role='user', content=...)      │
  └────────────────────────────────────────────────────────┘
                            │
  ┌─ 2. Retrieve context ─────────────────────────────────┐
  │   • Short-term: Load LangGraph checkpoint (thread_id)  │
  │   • Long-term: pgvector semantic search (top 5)        │
  │   • Summary: Load latest conversation summary          │
  │   → Combine into injected context                      │
  └────────────────────────────────────────────────────────┘
                            │
  ┌─ 3. Agent execution ──────────────────────────────────┐
  │   • Build prompt (system + context + user message)     │
  │   • Invoke DeepAgents ReAct agent                      │
  │   • Stream tokens to client via SSE                    │
  └────────────────────────────────────────────────────────┘
                            │
  ┌─ 4. Post-completion cleanup ──────────────────────────┐
  │   • Save LangGraph checkpoint                          │
  │   • INSERT assistant message                           │
  │   • Update message_count (counter cache)               │
  │   • Auto-generate title from first message             │
  │   • Index both messages as embeddings                  │
  │   • Trigger summary generation if message_count >= 20  │
  └────────────────────────────────────────────────────────┘
```

### 3. "New Chat" Behavior

**What happens when a user creates a new conversation:**

| Aspect | Behavior |
|--------|----------|
| **Database** | New `conversations` row created with fresh UUID |
| **Short-term memory** | Blank — LangGraph starts from initial state (no checkpoint) |
| **Long-term memory** | **Fully intact** — semantic search spans ALL user conversations |
| **Old conversations** | **Preserved** — remain in DB, fully queryable, resumable |
| **Summaries** | Old conversations keep their summaries |

**Key insight:** "New Chat" does NOT delete or archive anything. It simply creates a new `thread_id` with a clean LangGraph state. The user's long-term memory (embeddings, summaries) spans across conversations, providing continuity while maintaining conversation isolation.

### 4. Conversation Management

| Action | Endpoint | Effect |
|--------|----------|--------|
| **List** | `GET /api/conversations` | Returns user's conversations sorted by `updated_at` desc, excluding deleted |
| **Get** | `GET /api/conversations/{id}` | Returns single conversation details |
| **Update** | `PATCH /api/conversations/{id}` | Change title or status (active/archived/deleted) |
| **Soft delete** | `DELETE /api/conversations/{id}` | Sets status to 'deleted' — data preserved, filtered from lists |
| **Archive** | `PATCH` with status=archived | Removes from default list, still accessible |

---

## Agent Design

### Architecture Shift: DeepAgents + LangGraph

The agent has been refactored to use **DeepAgents** (`deepagents>=0.5.8`) as the primary orchestration layer, replacing LangGraph's `create_react_agent`. DeepAgents provides a superset of built-in tools (filesystem, execution, sub-agents) while remaining fully compatible with LangGraph's checkpointing and streaming primitives.

```
         ┌──────────┐
         │  START    │
         └────┬──────┘
              │
    ┌─────────▼─────────────────┐
    │   DeepAgent Node          │  ◄── LLM decides: respond, call built-in tool, or delegate?
    │   (ChatOpenAI)            │
    └──┬────────────┬───────────┘
       │            │
       │ (respond)  │ (tool call or sub-agent)
       │            │
    ┌──▼──┐    ┌───▼──────────────────┐
    │ END │    │  Tool / Sub-Agent     │  ◄── Executes built-in/custom tool or delegates to
    └─────┘    │  Node                 │      a sub-agent via `task`
               └────┬──────────────────┘
                    │
                    └──────→ back to DeepAgent Node

Checkpointer: AsyncPostgresSaver (saves after each node execution)
Store: InMemoryStore (persistent long-term fact storage)
Backend: InMemoryBackend (ephemeral working memory)
```

**Why DeepAgents?**
- **Built-in filesystem tools**: No manual tool definitions for `ls`, `read`, `write`, `edit`, `glob`, `grep` — they are injected by `FilesystemMiddleware` automatically.
- **Sub-agent delegation**: The `task` tool automatically spawns an isolated sub-agent with its own context window when complex work is detected.
- **Code execution**: The `execute` tool runs shell commands within a permission-controlled sandbox.
- **TODO tracking**: The `write_todos` tool helps the agent track progress for multi-step tasks.
- **Context window optimization**: Delegation keeps the main agent's conversation history lean, while sub-agents handle detailed work.

### AgentState

```python
class AgentState(TypedDict):
    messages: list[BaseMessage]        # Full conversation history
    long_term_context: str              # Injected long-term memory context
```

### Available Tools

The tool suite is now a hybrid of **built-in DeepAgents tools** and **custom application tools**:

#### Custom Tools (Defined in `src/agent/tools.py`)

| Tool | Description |
|------|-------------|
| `get_current_datetime` | Returns current date/time in ISO format |
| `web_search` | Real DuckDuckGo web search for current events and data |

#### Built-in DeepAgents Tools (Auto-injected)

| Tool | Category | Description |
|------|----------|-------------|
| `ls` | Filesystem | List files and directories |
| `read_file` | Filesystem | Read file contents (txt, pdf, etc.) |
| `write_file` | Filesystem | Create or overwrite files |
| `edit_file` | Filesystem | Modify existing files inline |
| `glob` | Filesystem | Search for files matching a pattern |
| `grep` | Filesystem | Search file contents using regex |
| `execute` | Execution | Run shell commands (permission-controlled) |
| `task` | Delegation | Delegate complex work to an isolated sub-agent |
| `write_todos` | Planning | Create and manage a TODO list for multi-step tasks |

All built-in tools are automatically registered by `create_deep_agent()` when the `tools=` and `backend=` parameters are provided.

### Tool Registration

```python
# In src/agent/graph.py
from deepagents import create_deep_agent, InMemoryBackend, InMemoryStore

backend = InMemoryBackend()  # Ephemeral working memory
store = InMemoryStore()      # Persistent long-term facts

deep_agent = create_deep_agent(
    llm=llm,
    tools=custom_tools,      # get_current_datetime, web_search
    backend=backend,
    store=store,
    # ... checkpointer, etc.
)
```

### System Prompt

The system prompt is dynamically formatted with the current date and provides:
- Agent role description
- Full list of available tool capabilities (including built-in DeepAgents tools)
- Behavioral guidelines (be concise, admit uncertainty, maintain professional tone)
- **Delegation guidelines** — when to use `task` for complex multi-step work
- Acknowledgment instruction for historical context

### Context Injection

When long-term memory is available, it's injected as a `SystemMessage` prepended to the conversation:

```
[LONG-TERM MEMORY CONTEXT]
Relevant information from the user's conversation history:
[contents of retrieved context]

Based on this context and the user's new message, respond naturally.
```

### Streaming Orchestrator (`AgentOrchestrator`)

The orchestrator now wraps the DeepAgents graph (which is a standard LangGraph `CompiledStateGraph`) and provides the same streaming interface:

```python
async def stream(
    user_input: str,
    thread_id: str,
    long_term_context: str = "",
) -> AsyncGenerator[str, None]:
```

- Accepts user input, thread ID, and optional long-term context
- Prepends context as a SystemMessage if provided
- Configures the graph with `configurable.thread_id` for checkpointing
- Streams via `graph.astream_events(version="v2")`, filtering for `on_chat_model_stream` events
- **DeepAgents compatibility**: The returned graph is a standard LangGraph compiled graph, so `astream_events` works identically
- Yields individual tokens as they're generated
- Handles errors with structured logging

---

## API Reference

### Base URL

All endpoints are prefixed with `/api`.

### Authentication Endpoints

#### `POST /api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "display_name": "Jane Doe",
  "password": "secure_password_123"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "Jane Doe"
  }
}
```

**Errors:** 409 (email already registered), 422 (validation error)

---

#### `POST /api/auth/login`

Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password_123"
}
```

**Response (200):** Same format as register.

**Errors:** 401 (invalid credentials), 422 (validation error)

---

### Conversation Endpoints

All conversation endpoints require `Authorization: Bearer <token>` header.

#### `POST /api/conversations`

Create a new conversation ("New Chat").

**Request Body:**
```json
{
  "title": "Optional initial title"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": null,
  "status": "active",
  "message_count": 0,
  "created_at": "2026-05-09T10:00:00Z",
  "updated_at": "2026-05-09T10:00:00Z"
}
```

---

#### `GET /api/conversations`

List authenticated user's conversations.

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `archived`, `deleted`). Default: all non-deleted.
- `offset` (int, default 0): Pagination offset
- `limit` (int, default 20, max 100): Items per page

**Response (200):**
```json
{
  "items": [ ... ],
  "total": 42
}
```

---

#### `GET /api/conversations/{conversation_id}`

Get a single conversation by ID.

**Response (200):** Single `ConversationResponse` object.

**Errors:** 404 (not found or not owned by user)

---

#### `PATCH /api/conversations/{conversation_id}`

Update conversation title or status.

**Request Body:**
```json
{
  "title": "New title",
  "status": "archived"
}
```

Both fields are optional.

**Response (200):** Updated `ConversationResponse`.

---

#### `DELETE /api/conversations/{conversation_id}`

Soft-delete a conversation (sets status to `deleted`).

**Response (204):** No content.

---

### Message Endpoints

#### `GET /api/conversations/{conversation_id}/messages`

List messages in a conversation.

**Query Parameters:**
- `offset` (int, default 0)
- `limit` (int, default 50)

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "user_id": "uuid",
      "role": "user",
      "content": "Hello!",
      "tool_calls": null,
      "metadata": null,
      "created_at": "2026-05-09T10:00:00Z"
    }
  ],
  "total": 10
}
```

---

#### `POST /api/conversations/{conversation_id}/messages`

Send a message to the agent. **Streams response via SSE.**

**Request Body:**
```json
{
  "content": "What's the weather like?"
}
```

**Response:** `text/event-stream` (Server-Sent Events)

```
data: Hello!
data: I
data: can
data: help
...
data: [DONE]
```

On error:
```
event: error
data: Not Found
```

The stream yields one `data:` event per token. A final `data: [DONE]` event signals completion. The `[DONE]` sentinel indicates the server has finished processing — all side effects (message persistence, embedding indexing) are complete at this point.

**Client handling:**
```javascript
const eventSource = new EventSource('/api/conversations/{id}/messages');
eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') {
    eventSource.close();
    return;
  }
  // Append token to UI
};
eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', event.data);
  eventSource.close();
});
```

---

### Memory Endpoints

#### `POST /api/memory/search`

Semantic search across the user's entire conversation history.

**Request Body:**
```json
{
  "query": "What did we discuss about deployment?",
  "top_k": 5
}
```

- `query` — Natural language search query (1-1000 chars)
- `top_k` — Number of results (1-50, default 5)

**Response (200):**
```json
[
  {
    "message_id": "uuid",
    "conversation_id": "uuid",
    "content": "...matched message chunk...",
    "similarity": 0.92,
    "created_at": "2026-05-09T10:00:00Z"
  }
]
```

---

#### `GET /api/memory/conversations/{conversation_id}/summary`

Retrieve the latest LLM-generated summary for a conversation.

**Response (200):**
```json
{
  "conversation_id": "uuid",
  "summary_text": "This conversation covered deployment strategies...",
  "message_range_start": 0,
  "message_range_end": 19,
  "created_at": "2026-05-09T10:00:00Z"
}
```

If no summary has been generated yet:
```json
{
  "summary_text": null
}
```

---

### Health Check

#### `GET /api/health`

**Response (200):**
```json
{
  "status": "healthy",
  "environment": "development"
}
```

No authentication required. Used for load balancer health checks and monitoring.

---

## Configuration

All configuration is managed via environment variables using Pydantic Settings. See `.env.example` for the full list.

### Core Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | Environment (`development`, `staging`, `production`) |
| `LOG_LEVEL` | `INFO` | Log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `CORS_ORIGINS` | `["*"]` | Allowed CORS origins (JSON array) |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async PostgreSQL connection (SQLAlchemy) |
| `DATABASE_URL_SYNC` | `postgresql://...` | Sync PostgreSQL connection (Alembic) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection |

### LLM Provider

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `openai` | Provider (`openai`, `anthropic`, `groq`) |
| `LLM_MODEL` | `gpt-4o` | Model name |
| `LLM_API_KEY` | (required) | Provider API key |
| `LLM_TEMPERATURE` | `0.7` | Generation temperature |

### Embeddings

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBEDDING_PROVIDER` | `openai` | Embedding provider |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Embedding model |
| `EMBEDDING_DIMENSIONS` | `1536` | Vector dimensions (must match model) |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET_KEY` | `change-me` | HS256 signing secret |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_EXPIRE_MINUTES` | `1440` | Token expiry (24h default) |

### Memory Tuning

| Variable | Default | Description |
|----------|---------|-------------|
| `CONVERSATION_MAX_MESSAGES_FOR_CONTEXT` | `20` | Recent messages for short-term context |
| `MEMORY_RETRIEVAL_TOP_K` | `5` | Semantic search results to retrieve |
| `SUMMARY_TRIGGER_MESSAGE_COUNT` | `20` | Message threshold for auto-summary |
| `PGVECTOR_DISTANCE_STRATEGY` | `cosine` | pgvector distance metric |

---

## Setup & Deployment

### Prerequisites

- Docker and Docker Compose
- Python 3.12+
- An OpenAI (or compatible) API key

### Local Development

```bash
# 1. Clone and enter project
cd chatbot

# 2. Start infrastructure (PostgreSQL + pgvector + Redis)
docker compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env — at minimum set LLM_API_KEY and a secure JWT_SECRET_KEY

# 4. Create a virtual environment and install dependencies
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
pip install -r requirements.txt

# 5. Run database migrations
alembic upgrade head

# 6. Start the development server
uvicorn src.main:app --reload --port 8000

# 7. Open API docs
open http://localhost:8000/docs
```

### Docker Deployment

```bash
# Build the image
docker build -t chatbot:latest .

# Run with your environment
docker run -d \
  --name chatbot \
  -p 8000:8000 \
  --env-file .env \
  chatbot:latest

# Or use docker-compose with the app service added:
# Add to docker-compose.yml:
#   app:
#     build: .
#     ports: ["8000:8000"]
#     env_file: .env
#     depends_on: [postgres, redis]
```

### Production Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Generate a strong `JWT_SECRET_KEY` (e.g., `openssl rand -hex 32`)
- [ ] Configure restrictive `CORS_ORIGINS` (not `["*"]`)
- [ ] Run behind a reverse proxy (nginx) with TLS termination
- [ ] Set up database backups (pg_dump schedule)
- [ ] Configure observability (Prometheus + Grafana, log aggregation)
- [ ] Set up health check monitoring on `/api/health`
- [ ] Disable API docs (`/docs`) in production (automatically done when `ENVIRONMENT=production`)
- [ ] Increase uvicorn workers: `uvicorn src.main:app --workers 4 --host 0.0.0.0`
- [ ] Configure PostgreSQL connection pooling for production load

---

## Scaling Considerations

### Horizontal Scaling

The API is **stateless** — all state lives in PostgreSQL and Redis. This means:

- **Multiple API instances** can run behind a load balancer without session affinity
- **LangGraph checkpoints** are stored in PostgreSQL, accessible from any instance
- **SSE connections** work with any instance — state is re-loaded from the DB on each message
- **No sticky sessions required**

### Database Scaling

| Concern | Strategy |
|---------|----------|
| **Connection pooling** | SQLAlchemy pool (20 + 10 overflow). Increase per instance. |
| **Read replicas** | Route read-heavy queries (message listing, conversation listing) to replicas |
| **pgvector at scale** | IVFFlat index works well up to ~10M vectors. Beyond that, consider dedicated vector DB (Pinecone, Weaviate, Qdrant) |
| **Migration safety** | Alembic with async runner. Always test migrations on staging first. |

### Redis

| Concern | Strategy |
|---------|----------|
| **High availability** | Redis Sentinel for automatic failover |
| **Scaling** | Redis Cluster for sharding if cache grows beyond single-node memory |
| **Persistence** | Enable AOF (append-only file) for durability if Redis is used for critical state |

### Background Processing

- **Summary generation** and **embedding indexing** are synchronous in the current implementation
- For production: move these to a background worker (Celery, ARQ, or a simple `asyncio.create_task` with retry logic) to avoid blocking the API event loop during long conversations

### Streaming Connections

- **Uvicorn** handles async connections efficiently
- **Nginx** reverse proxy should be configured with:
  ```
  proxy_buffering off;
  proxy_read_timeout 300s;
  ```
- **Connection limits**: Monitor open SSE connections; set max connections per worker

---

## Testing

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run unit tests only
pytest tests/unit/ -v

# Run integration tests only
pytest tests/integration/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html
```

### Test Structure

| File | Tests |
|------|-------|
| `conftest.py` | Shared fixtures: async test client, auth headers, test user ID, anyio backend |
| `unit/test_agent_graph.py` | Agent state structure, prompt template rendering, context template formatting |
| `unit/test_memory_retriever.py` | Retriever instantiation, empty context handling |
| `unit/test_services.py` | Password hashing/verification, conversation creation flow |
| `integration/test_conversations_api.py` | Health endpoint, auth validation (422/401), protected route guards |
| `integration/test_isolation.py` | Token encode/decode roundtrip, invalid token handling, namespace key patterns |

### Key Test Principles

- **No real LLM calls** in unit tests — mock the orchestrator and retriever
- **No real database** in unit tests — mock repositories
- **Integration tests** test the HTTP layer: middleware, auth guards, route validation
- **Isolation tests** verify that user A cannot access user B's data

---

## Error Handling & Observability

### Exception Hierarchy

All application errors inherit from `AppError`:

```
AppError (base, 500)
├── NotFoundError (404)     — entity not found
├── UnauthorizedError (401) — auth missing or invalid
├── ForbiddenError (403)    — insufficient permissions
├── ConflictError (409)     — duplicate resource
├── ValidationError (422)   — invalid input
├── AgentError (500)        — agent execution failure
└── MemoryError (500)       — memory operation failure
```

### Global Error Handler

The FastAPI app has a global exception handler for `AppError`:

```python
@app.exception_handler(AppError)
async def app_error_handler(request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, **exc.detail},
    )
```

All service-layer exceptions propagate up to the route handlers, which convert them to HTTP responses with appropriate status codes and structured error bodies.

### Logging

**structlog** is configured for structured logging. In development: colorful console output. In production: JSON format.

**Log levels per environment:**
- `development`: DEBUG (SQLAlchemy queries, detailed agent traces)
- `staging`: INFO (request lifecycle, conversation events)
- `production`: WARNING (only error and significant events)

**Key log events:**
- `request_completed` — HTTP method, path, status code, duration (via middleware)
- `user_registered` / `user_logged_in` — Auth events
- `conversation_created` / `conversation_deleted` — Conversation lifecycle
- `message_processed` — Message with response length
- `agent_stream_error` — Agent execution failures
- `summary_generated` / `summary_generation_failed` — Summary pipeline
- `embedding_index_failed` — Individual embedding failures (non-fatal)
- `checkpointer_initialized` — Startup event

**Every log entry** includes a `request_id` (UUID) from the middleware, enabling trace correlation across the request lifecycle.

### Prometheus Metrics (Future)

The `src/core/metrics.py` module is reserved for Prometheus instrumentation. Recommended metrics:

- `http_requests_total` — Counter by method, path, status
- `http_request_duration_seconds` — Histogram
- `agent_stream_tokens_total` — Counter
- `memory_search_duration_seconds` — Histogram
- `db_connections_active` — Gauge
- `sse_connections_active` — Gauge

---

## Extending the System

### Adding a New Tool

1. Define the tool in `src/agent/tools.py` using `@tool` decorator
2. Add it to the `AGENT_TOOLS` list
3. The agent will automatically discover and use it

### Adding a New LLM Provider

1. Add the provider name to the `LLM_PROVIDER` Literal type in `src/core/config.py`
2. Extend `_build_llm()` in `src/core/di.py` to instantiate the appropriate LangChain chat model

### Adding a New API Route

1. Create a new file in `src/api/routes/`
2. Define your `APIRouter` with appropriate prefix and tags
3. Register it in `src/main.py` with `app.include_router(your_module.router)`

### Adding a New Memory Backend

1. Implement a new retriever class following the `MemoryRetriever` interface
2. Update `get_retriever()` in `src/core/di.py` to return your implementation
3. The message service uses the retriever through the `MemoryRetriever` interface

---

*Generated: 2026-05-09 | Version: 1.0.0*