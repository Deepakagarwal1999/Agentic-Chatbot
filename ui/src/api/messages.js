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

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // SSE lines are separated by newlines
        // Format: data: <text>\n\n or event: error\ndata: ...
        const lines = buffer.split('\n');
        // Keep the last partial line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            // Handle event: error
            if (trimmed.startsWith('event: ')) {
                const eventType = trimmed.slice(7).trim();
                if (eventType === 'error') {
                    // Error data will be on the next data: line
                    continue; 
                }
            }
            
            // Handle data: ...
            if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6);
                if (data === '[DONE]') return;
                yield data;
            }
        }
    }

    // Process any final buffered data
    if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;
            yield data;
        }
    }
}
