import traceback
from typing import Any, AsyncGenerator

import structlog
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langgraph.graph.state import CompiledStateGraph

from src.agent.prompts import CONTEXT_TEMPLATE

logger = structlog.get_logger(__name__)

_MAX_RETRIES = 3
_BASE_BACKOFF_SECONDS = 2.0


class AgentOrchestrator:
    def __init__(self, graph: CompiledStateGraph):
        self.graph = graph

    async def stream(
        self,
        user_input: str,
        thread_id: str,
        long_term_context: str = "",
    ) -> AsyncGenerator[str, None]:
        messages: list[BaseMessage] = [HumanMessage(content=user_input)]

        if long_term_context:
            context_prompt = CONTEXT_TEMPLATE.format(context=long_term_context)
            messages.insert(0, SystemMessage(content=context_prompt))

        config: dict[str, Any] = {"configurable": {"thread_id": thread_id}}

        last_exc: Exception | None = None
        for attempt in range(_MAX_RETRIES):
            try:
                async for event in self.graph.astream_events(
                    {"messages": messages},
                    config=config,  # type: ignore[arg-type]
                    version="v2",
                ):
                    kind = event.get("event")
                    if kind == "on_chat_model_stream":
                        data = event.get("data", {})
                        chunk = data.get("chunk")  # type: ignore[union-attr]
                        if chunk is not None:
                            content = chunk.content
                            if content:
                                yield content
                # If we reach here without error, break out of retry loop
                return

            except Exception as exc:
                last_exc = exc
                if _is_rate_limit_error(exc) and attempt < _MAX_RETRIES - 1:
                    wait = _BASE_BACKOFF_SECONDS * (2**attempt)
                    logger.warning(
                        "agent_stream_rate_limited",
                        attempt=attempt + 1,
                        max_retries=_MAX_RETRIES,
                        backoff_seconds=wait,
                        thread_id=thread_id,
                    )
                    await asyncio.sleep(wait)
                    continue

                logger.error(
                    "agent_stream_error",
                    error=str(exc) or repr(exc),
                    error_type=type(exc).__name__,
                    traceback=traceback.format_exc(),
                    thread_id=thread_id,
                )
                raise

        # Should not reach here, but just in case
        if last_exc:
            raise last_exc


def _is_rate_limit_error(exc: Exception) -> bool:
    """Check if an exception is a rate-limit (429) error."""
    exc_str = str(exc)
    if "429" in exc_str or "Too Many Requests" in exc_str or "rate" in exc_str.lower():
        return True
    # Check nested cause
    if exc.__cause__:
        return _is_rate_limit_error(exc.__cause__)
    return False


def create_orchestrator(graph: CompiledStateGraph) -> AgentOrchestrator:
    return AgentOrchestrator(graph)
