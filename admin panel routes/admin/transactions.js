const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../../config/database');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get all transactions
router.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM transactions');
        connection.release();
        res.json({ success: true, transactions: rows });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching transactions' });
    }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM transactions WHERE id = ?',
            [req.params.id]
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

// Get transactions by user ID
router.get('/user/:userId', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM transactions WHERE user_id = ?',
            [req.params.userId]
        );
        connection.release();
        res.json({ success: true, transactions: rows });
    } catch (error) {
        console.error('Get user transactions error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching user transactions' });
    }
});

// Get transactions by date range
router.get('/date-range', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const { start_date, end_date } = req.query;

        const [rows] = await connection.query(
            'SELECT * FROM transactions WHERE created_at BETWEEN ? AND ?',
            [start_date, end_date]
        );
        connection.release();
        res.json({ success: true, transactions: rows });
    } catch (error) {
        console.error('Get transactions by date range error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching transactions by date range' });
    }
});

// Get transactions by type
router.get('/type/:type', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM transactions WHERE type = ?',
            [req.params.type]
        );
        connection.release();
        res.json({ success: true, transactions: rows });
    } catch (error) {
        console.error('Get transactions by type error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching transactions by type' });
    }
});

module.exports = router; 