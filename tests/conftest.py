import uuid
from pathlib import Path

import pytest
from httpx import AsyncClient, ASGITransport

from src.core.config import get_settings
from src.main import app

settings = get_settings()

TEST_DATABASE_URL = settings.database_url

TEST_USER_ID = uuid.uuid4()


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session")
def test_user_id():
    return TEST_USER_ID


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.fixture
def auth_headers():
    from src.services.auth import create_access_token
    token = create_access_token(str(TEST_USER_ID))
    return {"Authorization": f"Bearer {token}"}