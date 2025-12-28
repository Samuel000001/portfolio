require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for debugging
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Body:', req.body);
    next();
});

// Database Connection
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB Connected Successfully to:', mongoose.connection.name))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        console.error('Connection String (hidden creds):', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@') : 'undefined');
    });

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('Portfolio API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
