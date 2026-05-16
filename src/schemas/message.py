import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MessageSendRequest(BaseModel):
    content: str = Field(min_length=1, max_length=32000)


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    content: str
    tool_calls: dict | None = None
    metadata: dict | None = Field(default=None, validation_alias="metadata_")
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageListResponse(BaseModel):
    items: list["MessageResponse"]
    total: int


class MemorySearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=50)


class MemorySearchResult(BaseModel):
    message_id: uuid.UUID
    conversation_id: uuid.UUID
    content: str
    similarity: float
    created_at: datetime
