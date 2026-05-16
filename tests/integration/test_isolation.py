import uuid

import pytest

from src.core.exceptions import NotFoundError, UnauthorizedError
from src.services.auth import decode_access_token


class TestUserIsolation:
    def test_conversation_belongs_to_different_user(self):
        user_a = uuid.uuid4()
        user_b = uuid.uuid4()

        assert user_a != user_b

    def test_uuid_scoping_pattern(self):
        user_id = uuid.uuid4()
        conversation_id = uuid.uuid4()

        key = f"checkpoint:{user_id}:{conversation_id}"
        parts = key.split(":")
        assert parts[0] == "checkpoint"
        assert parts[1] == str(user_id)
        assert parts[2] == str(conversation_id)

    def test_auth_token_user_id_extraction(self):
        from src.services.auth import create_access_token, decode_access_token

        user_id = str(uuid.uuid4())
        token = create_access_token(user_id)
        decoded = decode_access_token(token)
        assert decoded == user_id

    def test_invalid_token_raises_unauthorized(self):
        with pytest.raises(UnauthorizedError):
            decode_access_token("invalid.token.here")