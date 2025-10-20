
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<any> => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(url, defaultOptions);

    const data = await response.json();

    if (!response.ok) {
        const error: any = new Error(data.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
};

export const apiGet = (endpoint: string) => apiRequest(endpoint, { method: 'GET' });

export const apiPost = (endpoint: string, body?: any) =>
    apiRequest(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });

export const apiPut = (endpoint: string, body?: any) =>
    apiRequest(endpoint, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
    });

export const apiPatch = (endpoint: string, body?: any) =>
    apiRequest(endpoint, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
    });

export const apiDelete = (endpoint: string) =>
    apiRequest(endpoint, { method: 'DELETE' });
