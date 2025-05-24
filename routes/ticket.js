const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config/database');
const passport = require('passport');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get user's tickets
router.get('/my-tickets', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        connection.release();
        res.json({ success: true, tickets: rows });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching tickets' });
    }
});

// Get ticket by ID
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM tickets WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
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

// Create new ticket
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const { game_id, numbers, amount } = req.body;

        // Start transaction
        await connection.beginTransaction();

        try {
            // Check if user has sufficient balance
            const [users] = await connection.query(
                'SELECT main_balance FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users[0].main_balance < amount) {
                throw new Error('Insufficient balance');
            }

            // Create ticket
            const [result] = await connection.query(
                'INSERT INTO tickets (user_id, game_id, numbers, amount, status) VALUES (?, ?, ?, ?, "pending")',
                [req.user.id, game_id, JSON.stringify(numbers), amount]
            );

            // Deduct amount from user's balance
            await connection.query(
                'UPDATE users SET main_balance = main_balance - ? WHERE id = ?',
                [amount, req.user.id]
            );

            // Create transaction record
            await connection.query(
                'INSERT INTO transactions (user_id, type, amount, description) VALUES (?, "ticket_purchase", ?, ?)',
                [req.user.id, amount, `Ticket purchase for game #${game_id}`]
            );

            // Commit transaction
            await connection.commit();
            connection.release();

            res.json({
                success: true,
                msg: 'Ticket created successfully',
                ticketId: result.insertId
            });
        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({
            success: false,
            msg: error.message === 'Insufficient balance'
                ? 'Insufficient balance for ticket purchase'
                : 'Error creating ticket'
        });
    }
});

// Get tickets by game ID
router.get('/game/:gameId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM tickets WHERE game_id = ? AND user_id = ?',
            [req.params.gameId, req.user.id]
        );
        connection.release();
        res.json({ success: true, tickets: rows });
    } catch (error) {
        console.error('Get game tickets error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching game tickets' });
    }
});

// Get ticket summary
router.get('/summary', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                status,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM tickets 
            WHERE user_id = ? 
            GROUP BY status`,
            [req.user.id]
        );
        connection.release();

        const summary = {
            pending: { count: 0, total: 0 },
            won: { count: 0, total: 0 },
            lost: { count: 0, total: 0 }
        };

        rows.forEach(row => {
            summary[row.status] = {
                count: row.count,
                total: row.total_amount
            };
        });

        res.json({ success: true, summary });
    } catch (error) {
        console.error('Get ticket summary error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching ticket summary' });
    }
});

module.exports = router; 