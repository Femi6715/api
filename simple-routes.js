const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('./config/database');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Simple account update without any authentication or validation
router.post('/update-account', async (req, res) => {
  try {
    console.log('Simple account update called with:', req.body);
    
    const { user_id, main_balance, bonus } = req.body;
    
    if (!user_id || main_balance === undefined || bonus === undefined) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Missing required fields: user_id, main_balance, bonus' 
      });
    }
    
    const connection = await pool.getConnection();
    
    // Update user balance directly without any checks
    await connection.query(
      'UPDATE users SET main_balance = ?, bonus = ? WHERE id = ?',
      [main_balance, bonus, user_id]
    );
    
    // Get updated user data
    const [updatedRows] = await connection.query(
      'SELECT id, main_balance, bonus FROM users WHERE id = ?',
      [user_id]
    );
    
    connection.release();
    
    if (updatedRows.length === 0) {
      return res.status(404).json({ success: false, msg: 'User not found after update' });
    }
    
    console.log('Account updated successfully. New balance:', {
      main_balance: updatedRows[0].main_balance,
      bonus: updatedRows[0].bonus
    });
    
    res.json({
      success: true,
      msg: 'Account balance updated successfully',
      user: {
        id: updatedRows[0].id,
        main_balance: updatedRows[0].main_balance,
        bonus: updatedRows[0].bonus
      }
    });
  } catch (error) {
    console.error('Simple account update error:', error);
    res.status(500).json({ success: false, msg: 'Error updating account balance' });
  }
});

// Get user profile without authentication
router.get('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Simple get user profile called for ID:', userId);
    
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
    console.error('Simple get user profile error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching user profile' });
  }
});

// Simple transaction endpoint without any authentication
router.post('/transaction', async (req, res) => {
  try {
    console.log('Simple transaction called with:', req.body);
    
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
    
    // Insert transaction with simplified query using database defaults
    const [result] = await connection.query(
      'INSERT INTO transactions (user_id, transaction_type, amount_involved, acct_balance, time_stamp, trans_date) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, transaction_type, amount_involved, acct_balance, time_stamp || Date.now(), trans_date]
    );
    
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
    console.error('Simple transaction error:', error);
    res.status(500).json({ success: false, msg: 'Error recording transaction', error: error.message });
  }
});

// Get user tickets without authentication
router.post('/tickets', async (req, res) => {
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
    
    // Get tickets for the specified user from tickets table
    const [rows] = await connection.query(
      'SELECT * FROM tickets WHERE user_id = ? ORDER BY time_stamp DESC',
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

// Get all winning tickets without authentication
router.get('/winning-tickets', async (req, res) => {
  try {
    console.log('Fetching all winning tickets');
    
    const connection = await pool.getConnection();
    
    // Get all winning tickets with user details
    const [rows] = await connection.query(`
      SELECT 
        t.*,
        u.username,
        u.firstname,
        u.surname
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.ticket_status = 'won'
      ORDER BY t.created_at DESC
    `);
    
    connection.release();
    
    console.log(`Found ${rows.length} winning tickets`);
    
    res.json({ 
      success: true, 
      tickets: rows
    });
  } catch (error) {
    console.error('Get winning tickets error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching winning tickets' });
  }
});

module.exports = router; 