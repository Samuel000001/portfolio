import axios from 'axios';

const api = axios.create({
    // Hardcoded for debugging to ensure connection
    baseURL: 'https://portfolio-ujx8.onrender.com/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
