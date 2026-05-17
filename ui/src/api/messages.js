const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function listMessages(conversationId, { offset = 0, limit = 50 } = {}) {
    return fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages?offset=${offset}&limit=${limit}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    }).then(r => {
        if (!r.ok) throw new Error('Failed to fetch messages');
        return r.json();
    });
}

export async function* streamMessage(conversationId, content) {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to send message');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event: ')) {
                currentEvent = trimmed.slice(7).trim();
                continue;
            }

            if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6);
                if (data === '[DONE]') return;

                if (currentEvent === 'title') {
                    yield { type: 'title', data };
                    currentEvent = null;
                } else if (currentEvent === 'error') {
                    currentEvent = null;
                } else {
                    yield { type: 'token', data };
                }
                currentEvent = null;
            }
        }
    }

    if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;
            yield { type: 'token', data };
        }
    }
}
