import uuid
from unittest.mock import AsyncMock

import pytest

from src.core.exceptions import ValidationError
from src.services.auth import hash_password, verify_password


class TestAuthService:
    async def test_hash_and_verify_password(self):
        password = "secure_password_123"
        hashed = await hash_password(password)
        assert hashed != password
        assert await verify_password(password, hashed)
        assert not await verify_password("wrong_password", hashed)

    async def test_different_passwords_different_hashes(self):
        h1 = await hash_password("pass1")
        h2 = await hash_password("pass2")
        assert h1 != h2

    async def test_password_too_long_raises_validation_error(self):
        # Create a password that exceeds 72 bytes in UTF-8
        long_password = "a" * 73
        with pytest.raises(ValidationError, match="72 bytes"):
            await hash_password(long_password)

    async def test_verify_password_too_long_raises_validation_error(self):
        with pytest.raises(ValidationError, match="72 bytes"):
            await verify_password("a" * 73, "dummy_hash")


class TestConversationService:
    async def test_create_and_get_conversation(self):
        from src.services.conversation import create_conversation, get_conversation

        user_id = uuid.uuid4()
        mock_repo = AsyncMock()
        mock_repo.create.return_value = AsyncMock(
            id=uuid.uuid4(), user_id=user_id, title="Test Chat", message_count=0
        )
        mock_repo.get_by_user_and_id.return_value = mock_repo.create.return_value

        conv = await create_conversation(mock_repo, user_id, "Test Chat")
        assert conv.title == "Test Chat"
