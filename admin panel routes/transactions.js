const express = require('express');
const router = express.Router();
const passport = require('passport');
const mysql = require('mysql2/promise');
const config = require('../config/database');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get all transactions for a user
router.post('/allTransactions', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY time_stamp DESC',
            [req.body.id]
        );
        connection.release();
        res.json({ success: true, transactions: rows });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ success: false, msg: 'Could not fetch your transactions at this time.' });
    }
});

// Check if user has any transactions
router.post('/checkTransaction', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?',
            [req.body.id]
        );
        connection.release();
        
        if (rows[0].count === 0) {
            res.json({ success: false, msg: 'There has been no previous transaction on this acct' });
        } else {
            res.json({ success: true, msg: 'There has been a previous transaction on this acct' });
        }
    } catch (error) {
        console.error('Check transaction error:', error);
        res.status(500).json({ success: false, msg: 'Error checking transactions' });
    }
});

// Add new transaction
router.post('/newTransaction', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.query(
            'INSERT INTO transactions (transaction_type, amount_involved, user_id, acct_balance, time_stamp, trans_date) VALUES (?, ?, ?, ?, ?, ?)',
            [
                req.body.transaction_type,
                req.body.amount_involved,
                req.body.user_id,
                req.body.acct_balance,
                req.body.time_stamp,
                req.body.trans_date
            ]
        );
        connection.release();
        res.json({ success: true, msg: 'Transaction recorded successfully' });
    } catch (error) {
        console.error('New transaction error:', error);
        res.status(500).json({ success: false, msg: 'Failed to record transaction' });
    }
});

// Get total deposits
router.post('/allDeposits', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT SUM(amount_involved) as total FROM transactions WHERE transaction_type = ?',
            ['deposit']
        );
        connection.release();
        res.json(rows[0].total || 0);
    } catch (error) {
        console.error('Get deposits error:', error);
        res.status(500).json({ success: false, msg: 'Failed to get deposits' });
    }
});

// Helper function for transaction selection
const transactionSelector = async (trans_type, selectedDate) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT SUM(amount_involved) as total FROM transactions WHERE transaction_type = ? AND trans_date = ?',
            [trans_type, selectedDate]
        );
        connection.release();
        return rows[0].total || 0;
    } catch (error) {
        console.error('Transaction selector error:', error);
        return 0;
    }
};

// Get today's deposits
router.post('/todaysdeposits', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const total = await transactionSelector('deposit', req.body.today);
    res.json(total);
});

// Get today's withdrawals
router.post('/todaysWithdrawals', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const total = await transactionSelector('withdrawal', req.body.today);
    res.json(total);
});

// Get deposits by date
router.post('/depositByDate', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const currentDay = new Date();
    const year = currentDay.getFullYear();
    const selectedDate = `${req.body.day}-${req.body.month}-${year}`;
    const total = await transactionSelector('deposit', selectedDate);
    res.json(total);
});

// Get withdrawals by date
router.post('/withdrawalsByDate', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const currentDay = new Date();
    const year = currentDay.getFullYear();
    const selectedDate = `${req.body.day}-${req.body.month}-${year}`;
    const total = await transactionSelector('withdrawal', selectedDate);
    res.json(total);
});

// Basic route to check if the endpoint is working
router.get('/', (req, res) => {
    res.json({ success: true, msg: 'Transactions endpoint is working' });
});

module.exports = router;