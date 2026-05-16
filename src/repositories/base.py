import uuid
from typing import Any, Generic, TypeVar

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, session: AsyncSession, model: type[ModelType]):
        self.session = session
        self.model = model

    async def get_by_id(self, entity_id: uuid.UUID) -> ModelType | None:
        model: Any = self.model
        result = await self.session.execute(
            select(self.model).where(model.id == entity_id)
        )
        return result.scalar_one_or_none()

    async def count_all(self) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(self.model)
        )
        return result.scalar_one()

    async def delete(self, entity_id: uuid.UUID) -> bool:
        model: Any = self.model
        result = await self.session.execute(
            delete(self.model).where(model.id == entity_id)
        )
        await self.session.flush()
        return result.rowcount > 0  # type: ignore[operator]
