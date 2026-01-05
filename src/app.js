const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const auditLogger = require('./middleware/logger');

const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Audit Logging Middleware
app.use(auditLogger);


// Static Files
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
app.use('/public', express.static(publicPath));

// Serve Landing Page (Fallback if needed, though express.static handles index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Routes
app.use('/api', apiRoutes);


// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Public Config (Safe for Anon Key)
app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_KEY // Usually ANON key is safe for client
    });
});


module.exports = app;
