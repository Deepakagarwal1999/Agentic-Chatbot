import traceback
from typing import Any, AsyncGenerator

import structlog
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langgraph.graph.state import CompiledStateGraph

from src.agent.prompts import CONTEXT_TEMPLATE

logger = structlog.get_logger(__name__)


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

        except Exception as exc:
            logger.error(
                "agent_stream_error",
                error=str(exc) or repr(exc),
                error_type=type(exc).__name__,
                traceback=traceback.format_exc(),
                thread_id=thread_id,
            )
            raise


def create_orchestrator(graph: CompiledStateGraph) -> AgentOrchestrator:
    return AgentOrchestrator(graph)
