import uuid
from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.exceptions import UnauthorizedError
from src.repositories.conversation import ConversationRepository
from src.repositories.message import MessageRepository
from src.repositories.user import UserRepository
from src.services.auth import decode_access_token


async def get_current_user_id(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> uuid.UUID:
    if not authorization:
        raise UnauthorizedError("Missing Authorization header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise UnauthorizedError("Invalid Authorization header format")

    user_id_str = decode_access_token(token)
    return uuid.UUID(user_id_str)


async def get_user_repo(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserRepository:
    return UserRepository(session)


async def get_conversation_repo(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ConversationRepository:
    return ConversationRepository(session)


async def get_message_repo(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> MessageRepository:
    return MessageRepository(session)
