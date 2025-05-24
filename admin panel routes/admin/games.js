const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../../config/database');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get all games
router.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM games');
        connection.release();
        res.json({ success: true, games: rows });
    } catch (error) {
        console.error('Get games error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching games' });
    }
});

// Get game by ID
router.get('/:id', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE id = ?',
            [req.params.id]
        );
        connection.release();

        if (rows.length === 0) {
            return res.json({ success: false, msg: 'Game not found' });
        }

        res.json({ success: true, game: rows[0] });
    } catch (error) {
        console.error('Get game error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching game' });
    }
});

// Update game status
router.put('/:id/status', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const { ticket_status, jackpot } = req.body;

        await connection.query(
            'UPDATE games SET ticket_status = ?, jackpot = ? WHERE id = ?',
            [ticket_status, jackpot, req.params.id]
        );
        connection.release();

        res.json({ success: true, msg: 'Game status updated successfully' });
    } catch (error) {
        console.error('Update game status error:', error);
        res.status(500).json({ success: false, msg: 'Error updating game status' });
    }
});

// Get games by user ID
router.get('/user/:userId', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE user_id = ?',
            [req.params.userId]
        );
        connection.release();
        res.json({ success: true, games: rows });
    } catch (error) {
        console.error('Get user games error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching user games' });
    }
});

// Get games by date range
router.get('/date-range', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const { start_date, end_date } = req.query;

        const [rows] = await connection.query(
            'SELECT * FROM games WHERE draw_date BETWEEN ? AND ?',
            [start_date, end_date]
        );
        connection.release();
        res.json({ success: true, games: rows });
    } catch (error) {
        console.error('Get games by date range error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching games by date range' });
    }
});

module.exports = router; 