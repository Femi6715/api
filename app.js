const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const config = require('./config/database');
const cron = require('node-cron');
const moment = require('moment');
const helmet = require('helmet');
const mysql = require('mysql2');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to MySQL database');
  connection.release();
});

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(helmet());

// Enable pre-flight requests
app.options('*', cors());

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Routes
const users = require('./routes/user');
const games = require('./routes/game');
const category = require('./routes/game-category');
const transactions = require('./routes/transaction');
const winners = require('./routes/winning-ticket');
const admin = require('./routes/admin');
const transfer = require('./routes/transfer-recipient');
const tickets = require('./routes/ticket');

// Use routes
app.use('/users', users);
app.use('/games', games);
app.use('/categories', category);
app.use('/transactions', transactions);
app.use('/winners', winners);
app.use('/admin', admin);
app.use('/tickets', tickets);
app.use('/transfer', transfer);

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to Padi Lotto api');
});

// Start server
const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
