import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.deps import (
    get_conversation_repo,
    get_current_user_id,
)
from src.core.exceptions import AppError
from src.schemas.conversation import (
    ConversationCreateRequest,
    ConversationListResponse,
    ConversationResponse,
    ConversationUpdateRequest,
)
from src.services import conversation as conversation_service

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.post("", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    body: ConversationCreateRequest,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    conversation_repo=Depends(get_conversation_repo),
):
    try:
        result = await conversation_service.create_conversation(
            conversation_repo=conversation_repo,
            user_id=user_id,
            title=body.title,
        )
        return result
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    conversation_repo=Depends(get_conversation_repo),
    status: str | None = Query(default=None, pattern="^(active|archived|deleted)$"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
):
    try:
        conversations, total = await conversation_service.list_conversations(
            conversation_repo=conversation_repo,
            user_id=user_id,
            status=status,
            offset=offset,
            limit=limit,
        )
        return {"items": conversations, "total": total}
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    conversation_repo=Depends(get_conversation_repo),
):
    try:
        return await conversation_service.get_conversation(
            conversation_repo=conversation_repo,
            user_id=user_id,
            conversation_id=conversation_id,
        )
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: uuid.UUID,
    body: ConversationUpdateRequest,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    conversation_repo=Depends(get_conversation_repo),
):
    try:
        return await conversation_service.update_conversation(
            conversation_repo=conversation_repo,
            user_id=user_id,
            conversation_id=conversation_id,
            title=body.title,
            status=body.status,
        )
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    conversation_repo=Depends(get_conversation_repo),
):
    try:
        await conversation_service.delete_conversation(
            conversation_repo=conversation_repo,
            user_id=user_id,
            conversation_id=conversation_id,
        )
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
