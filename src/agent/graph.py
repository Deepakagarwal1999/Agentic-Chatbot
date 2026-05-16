from datetime import datetime
from langgraph.graph.state import CompiledStateGraph
from langchain_core.language_models import BaseChatModel
from langgraph.checkpoint.base import BaseCheckpointSaver
from deepagents import create_deep_agent
from deepagents.middleware.filesystem import FilesystemPermission

from src.agent.prompts import SYSTEM_PROMPT
from src.agent.tools import CUSTOM_TOOLS


def build_agent_graph(
    llm: BaseChatModel,
    checkpointer: BaseCheckpointSaver | None = None,
    store=None,
    skills: list[str] | None = None,
    memory_files: list[str] | None = None,
    permissions: list[FilesystemPermission] | None = None,
) -> CompiledStateGraph:
    """Build the deep agent graph with filesystem + task + search + custom tools.

    This uses deepagents.create_deep_agent, which provides a superset of
    create_react_agent features, including:
    - Filesystem tools (ls, read_file, write_file, edit_file, glob, grep)
    - Execute tool for shell commands
    - Task tool for delegating to sub-agents
    - Todo list tool for managing tasks

    Args:
        llm: The language model to use for the agent.
        checkpointer: Optional checkpointer for persisting agent state.
        store: Optional store for cross-session memory (required for StoreBackend).
        skills: Optional list of skill source paths (e.g., ["/skills/project/"]).
        memory_files: Optional list of memory file paths (e.g., ["/memory/AGENTS.md"]).
        permissions: Optional list of FilesystemPermission rules for file access control.

    Returns:
        A compiled LangGraph state machine (deep agent).
    """
    system_prompt = SYSTEM_PROMPT.format(current_date=datetime.now().strftime("%Y-%m-%d"))

    agent = create_deep_agent(
        model=llm,
        tools=CUSTOM_TOOLS,
        system_prompt=system_prompt,
        checkpointer=checkpointer,
        store=store,
        skills=skills,
        memory=memory_files,
        permissions=permissions,
    )
    return agent
