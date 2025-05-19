const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection configuration
const dbConfig = {
  host: '27gi4.h.filess.io',
  port: 3307,
  user: 'Padilotto_wordrushof',
  password: 'd030caf65b4e0827f462ebbca5a2aaeff45bf969',
  database: 'Padilotto_wordrushof'
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Check transaction status endpoint
app.post('/transactions/checkTransaction', async (req, res) => {
  try {
    const { id } = req.body;
    
    // Check if user exists and has no pending transactions
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as pending_count FROM transactions WHERE user_id = ? AND status = "pending"',
      [id]
    );
    
    const hasPendingTransactions = rows[0].pending_count > 0;
    
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

// Record new transaction endpoint
app.post('/api/direct/transaction', async (req, res) => {
  try {
    const {
      user_id,
      transaction_type,
      amount_involved,
      acct_balance,
      time_stamp,
      trans_date
    } = req.body;

    // Validate required fields
    if (!user_id || !transaction_type || !amount_involved || !acct_balance || !time_stamp || !trans_date) {
      return res.status(400).json({
        success: false,
        msg: 'Missing required fields'
      });
    }

    // Validate transaction type
    const validTypes = ['deposit', 'withdrawal', 'winning', 'ticket_purchase'];
    if (!validTypes.includes(transaction_type)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid transaction type'
      });
    }

    // Insert transaction
    const [result] = await pool.execute(
      `INSERT INTO transactions 
       (user_id, transaction_type, amount_involved, acct_balance, time_stamp, trans_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'completed')`,
      [user_id, transaction_type, amount_involved, acct_balance, time_stamp, trans_date]
    );

    // Update user's balance
    await pool.execute(
      'UPDATE users SET main_balance = ? WHERE id = ?',
      [acct_balance, user_id]
    );

    res.json({
      success: true,
      msg: 'Transaction recorded successfully',
      transaction_id: result.insertId
    });
  } catch (error) {
    console.error('Error recording transaction:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to record transaction'
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.post('/games/newticket', async (req, res) => {
  try {
    const {
      user_id,
      game_id,
      draw_date,
      stake_amt,
      potential_winning,
      mobile_no,
      ticket_id,
      time_stamp,
      draw_time,
      ticket_status
    } = req.body;

    console.log('Received ticket creation request:', JSON.stringify(req.body, null, 2)); // More detailed request logging

    // Validate required fields
    if (!user_id || !game_id || !draw_date || !stake_amt || !potential_winning || !mobile_no || !ticket_id) {
      console.log('Missing required fields:', { user_id, game_id, draw_date, stake_amt, potential_winning, mobile_no, ticket_id });
      return res.status(400).json({
        success: false,
        msg: 'Missing required fields'
      });
    }

    // Get user's current balance
    console.log('Checking user balance for user_id:', user_id);
    const [userRows] = await pool.execute(
      'SELECT main_balance FROM users WHERE id = ?',
      [user_id]
    );

    if (userRows.length === 0) {
      console.log('User not found:', user_id);
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    const currentBalance = parseFloat(userRows[0].main_balance);
    const stakeAmount = parseFloat(stake_amt);
    console.log('Current balance:', currentBalance, 'Stake amount:', stakeAmount);

    // Check if user has sufficient balance
    if (currentBalance < stakeAmount) {
      console.log('Insufficient balance:', { currentBalance, stakeAmount });
      return res.status(400).json({
        success: false,
        msg: 'Insufficient balance'
      });
    }

    // Create ticket
    console.log('Creating ticket with data:', {
      ticket_id,
      user_id,
      game_id,
      mobile_no,
      stake_amt,
      potential_winning,
      time_stamp: time_stamp || Date.now(),
      draw_time: draw_time || '11:45 PM',
      draw_date,
      ticket_status: ticket_status || 'pending'
    });

    const [ticketResult] = await pool.execute(
      `INSERT INTO tickets 
       (ticket_id, user_id, game_id, mobile_no, stake_amt, potential_winning, time_stamp, draw_time, draw_date, ticket_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket_id,
        user_id,
        game_id,
        mobile_no,
        stake_amt,
        potential_winning,
        time_stamp || Date.now(),
        draw_time || '11:45 PM',
        draw_date,
        ticket_status || 'pending'
      ]
    );

    // Update user's balance
    const newBalance = currentBalance - stakeAmount;
    console.log('Updating user balance:', { user_id, newBalance });
    await pool.execute(
      'UPDATE users SET main_balance = ? WHERE id = ?',
      [newBalance, user_id]
    );

    // Record transaction
    console.log('Recording transaction:', {
      user_id,
      stake_amt,
      newBalance,
      time_stamp: time_stamp || Date.now()
    });
    await pool.execute(
      `INSERT INTO transactions 
       (user_id, transaction_type, amount_involved, acct_balance, time_stamp, trans_date, status) 
       VALUES (?, 'ticket_purchase', ?, ?, ?, CURDATE(), 'completed')`,
      [user_id, stake_amt, newBalance, time_stamp || Date.now()]
    );

    res.json({
      success: true,
      msg: 'Ticket created successfully',
      ticket_id: ticketResult.insertId,
      new_balance: newBalance
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      msg: 'Failed to create ticket',
      error: error.message
    });
  }
}); 