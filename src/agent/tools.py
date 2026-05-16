# ┌──────────────────────────────────────────────────────────────┐
# │  src/agent/tools.py                                           │
# │  Custom tools merged with deepagents built-in tool suite.     │
# └──────────────────────────────────────────────────────────────┘

from datetime import datetime
from langchain_core.tools import tool
from langchain_community.tools import DuckDuckGoSearchRun

# ---------------------------------------------------------------------------
# 1. Existing simple tools (kept for backward-compatibility / custom wiring)
# ---------------------------------------------------------------------------

@tool
def get_current_datetime() -> str:
    """Returns the current date and time in ISO format."""
    return datetime.now().isoformat()


# ---------------------------------------------------------------------------
# 2. DeepAgents built-in tool suite (auto-injected by create_deep_agent)
#
#    When `build_agent_graph` calls `create_deep_agent(...)` the deepagents
#    library automatically adds:
#
#    • ls          – list directory contents
#    • read_file   – read a text / binary file
#    • write_file  – create or overwrite a file
#    • edit_file   – replace a substring inside a file
#    • glob        – match file paths with patterns (e.g. *.py)
#    • grep        – search contents of files with a regex
#    • execute     – run shell commands (disabled in production by default)
#    • task        – delegate work to a sub-agent so the main context window
#                    does not bloat.  Sub-agents run in their own isolated
#                    session and return a concise answer/summary.
#    • write_todos – manage a todo list
#
#    You do NOT need to define them here.  They are listed so you know what
#    is available inside the prompt / orchestrator.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# 3. Additional custom tools (merged with the built-in suite above)
# ---------------------------------------------------------------------------

_search_tool = DuckDuckGoSearchRun()

@tool
def web_search(query: str) -> str:
    """Search the web for current information.

    Use this when the user asks about real-time data, current events,
    or anything that requires up-to-date knowledge not present in the
    model's training data.
    """
    try:
        return _search_tool.run(query)
    except Exception as exc:
        return f"Search error: {exc}"


# ---------------------------------------------------------------------------
# 4. Public exports
# ---------------------------------------------------------------------------

# Tools that are *explicitly* passed to create_deep_agent(...) via the
# `tools=` parameter.  They are merged with the deepagents built-in suite.
CUSTOM_TOOLS = [
    get_current_datetime,
    web_search,
]

# Backward-compat alias (used by legacy code that imports AGENT_TOOLS)
AGENT_TOOLS = CUSTOM_TOOLS
