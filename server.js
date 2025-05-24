const express = require('express');
const cors = require('cors');
const passport = require('passport');
const config = require('./config/database');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');

// Create MySQL connection pool with error handling
const pool = mysql.createPool(config.database);

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  });

// Import routes using the existing files
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const gameRoutes = require('./routes/game');
const transactionRoutes = require('./routes/transaction');
const ticketRoutes = require('./routes/ticket');
const winningTicketRoutes = require('./routes/winning-ticket');
const transferRecipientRoutes = require('./routes/transfer-recipient');
const gameCategoryRoutes = require('./routes/game-category');
const simpleRoutes = require('./simple-routes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',  // Allow all origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Enable preflight for all OPTIONS requests
app.options('*', cors());

app.use(express.urlencoded({ extended: true }));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: config.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport config
require('./config/passport')(passport);

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Root endpoint to verify server is running
app.get('/', (req, res) => {
  res.send('Welcome to Padi Lotto api');
});

// THIS IS CRITICAL - define the direct transaction route BEFORE any other routes
app.post('/api/direct/transaction', async (req, res) => {
  try {
    console.log('Direct transaction route called with:', req.body);
    
    const { user_id, amount_involved, transaction_type, acct_balance, time_stamp, trans_date } = req.body;
    
    if (!user_id || !transaction_type || acct_balance === undefined) {
      return res.status(400).json({
        success: false,
        msg: 'Missing required fields for transaction'
      });
    }
    
    // Validate transaction_type to ensure it's one of the allowed values
    const validTransactionTypes = ['deposit', 'withdrawal', 'winning', 'ticket_purchase'];
    if (!validTransactionTypes.includes(transaction_type)) {
      console.error(`Invalid transaction_type: ${transaction_type}. Must be one of: ${validTransactionTypes.join(', ')}`);
      return res.status(400).json({
        success: false,
        msg: `Invalid transaction type. Must be one of: ${validTransactionTypes.join(', ')}`
      });
    }
    
    const connection = await pool.getConnection();
    
    // Create the query and parameters - use only the essential fields and rely on database defaults
    const query = 'INSERT INTO transactions (user_id, transaction_type, amount_involved, acct_balance, time_stamp, trans_date) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [
      user_id,
      transaction_type,
      amount_involved,
      acct_balance,
      time_stamp || Date.now(),
      trans_date
    ];
    
    // Log the actual query and parameters for debugging
    console.log('Executing query:', query);
    console.log('With parameters:', params);
    
    // Insert transaction
    const [result] = await connection.query(query, params);
    
    connection.release();
    
    console.log('Transaction recorded successfully:', {
      id: result.insertId,
      user_id,
      transaction_type,
      amount_involved
    });
    
    res.json({
      success: true,
      msg: 'Transaction recorded successfully',
      transaction_id: result.insertId
    });
  } catch (error) {
    console.error('Direct transaction error:', error);
    res.status(500).json({ success: false, msg: 'Error recording transaction', error: error.message });
  }
});

// Direct endpoint to get transactions for a user (no auth required)
app.post('/api/direct/transactions', async (req, res) => {
  try {
    const { user_id } = req.body;
    console.log('Direct get transactions route called for user_id:', user_id);
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        msg: 'User ID is required' 
      });
    }
    
    const connection = await pool.getConnection();
    
    // Get transactions for the specified user
    const [rows] = await connection.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY time_stamp DESC',
      [user_id]
    );
    
    connection.release();
    
    console.log(`Found ${rows.length} transactions for user ${user_id}`);
    
    res.json({ 
      success: true, 
      transactions: rows
    });
  } catch (error) {
    console.error('Direct get transactions error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching transactions' });
  }
});

