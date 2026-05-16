import { apiRequest } from './client';

export function listConversations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/conversations?${query}`);
}

export function createConversation(title) {
    return apiRequest('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ title }),
    });
}

export function getConversation(id) {
    return apiRequest(`/api/conversations/${id}`);
}

export function updateConversation(id, updates) {
    return apiRequest(`/api/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
}

export function deleteConversation(id) {
    return apiRequest(`/api/conversations/${id}`, {
        method: 'DELETE',
    });
}
