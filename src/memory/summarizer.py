import uuid

import structlog
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage

logger = structlog.get_logger(__name__)

SUMMARY_SYSTEM_PROMPT = """
Summarize the following conversation segment concisely. Include:
- Key topics discussed
- Important decisions or conclusions
- Any action items

Format as a single compact paragraph (max 300 words).
"""


async def generate_summary(
    message_repo,
    conversation_id: uuid.UUID,
    message_count: int,
    llm: BaseChatModel,
) -> str | None:
    try:
        recent_messages, _ = await message_repo.list_by_conversation(
            conversation_id=conversation_id,
            offset=max(0, message_count - 20),
            limit=20,
        )

        if not recent_messages:
            return None

        conversation_text = "\n".join(
            f"[{msg.role}]: {msg.content[:300]}" for msg in recent_messages
        )

        response = await llm.ainvoke(
            [
                SystemMessage(content=SUMMARY_SYSTEM_PROMPT),
                HumanMessage(content=f"Conversation:\n{conversation_text}"),
            ]
        )

        summary_text = str(response.content)
        await message_repo.upsert_summary(
            conversation_id=conversation_id,
            summary_text=summary_text,
            range_start=max(0, message_count - 20),
            range_end=message_count - 1,
        )

        logger.info("summary_generated", conversation_id=str(conversation_id))
        return summary_text

    except Exception as exc:
        logger.error("summary_generation_failed", error=str(exc))
        return None
