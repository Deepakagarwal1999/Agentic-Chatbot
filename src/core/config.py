from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = "postgresql+asyncpg://chatbot:chatbot@localhost:5432/chatbot"
    database_url_sync: str = "postgresql://chatbot:chatbot@localhost:5432/chatbot"
    redis_url: str = "redis://localhost:6379/0"

    llm_provider: Literal["openai", "anthropic", "groq", "nvidia"] = "nvidia"
    llm_model: str = "nvidia/llama-3.1-nemotron-70b-instruct"
    llm_api_key: SecretStr = SecretStr("")
    llm_temperature: float = 0.7

    embedding_provider: Literal["openai", "nvidia"] = "nvidia"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    environment: Literal["development", "staging", "production"] = "development"
    cors_origins: list[str] = ["*"]

    conversation_max_messages_for_context: int = 20
    memory_retrieval_top_k: int = 5
    summary_trigger_message_count: int = 20

    pgvector_distance_strategy: Literal["cosine", "l2", "inner_product"] = "cosine"

    # Frontend-related, ignored by backend but present in shared .env files
    vite_api_base_url: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()