// Direct endpoint to get tickets for a user (no auth required)
app.post('/api/direct/tickets', async (req, res) => {
  try {
    const { user_id } = req.body;
    console.log('Direct get tickets route called for user_id:', user_id);
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        msg: 'User ID is required' 
      });
    }
    
    const connection = await pool.getConnection();
    
    // Get tickets for the specified user with all relevant fields
    const [rows] = await connection.query(
      `SELECT 
        id, ticket_id, user_id, game_id, mobile_no, 
        stake_amt, potential_winning, time_stamp,
        draw_time, draw_date, ticket_status,
        created_at, updated_at
      FROM tickets 
      WHERE user_id = ? 
      ORDER BY created_at DESC`,
      [user_id]
    );
    
    connection.release();
    
    console.log(`Found ${rows.length} tickets for user ${user_id}`);
    
    res.json({ 
      success: true, 
      tickets: rows
    });
  } catch (error) {
    console.error('Direct get tickets error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching tickets' });
  }
});

// Direct endpoint to get all winning tickets (no auth required)
app.get('/api/simple/winning-tickets', async (req, res) => {
  try {
    console.log('Fetching all tickets (regardless of status)');
    
    const connection = await pool.getConnection();
    
    // Get all tickets with user details
    const [rows] = await connection.query(`
      SELECT 
        t.*,
        u.username,
        u.firstname,
        u.surname
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    
    connection.release();
    
    console.log(`Found ${rows.length} tickets`);
    
    res.json({ 
      success: true, 
      tickets: rows
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching tickets' });
  }
});

// Use the simple routes first (no auth required)
app.use('/api/simple', simpleRoutes);

// Direct route for getting user profile (no auth required)
app.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Direct get user profile route called for ID:', userId);
    
    const connection = await pool.getConnection();
    
    // Get user data
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }
    
    // Remove sensitive data
    const user = rows[0];
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching user profile' });
  }
});

// Check transaction status endpoint
app.post('/transactions/checkTransaction', async (req, res) => {
  try {
    const { id } = req.body;
    console.log('Checking transaction status for user:', id);
    
    const connection = await pool.getConnection();
    
    // Check if user exists and has no pending transactions
    const [rows] = await connection.query(
      'SELECT COUNT(*) as pending_count FROM transactions WHERE user_id = ? AND status = "pending"',
      [id]
    );
    
    connection.release();
    
    const hasPendingTransactions = rows[0].pending_count > 0;
    console.log('Transaction status check result:', { hasPendingTransactions });
    
    res.json({
      success: !hasPendingTransactions
    });
  } catch (error) {
    console.error('Error checking transaction status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Routes
app.use('/admin', adminRoutes);
app.use('/users', userRoutes);
app.use('/games', gameRoutes);
app.use('/transactions', transactionRoutes);
app.use('/tickets', ticketRoutes);
app.use('/winning-tickets', winningTicketRoutes);
app.use('/transfer-recipients', transferRecipientRoutes);
app.use('/game-categories', gameCategoryRoutes);

// Public endpoint to get all tickets
app.get('/api/tickets/all', async (req, res) => {
  try {
    console.log('Fetching all tickets');
    
    const connection = await pool.getConnection();
    
    // Get all tickets with user details
    const [rows] = await connection.query(`
      SELECT 
        t.*,
        u.username,
        u.firstname,
        u.surname
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    
    connection.release();
    
    console.log(`Found ${rows.length} tickets`);
    
    res.json({ 
      success: true, 
      tickets: rows
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching tickets' });
  }
});

// Fallback router for unmatched routes
app.all('*', (req, res) => {
  res.status(404).json({ success: false, msg: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, msg: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Registered endpoints:');
    console.log('- GET / (API root)');
    console.log('- POST /api/direct/transaction');
    console.log('- POST /api/direct/transactions');
    console.log('- POST /api/direct/tickets');
    console.log('- GET /users/:id');
    console.log('... and others through route modules');
});

// Handle common shutdown scenarios to close database connections gracefully
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        pool.end()
            .then(() => {
                console.log('Database connections closed');
                process.exit(0);
            })
            .catch(err => {
                console.error('Error closing database connections:', err);
                process.exit(1);
            });
    });
});