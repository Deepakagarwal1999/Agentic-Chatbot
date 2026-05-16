import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ConversationCreateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=500)


class ConversationUpdateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    status: str | None = Field(default=None, pattern="^(active|archived|deleted)$")


class ConversationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str | None
    status: str
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    items: list["ConversationResponse"]
    total: int
