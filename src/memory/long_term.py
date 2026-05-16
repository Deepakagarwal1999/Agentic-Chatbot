import asyncio
import uuid

import structlog
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from langchain_openai import OpenAIEmbeddings

from src.core.config import get_settings
from src.models.message import MemoryEmbedding, Message

logger = structlog.get_logger(__name__)
settings = get_settings()


_embeddings_instance: OpenAIEmbeddings | NVIDIAEmbeddings | None = None


def _get_embeddings() -> OpenAIEmbeddings | NVIDIAEmbeddings:
    global _embeddings_instance
    if _embeddings_instance is None:
        api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None
        if settings.embedding_provider == "nvidia":
            _embeddings_instance = NVIDIAEmbeddings(
                model=settings.embedding_model,
                api_key=api_key,
            )
        else:
            _embeddings_instance = OpenAIEmbeddings(
                model=settings.embedding_model,
                api_key=api_key,
                dimensions=settings.embedding_dimensions,
            )
    return _embeddings_instance


async def embed_text(text: str) -> list[float]:
    """Embed a single text string, running the sync SDK call in a thread pool."""
    # Use thread pool for long sync calls to avoid blocking the event loop
    embeddings = _get_embeddings()
    return await asyncio.to_thread(embeddings.embed_query, text)


async def index_message(
    message_repo,
    user_id: uuid.UUID,
    conversation_id: uuid.UUID,
    message: Message,
) -> None:
    if not message.content.strip():
        return

    chunks = [message.content[i : i + 500] for i in range(0, len(message.content), 500)]

    embedding_objects = []
    for chunk in chunks:
        if not chunk.strip():
            continue
        try:
            vec = await embed_text(chunk)
            embedding_objects.append(
                MemoryEmbedding(
                    user_id=user_id,
                    conversation_id=conversation_id,
                    message_id=message.id,
                    content=chunk,
                    embedding=vec,
                )
            )
        except Exception as exc:
            logger.warning("embedding_index_failed", error=str(exc), message_id=str(message.id))

    if embedding_objects:
        await message_repo.bulk_create_memory_embeddings(embedding_objects)
        logger.debug("messages_indexed", count=len(embedding_objects), message_id=str(message.id))