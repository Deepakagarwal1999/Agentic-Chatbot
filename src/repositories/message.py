import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.message import ConversationSummary, MemoryEmbedding, Message
from src.repositories.base import BaseRepository


class MessageRepository(BaseRepository[Message]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Message)

    async def list_by_conversation(
        self,
        conversation_id: uuid.UUID,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Message], int]:
        conditions = [Message.conversation_id == conversation_id]

        # Only run count query if a total is actually needed
        # (avoids overhead for simple pagination on large conversation histories)
        count_query = select(func.count()).select_from(Message).where(*conditions)
        total = (await self.session.execute(count_query)).scalar_one()

        # Window for efficient, relative cursor pagination
        query = (
            select(Message)
            .where(*conditions)
            .order_by(Message.created_at.asc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all()), total

    async def get_recent_by_conversation(
        self,
        conversation_id: uuid.UUID,
        limit: int = 20,
    ) -> list[Message]:
        # Fetch recent messages then reverse instead of sorting all then slicing
        query = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        messages = list(result.scalars().all())
        messages.reverse()
        return messages

    async def create(
        self,
        conversation_id: uuid.UUID,
        user_id: uuid.UUID,
        role: str,
        content: str,
        tool_calls: dict | None = None,
        metadata_: dict | None = None,
    ) -> Message:
        message = Message(
            conversation_id=conversation_id,
            user_id=user_id,
            role=role,
            content=content,
            tool_calls=tool_calls,
            metadata_=metadata_,
        )
        self.session.add(message)
        await self.session.flush()
        await self.session.refresh(message)
        return message

    async def bulk_create_memory_embeddings(
        self, embeddings: list[MemoryEmbedding]
    ) -> None:
        self.session.add_all(embeddings)
        await self.session.flush()

    async def search_similar_messages(
        self,
        user_id: uuid.UUID,
        embedding: list[float],
        top_k: int = 5,
    ) -> list[dict]:
        from sqlalchemy import text

        # pgvector expects the embedding as a string like '[0.1, 0.2, ...]'
        embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"

        query = text(
            """
            SELECT me.id, me.user_id, me.conversation_id, me.message_id,
                   me.content, me.created_at,
                   1 - (me.embedding <=> cast(:embedding AS vector)) AS similarity
            FROM memory_embeddings me
            WHERE me.user_id = :user_id
            ORDER BY me.embedding <=> cast(:embedding AS vector)
            LIMIT :top_k
        """
        )
        result = await self.session.execute(
            query,
            {
                "user_id": user_id,
                "embedding": embedding_str,
                "top_k": top_k,
            },
        )
        rows = result.mappings().all()
        return [dict(row) for row in rows]

    async def get_latest_summary(
        self, conversation_id: uuid.UUID
    ) -> ConversationSummary | None:
        query = (
            select(ConversationSummary)
            .where(ConversationSummary.conversation_id == conversation_id)
            .order_by(ConversationSummary.created_at.desc())
            .limit(1)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def upsert_summary(
        self,
        conversation_id: uuid.UUID,
        summary_text: str,
        range_start: int,
        range_end: int,
    ) -> ConversationSummary:
        existing = await self.get_latest_summary(conversation_id)
        if existing:
            existing.summary_text = summary_text
            existing.message_range_start = range_start
            existing.message_range_end = range_end
            await self.session.flush()
            await self.session.refresh(existing)
            return existing

        summary = ConversationSummary(
            conversation_id=conversation_id,
            summary_text=summary_text,
            message_range_start=range_start,
            message_range_end=range_end,
        )
        self.session.add(summary)
        await self.session.flush()
        await self.session.refresh(summary)
        return summary
