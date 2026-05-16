import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import get_current_user_id, get_message_repo
from src.core.exceptions import AppError
from src.memory.long_term import embed_text
from src.schemas.message import MemorySearchRequest, MemorySearchResult
from src.services import message as message_service

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.post("/search", response_model=list[MemorySearchResult])
async def search_memory(
    body: MemorySearchRequest,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    message_repo=Depends(get_message_repo),
):
    try:
        results = await message_service.search_memory(
            message_repo=message_repo,
            user_id=user_id,
            query=body.query,
            top_k=body.top_k,
            embed_fn=embed_text,
        )
        return results
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/conversations/{conversation_id}/summary")
async def get_conversation_summary(
    conversation_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    message_repo=Depends(get_message_repo),
):
    summary = await message_repo.get_latest_summary(conversation_id)
    if summary:
        return {
            "conversation_id": str(summary.conversation_id),
            "summary_text": summary.summary_text,
            "message_range_start": summary.message_range_start,
            "message_range_end": summary.message_range_end,
            "created_at": summary.created_at.isoformat(),
        }
    return {"summary_text": None}
