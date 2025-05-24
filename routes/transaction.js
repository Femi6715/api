const mongoose = require('mongoose');
const config = require('../config/database');
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const passport = require('passport');

const TransactionSchema = mongoose.Schema({

    transaction_type: {
        type: String,
        required: true,
    },
    amount_involved: {
        type: Number,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    acct_balance: {
        type: Number,
        required: true
    },
    time_stamp: {
        type: Date,
        required: true
    },
    trans_date: {
        type: String,
        required: true
    }
});

const Transactions = module.exports = mongoose.model('Transactions', TransactionSchema);

module.exports.addNewTransaction = function(newTransaction, callback) {
    newTransaction.save(callback);
}

module.exports.getTransactionByUserId = function(user_id, callback){
    const query = {user_id: user_id}
    Transactions.find(query, callback);
}

module.exports.checkUserTransaction = function(user_id, callback){
    const query = {user_id: user_id}
    Transactions.findOne(query, callback);
}

module.exports.checkTransaction = function(time_stamp, callback){
    const query = {time_stamp: time_stamp}
    Transactions.find(query, callback);
}

module.exports.totalTransactions = function(transaction_type, callback) {
    const query = {transaction_type: transaction_type}
    Transactions.find(query, callback);
}

module.exports.transactionFetcher = function(transaction_type, trans_date, callback) {
    const query = {
        transaction_type: transaction_type,
        trans_date: trans_date
    }
    Transactions.find(query, callback);
}

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get user's transactions
router.get('/history', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        connection.release();
        res.json({ success: true, transactions: rows });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching transactions' });
    }
});

// Get transaction by ID
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        connection.release();

        if (rows.length === 0) {
            return res.json({ success: false, msg: 'Transaction not found' });
        }

        res.json({ success: true, transaction: rows[0] });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching transaction' });
    }
});

// Create new transaction
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const { type, amount, description } = req.body;

        // Start transaction
        await connection.beginTransaction();

        try {
            // Create transaction record
            const [result] = await connection.query(
                'INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
                [req.user.id, type, amount, description]
            );

            // Update user balance
            if (type === 'deposit') {
                await connection.query(
                    'UPDATE users SET main_balance = main_balance + ? WHERE id = ?',
                    [amount, req.user.id]
                );
            } else if (type === 'withdrawal') {
                // Check if user has sufficient balance
                const [users] = await connection.query(
                    'SELECT main_balance FROM users WHERE id = ?',
                    [req.user.id]
                );

                if (users[0].main_balance < amount) {
                    throw new Error('Insufficient balance');
                }

                await connection.query(
                    'UPDATE users SET main_balance = main_balance - ? WHERE id = ?',
                    [amount, req.user.id]
                );
            }

            // Commit transaction
            await connection.commit();
            connection.release();

            res.json({
                success: true,
                msg: 'Transaction completed successfully',
                transactionId: result.insertId
            });
        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            msg: error.message === 'Insufficient balance'
                ? 'Insufficient balance for withdrawal'
                : 'Error creating transaction'
        });
    }
});

// Create new transaction
router.post('/newTransaction', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { 
      user_id, amount_involved, transaction_type, 
      acct_balance, time_stamp, trans_date 
    } = req.body;
    
    const connection = await pool.getConnection();
    
    // Insert new transaction
    const [result] = await connection.query(
      `INSERT INTO transactions 
      (user_id, amount_involved, transaction_type, acct_balance, time_stamp, trans_date) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, amount_involved, transaction_type, acct_balance, time_stamp, trans_date]
    );
    
    connection.release();
    
    res.json({
      success: true,
      msg: 'Transaction recorded successfully',
      transactionId: result.insertId
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, msg: 'Failed to record transaction' });
  }
});

// Get transaction summary
router.get('/summary', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                type,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM transactions 
            WHERE user_id = ? 
            GROUP BY type`,
            [req.user.id]
        );
        connection.release();

        const summary = {
            deposits: { count: 0, total: 0 },
            withdrawals: { count: 0, total: 0 }
        };

        rows.forEach(row => {
            if (row.type === 'deposit') {
                summary.deposits.count = row.count;
                summary.deposits.total = row.total_amount;
            } else if (row.type === 'withdrawal') {
                summary.withdrawals.count = row.count;
                summary.withdrawals.total = row.total_amount;
            }
        });

        res.json({ success: true, summary });
    } catch (error) {
        console.error('Get transaction summary error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching transaction summary' });
    }
});

// Get all transactions for a user
router.post('/allTransactions', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    console.log('Getting transactions for user_id:', user_id);
    
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
    console.error('Get all transactions error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching transactions' });
  }
});

module.exports = router;

