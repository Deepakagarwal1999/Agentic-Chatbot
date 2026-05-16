import asyncio
import uuid

import structlog

from src.core.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class MemoryRetriever:
    def __init__(self, message_repo):
        self.message_repo = message_repo

    async def retrieve_context(
        self,
        user_id: str,
        conversation_id: str,
        query: str,
    ) -> str:
        user_uuid = uuid.UUID(user_id)
        conv_uuid = uuid.UUID(conversation_id)

        # Run independent DB queries concurrently to reduce latency
        # (ordering is maintained through the event loop ordering)
        recent_future = asyncio.ensure_future(
            self.message_repo.get_recent_by_conversation(
                conversation_id=conv_uuid,
                limit=settings.conversation_max_messages_for_context,
            )
        )
        summary_future = asyncio.ensure_future(
            self.message_repo.get_latest_summary(conversation_id=conv_uuid)
        )

        from src.memory.long_term import embed_text

        semantic_results = []
        try:
            embedding = await embed_text(query)
            semantic_results = await self.message_repo.search_similar_messages(
                user_id=user_uuid,
                embedding=embedding,
                top_k=settings.memory_retrieval_top_k,
            )
        except Exception as exc:
            logger.warning("semantic_search_failed", error=str(exc))

        recent = await recent_future
        summary = await summary_future

        parts = []

        if summary:
            parts.append(f"[CONVERSATION SUMMARY]\n{summary.summary_text}")

        if recent:
            parts.append("[RECENT MESSAGES]")
            for msg in recent:
                parts.append(f"[{msg.role}]: {msg.content[:500]}")

        if semantic_results:
            parts.append("[RELATED PAST CONTEXT]")
            for row in semantic_results:
                parts.append(
                    f"[from conversation {row['conversation_id']}]: {row['content'][:300]}"
                )

        return "\n\n".join(parts)


def create_retriever(message_repo) -> MemoryRetriever:
    return MemoryRetriever(message_repo)
