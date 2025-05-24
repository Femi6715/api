const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config/database');
const passport = require('passport');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get user's transfer recipients
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM transfer_recipients WHERE user_id = ?',
            [req.user.id]
        );
        connection.release();
        res.json({ success: true, recipients: rows });
    } catch (error) {
        console.error('Get recipients error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching recipients' });
    }
});

// Add new transfer recipient
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const { bank_code, account_number, account_name } = req.body;

        // Check if recipient already exists
        const [existing] = await connection.query(
            'SELECT * FROM transfer_recipients WHERE user_id = ? AND account_number = ?',
            [req.user.id, account_number]
        );

        if (existing.length > 0) {
            connection.release();
            return res.json({ success: false, msg: 'Recipient already exists' });
        }

        // Generate recipient code (you might want to integrate with Paystack or similar service)
        const recipient_code = `RCP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Add new recipient
        const [result] = await connection.query(
            'INSERT INTO transfer_recipients (user_id, recipient_code, bank_code, account_number, account_name) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, recipient_code, bank_code, account_number, account_name]
        );
        connection.release();

        res.json({
            success: true,
            msg: 'Recipient added successfully',
            recipientId: result.insertId
        });
    } catch (error) {
        console.error('Add recipient error:', error);
        res.status(500).json({ success: false, msg: 'Error adding recipient' });
    }
});

// Delete transfer recipient
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.query(
            'DELETE FROM transfer_recipients WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        connection.release();

        res.json({ success: true, msg: 'Recipient deleted successfully' });
    } catch (error) {
        console.error('Delete recipient error:', error);
        res.status(500).json({ success: false, msg: 'Error deleting recipient' });
    }
});

// Get recipient by ID
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM transfer_recipients WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        connection.release();

        if (rows.length === 0) {
            return res.json({ success: false, msg: 'Recipient not found' });
        }

        res.json({ success: true, recipient: rows[0] });
    } catch (error) {
        console.error('Get recipient error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching recipient' });
    }
});

module.exports = router; 