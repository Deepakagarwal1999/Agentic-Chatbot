from src.memory.retriever import create_retriever


class MockMessageRepo:
    async def get_recent_by_conversation(self, conversation_id, limit=20):
        return []

    async def get_latest_summary(self, conversation_id):
        return None

    async def search_similar_messages(self, user_id, embedding, top_k=5):
        return []


def test_retriever_creation():
    repo = MockMessageRepo()
    retriever = create_retriever(repo)
    assert retriever is not None


async def test_retriever_empty_context():
    repo = MockMessageRepo()
    retriever = create_retriever(repo)
    ctx = await retriever.retrieve_context(
        user_id="00000000-0000-0000-0000-000000000001",
        conversation_id="00000000-0000-0000-0000-000000000002",
        query="test",
    )
    assert ctx == ""