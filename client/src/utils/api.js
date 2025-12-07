import axios from 'axios';

const getBaseUrl = () => {
    const url = import.meta.env.VITE_API_URL;
    if (url) {
        // Ensure URL doesn't end with slash before appending /api
        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        // Append /api if not already present
        return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
    }
    return '/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
