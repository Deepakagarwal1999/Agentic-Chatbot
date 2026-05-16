import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sse_starlette.sse import EventSourceResponse

from src.api.deps import (
    get_conversation_repo,
    get_current_user_id,
    get_message_repo,
)
from src.core.exceptions import AppError
from src.core.di import get_orchestrator, get_retriever
from src.schemas.message import (
    MessageListResponse,
    MessageResponse,
    MessageSendRequest,
)
from src.services import message as message_service

router = APIRouter(prefix="/api/conversations", tags=["messages"])


@router.get("/{conversation_id}/messages", response_model=MessageListResponse)
async def list_messages(
    conversation_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    message_repo=Depends(get_message_repo),
    offset: int = 0,
    limit: int = 50,
):
    try:
        messages, total = await message_service.list_messages(
            message_repo=message_repo,
            conversation_id=conversation_id,
            offset=offset,
            limit=limit,
        )
        return {"items": messages, "total": total}
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID,
    body: MessageSendRequest,
    request: Request,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    message_repo=Depends(get_message_repo),
    conversation_repo=Depends(get_conversation_repo),
):
    orchestrator = get_orchestrator()
    retriever = get_retriever(message_repo)

    async def event_generator():
        try:
            async for token in message_service.send_message_stream(
                message_repo=message_repo,
                conversation_repo=conversation_repo,
                user_id=user_id,
                conversation_id=conversation_id,
                content=body.content,
                orchestrator=orchestrator,
                memory_retriever=retriever,
            ):
                if await request.is_disconnected():
                    break
                yield {"data": token}

            yield {"data": "[DONE]"}

        except AppError as exc:
            yield {"event": "error", "data": str(exc.detail)}
        except Exception as exc:
            yield {"event": "error", "data": str(exc)}

    return EventSourceResponse(event_generator())