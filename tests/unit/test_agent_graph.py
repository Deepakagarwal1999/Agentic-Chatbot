from src.agent.state import AgentState
from src.agent.prompts import SYSTEM_PROMPT, CONTEXT_TEMPLATE


def test_agent_state_structure():
    state: AgentState = {
        "messages": [],
        "long_term_context": "test context",
    }
    assert "messages" in state
    assert "long_term_context" in state


def test_system_prompt_contains_placeholders():
    filled = SYSTEM_PROMPT.format(current_date="2026-05-09")
    assert "2026-05-09" in filled
    assert "AI assistant" in filled


def test_context_template_formatting():
    result = CONTEXT_TEMPLATE.format(context="User discussed weather")
    assert "User discussed weather" in result
    assert "LONG-TERM MEMORY CONTEXT" in result