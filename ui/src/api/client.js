const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function getToken() {
    return localStorage.getItem('token');
}

export async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const contentType = response.headers.get('Content-Type');
    let data;
    if (response.status === 204) {
        data = null;
    } else if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = null;
    }

    if (!response.ok) {
        // If we get a 401, the token is invalid/expired — clear it and redirect to login
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        const error = new Error(data?.detail || 'An error occurred');
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}
