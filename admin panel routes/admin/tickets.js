const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../../config/database');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get all tickets
router.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM tickets');
        connection.release();
        res.json({ success: true, tickets: rows });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching tickets' });
    }
});

// Get ticket by ID
router.get('/:id', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM tickets WHERE id = ?',
            [req.params.id]
        );
        connection.release();

        if (rows.length === 0) {
            return res.json({ success: false, msg: 'Ticket not found' });
        }

        res.json({ success: true, ticket: rows[0] });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching ticket' });
    }
});

// Get tickets by user ID
router.get('/user/:userId', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM tickets WHERE user_id = ?',
            [req.params.userId]
        );
        connection.release();
        res.json({ success: true, tickets: rows });
    } catch (error) {
        console.error('Get user tickets error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching user tickets' });
    }
});

// Get tickets by game ID
router.get('/game/:gameId', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM tickets WHERE game_id = ?',
            [req.params.gameId]
        );
        connection.release();
        res.json({ success: true, tickets: rows });
    } catch (error) {
        console.error('Get game tickets error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching game tickets' });
    }
});

// Get tickets by date range
router.get('/date-range', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const { start_date, end_date } = req.query;

        const [rows] = await connection.query(
            'SELECT * FROM tickets WHERE created_at BETWEEN ? AND ?',
            [start_date, end_date]
        );
        connection.release();
        res.json({ success: true, tickets: rows });
    } catch (error) {
        console.error('Get tickets by date range error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching tickets by date range' });
    }
});

// Update ticket status
router.put('/:id/status', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const { status } = req.body;

        await connection.query(
            'UPDATE tickets SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        connection.release();

        res.json({ success: true, msg: 'Ticket status updated successfully' });
    } catch (error) {
        console.error('Update ticket status error:', error);
        res.status(500).json({ success: false, msg: 'Error updating ticket status' });
    }
});

module.exports = router; 