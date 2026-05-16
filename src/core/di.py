from functools import lru_cache
from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI

try:
    from langchain_nvidia_ai_endpoints import (  # pyright: ignore[reportMissingImports]
        ChatNVIDIA,
    )
except ImportError:  # pragma: no cover
    ChatNVIDIA: Any = None  # type: ignore[no-redef]

from src.agent.graph import build_agent_graph
from src.agent.orchestrator import AgentOrchestrator, create_orchestrator
from src.core.config import get_settings
from src.memory.checkpoint import get_checkpointer
from src.memory.retriever import MemoryRetriever, create_retriever

settings = get_settings()

_graph_instance = None
_orchestrator_instance: AgentOrchestrator | None = None


@lru_cache
def _build_llm() -> BaseChatModel:
    """Build the language model used by the agent."""
    if settings.llm_provider == "nvidia":
        if ChatNVIDIA is None:
            raise ImportError(
                "langchain-nvidia-ai-endpoints is required for the nvidia provider. "
                "Install it with: pip install langchain-nvidia-ai-endpoints"
            )
        return ChatNVIDIA(
            model=settings.llm_model,
            api_key=settings.llm_api_key.get_secret_value()
            if settings.llm_api_key
            else None,
            temperature=settings.llm_temperature,
        )
    return ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.llm_api_key,
        temperature=settings.llm_temperature,
    )


async def _init_agent() -> AgentOrchestrator:
    global _graph_instance, _orchestrator_instance

    if _orchestrator_instance is not None:
        return _orchestrator_instance

    llm = _build_llm()
    checkpointer = await get_checkpointer()
    _graph_instance = build_agent_graph(llm=llm, checkpointer=checkpointer)
    _orchestrator_instance = create_orchestrator(_graph_instance)
    return _orchestrator_instance


def get_orchestrator() -> AgentOrchestrator:
    if _orchestrator_instance is None:
        raise RuntimeError("Agent not initialized - call app startup first")
    return _orchestrator_instance


def get_retriever(message_repo) -> MemoryRetriever:
    return create_retriever(message_repo)


async def shutdown_agent() -> None:
    from src.memory.checkpoint import close_checkpointer

    await close_checkpointer()
