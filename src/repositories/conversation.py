import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.conversation import Conversation, ConversationStatus
from src.repositories.base import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Conversation)

    async def get_by_user_and_id(
        self, user_id: uuid.UUID, conversation_id: uuid.UUID
    ) -> Conversation | None:
        result = await self.session.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: uuid.UUID,
        status: ConversationStatus | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Conversation], int]:
        conditions = [Conversation.user_id == user_id]
        if status:
            conditions.append(Conversation.status == status)
        else:
            conditions.append(Conversation.status != ConversationStatus.DELETED)

        count_query = select(func.count()).select_from(Conversation).where(*conditions)
        total = (await self.session.execute(count_query)).scalar_one()

        query = (
            select(Conversation)
            .where(*conditions)
            .order_by(Conversation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all()), total

    async def create(
        self, user_id: uuid.UUID, title: str | None = None
    ) -> Conversation:
        conversation = Conversation(user_id=user_id, title=title)
        self.session.add(conversation)
        await self.session.flush()
        await self.session.refresh(conversation)
        return conversation

    async def update(self, conversation: Conversation, **kwargs) -> Conversation:
        for key, value in kwargs.items():
            if hasattr(conversation, key):
                setattr(conversation, key, value)
        await self.session.flush()
        await self.session.refresh(conversation)
        return conversation
