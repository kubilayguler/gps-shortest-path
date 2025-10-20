const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN ,
  credentials: true
}));

// Routes
app.use('/api', require('./routes/routing.route.js'));
app.use('/api/multi-stop-routing', require('./routes/multiStopRouting.route'));
app.use('/api/users', require('./routes/user.route'));
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/companies', require('./routes/company.route'));
app.use('/api/warehouses', require('./routes/warehouse.route'));
app.use('/api/orders', require('./routes/order.route'));


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
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;