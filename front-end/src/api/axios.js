import axios from 'axios';

const api = axios.create({
    baseURL: '/', // Points to the same origin (Vite proxy handles /api)
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': 'the-blog-web',
    },
});

// Inject Bearer token from localStorage for every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Global error handling (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Logic for logout or token refresh could go here
            localStorage.removeItem('token');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
