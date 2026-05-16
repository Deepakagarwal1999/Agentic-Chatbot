from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.middleware import setup_middleware
from src.api.routes import auth, conversations, memory, messages
from src.core.config import get_settings
from src.core.di import _init_agent, shutdown_agent
from src.core.exceptions import AppError
from src.core.logging import configure_logging

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger = structlog.get_logger(__name__)
    logger.info("starting_up", environment=settings.environment)

    await _init_agent()

    yield

    logger.info("shutting_down")
    await shutdown_agent()


app = FastAPI(
    title="Chatbot API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_middleware(app)


@app.exception_handler(AppError)
async def app_error_handler(request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, **exc.detail},
    )


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "environment": settings.environment}


app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(memory.router)
