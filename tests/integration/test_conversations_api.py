import pytest


@pytest.mark.anyio
class TestHealthEndpoint:
    async def test_health_check(self, client):
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.anyio
class TestAuthEndpoints:
    async def test_register_missing_fields(self, client):
        response = await client.post("/api/auth/register", json={})
        assert response.status_code == 422

    async def test_login_missing_fields(self, client):
        response = await client.post("/api/auth/login", json={})
        assert response.status_code == 422

    async def test_protected_route_without_auth(self, client):
        response = await client.get("/api/conversations")
        assert response.status_code == 401


@pytest.mark.anyio
class TestConversationEndpoints:
    async def test_create_conversation_requires_auth(self, client):
        response = await client.post(
            "/api/conversations",
            json={"title": "Test"},
        )
        assert response.status_code == 401

    async def test_list_conversations_requires_auth(self, client):
        response = await client.get("/api/conversations")
        assert response.status_code == 401


@pytest.mark.anyio
class TestMessageEndpoints:
    async def test_send_message_requires_auth(self, client):
        response = await client.post(
            "/api/conversations/00000000-0000-0000-0000-000000000001/messages",
            json={"content": "Hello"},
        )
        assert response.status_code == 401