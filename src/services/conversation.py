import uuid

import structlog

from src.core.exceptions import ForbiddenError, NotFoundError
from src.models.conversation import Conversation, ConversationStatus

logger = structlog.get_logger(__name__)


async def create_conversation(
    conversation_repo,
    user_id: uuid.UUID,
    title: str | None = None,
) -> Conversation:
    conversation = await conversation_repo.create(user_id=user_id, title=title)
    logger.info("conversation_created", conversation_id=str(conversation.id), user_id=str(user_id))
    return conversation


async def get_conversation(
    conversation_repo,
    user_id: uuid.UUID,
    conversation_id: uuid.UUID,
) -> Conversation:
    conversation = await conversation_repo.get_by_user_and_id(user_id, conversation_id)
    if not conversation:
        raise NotFoundError("Conversation", str(conversation_id))
    return conversation


async def list_conversations(
    conversation_repo,
    user_id: uuid.UUID,
    status: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Conversation], int]:
    conv_status = None
    if status:
        try:
            conv_status = ConversationStatus(status)
        except ValueError:
            conv_status = None

    conversations, total = await conversation_repo.list_by_user(
        user_id=user_id,
        status=conv_status,
        offset=offset,
        limit=limit,
    )
    return conversations, total


async def update_conversation(
    conversation_repo,
    user_id: uuid.UUID,
    conversation_id: uuid.UUID,
    title: str | None = None,
    status: str | None = None,
) -> Conversation:
    conversation = await get_conversation(conversation_repo, user_id, conversation_id)

    updates = {}
    if title is not None:
        updates["title"] = title
    if status is not None:
        try:
            updates["status"] = ConversationStatus(status)
        except ValueError:
            pass

    if updates:
        conversation = await conversation_repo.update(conversation, **updates)

    logger.info("conversation_updated", conversation_id=str(conversation_id))
    return conversation


async def delete_conversation(
    conversation_repo,
    user_id: uuid.UUID,
    conversation_id: uuid.UUID,
) -> None:
    conversation = await get_conversation(conversation_repo, user_id, conversation_id)
    await conversation_repo.update(conversation, status=ConversationStatus.DELETED)
    logger.info("conversation_deleted", conversation_id=str(conversation_id))