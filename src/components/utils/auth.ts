export function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };

    const token = localStorage.getItem('authKey');
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const csrf = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

    if (csrf) {
        headers['X-CSRF-Token'] = csrf;
    }

    return headers;
}