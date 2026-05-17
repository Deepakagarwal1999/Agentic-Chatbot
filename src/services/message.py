import uuid
from typing import AsyncGenerator

import structlog

from src.core.config import get_settings
from src.core.exceptions import NotFoundError
from src.repositories.conversation import ConversationRepository
from src.repositories.message import MessageRepository

logger = structlog.get_logger(__name__)
settings = get_settings()


async def list_messages(
    message_repo: MessageRepository,
    conversation_id: uuid.UUID,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list, int]:
    messages, total = await message_repo.list_by_conversation(
        conversation_id=conversation_id, offset=offset, limit=limit
    )
    return messages, total


async def send_message_stream(
    message_repo: MessageRepository,
    conversation_repo: ConversationRepository,
    user_id: uuid.UUID,
    conversation_id: uuid.UUID,
    content: str,
    orchestrator,  # Agent orchestrator
    memory_retriever,  # Memory retriever
) -> AsyncGenerator[str, None]:
    conversation = await conversation_repo.get_by_user_and_id(user_id, conversation_id)
    if not conversation:
        raise NotFoundError("Conversation", str(conversation_id))

    user_message = await message_repo.create(
        conversation_id=conversation_id,
        user_id=user_id,
        role="user",
        content=content,
    )

    thread_id = str(conversation_id)

    long_term_context = await memory_retriever.retrieve_context(
        user_id=str(user_id),
        conversation_id=str(conversation_id),
        query=content,
    )

    # Use a list to collect chunks for improved performance when concatenating strings
    response_parts = []
    async for token in orchestrator.stream(
        user_input=content,
        thread_id=thread_id,
        long_term_context=long_term_context,
    ):
        response_parts.append(token)
        yield token

    # Build the full response only once at the end to avoid O(N^2) string concatenation
    full_response = "".join(response_parts)

    assistant_message = await message_repo.create(
        conversation_id=conversation_id,
        user_id=user_id,
        role="assistant",
        content=full_response,
    )

    title = await _update_message_count_and_title(
        conversation_repo, conversation, content, full_response
    )
    if title:
        yield f"__TITLE__:{title}"

    # Index both messages (user and assistant) via a helper, batching commit if possible
    from src.memory.long_term import index_message

    await index_message(
        message_repo=message_repo,
        user_id=user_id,
        conversation_id=conversation_id,
        message=user_message,
    )
    await index_message(
        message_repo=message_repo,
        user_id=user_id,
        conversation_id=conversation_id,
        message=assistant_message,
    )

    await _maybe_trigger_summary(message_repo, conversation, conversation_id)

    logger.info(
        "message_processed",
        conversation_id=str(conversation_id),
        user_id=str(user_id),
        response_length=len(full_response),
    )


async def search_memory(
    message_repo: MessageRepository,
    user_id: uuid.UUID,
    query: str,
    top_k: int = 5,
    embed_fn=None,
) -> list[dict]:
    if embed_fn is None:
        return []

    embedding = await embed_fn(query)
    results = await message_repo.search_similar_messages(
        user_id=user_id,
        embedding=embedding,
        top_k=top_k,
    )
    return results


async def _update_message_count_and_title(
    conversation_repo, conversation, user_message: str, assistant_response: str
) -> str | None:
    """Update message count and generate title for new conversations. Returns title if generated."""
    new_count = (conversation.message_count or 0) + 2
    updates = {"message_count": new_count}
    title = None

    if conversation.title == "New Conversation" or conversation.message_count == 0:
        title = await _generate_title(user_message, assistant_response)
        updates["title"] = title

    await conversation_repo.update(conversation, **updates)
    return title


async def _generate_title(user_message: str, assistant_response: str) -> str:
    """Generate a short conversation title (max 3 words) based on the conversation."""
    try:
        from src.core.di import _build_llm

        llm = _build_llm()
        response = await llm.ainvoke(
            [
                {
                    "role": "system",
                    "content": (
                        "Generate a concise title (maximum 3 words) that captures the topic "
                        "of the following conversation. Reply with ONLY the title, "
                        "no quotes, no punctuation, no explanation."
                    ),
                },
                {"role": "user", "content": user_message[:500]},
                {"role": "assistant", "content": assistant_response[:500]},
                {
                    "role": "user",
                    "content": "Based on this conversation, generate a title in 3 words or less.",
                },
            ]
        )
        title = response.content.strip().strip('"').strip("'")
        # Enforce 3-word limit
        words = title.split()
        if len(words) > 3:
            title = " ".join(words[:3])
        return title
    except Exception as exc:
        logger.warning("title_generation_failed", error=str(exc))
        # Fallback: first few words of the user message
        words = user_message.split()[:3]
        return " ".join(words)


async def _maybe_trigger_summary(message_repo, conversation, conversation_id):
    if conversation.message_count >= settings.summary_trigger_message_count:
        recent = await message_repo.get_recent_by_conversation(
            conversation_id=conversation_id,
            limit=settings.summary_trigger_message_count,
        )
        if recent:
            logger.info("summary_triggered", conversation_id=str(conversation_id))
