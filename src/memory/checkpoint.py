from contextlib import _AsyncGeneratorContextManager

import structlog
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from src.core.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


_saver_instance: AsyncPostgresSaver | None = None
_saver_context: _AsyncGeneratorContextManager | None = None  # type: ignore[name-defined]


async def get_checkpointer() -> AsyncPostgresSaver:
    global _saver_instance, _saver_context
    if _saver_instance is None:
        conn_string = settings.database_url.replace("+asyncpg", "")
        _saver_context = AsyncPostgresSaver.from_conn_string(conn_string)
        saver = await _saver_context.__aenter__()  # type: ignore[union-attr]
        await saver.setup()  # type: ignore[union-attr]
        _saver_instance = saver  # type: ignore[assignment]
        logger.info("checkpointer_initialized")
    return _saver_instance  # type: ignore[return-value]


async def close_checkpointer() -> None:
    global _saver_instance, _saver_context
    if _saver_instance is not None:
        await _saver_instance.aclose()  # type: ignore[union-attr]
        if _saver_context is not None:
            await _saver_context.__aexit__(None, None, None)  # type: ignore[union-attr]
        _saver_instance = None
        _saver_context = None
        logger.info("checkpointer_closed")
