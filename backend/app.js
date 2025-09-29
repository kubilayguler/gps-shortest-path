const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN ,
  credentials: true
}));

// Routes
app.use('/api', require('./routes/Routing.route'));


// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`API: http://localhost:${PORT}/api/routing`);
});

module.exports = app;