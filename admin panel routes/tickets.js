const express = require('express');
const router = express.Router();
const passport = require('passport');
const mysql = require('mysql2/promise');
const config = require('../config/database');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get all tickets
router.get('/all', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM games');
        connection.release();
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.json({ success: false, message: 'Error finding all tickets' });
    }
});

// Get tickets for a specific date
router.get('/today/:date/:month/:year', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const todaysDate = `${req.params.date}-${req.params.month}-${req.params.year}`;
        
        // Get all tickets for the date
        const [tickets] = await connection.query(
            'SELECT * FROM games WHERE draw_date = ?',
            [todaysDate]
        );

        // Get count of winning tickets
        const [winCount] = await connection.query(
            'SELECT COUNT(*) as count FROM games WHERE draw_date = ? AND ticket_status = ?',
            [todaysDate, 'won']
        );
        
        connection.release();
        res.json({
            success: true,
            data: tickets,
            count: winCount[0].count
        });
    } catch (error) {
        console.error('Get today tickets error:', error);
        res.json({ success: false, message: 'Error finding tickets' });
    }
});

// Get tickets for a specific month
router.get('/month/:month', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const monthPattern = `${req.params.month}-2019`;
        
        // Get all tickets for the month
        const [tickets] = await connection.query(
            'SELECT * FROM games WHERE draw_date LIKE ?',
            [`%${monthPattern}%`]
        );

        // Get count of jackpot winners
        const [jackpotCount] = await connection.query(
            'SELECT COUNT(*) as count FROM games WHERE draw_date LIKE ? AND jackpot = ?',
            [`%${monthPattern}%`, 'won']
        );
        
        connection.release();
        res.json({
            success: true,
            data: tickets,
            count: jackpotCount[0].count
        });
    } catch (error) {
        console.error('Get month tickets error:', error);
        res.json({ success: false, message: 'Error finding tickets' });
    }
});

// Update ticket status to won
router.post('/updateTicket/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            'UPDATE games SET ticket_status = ? WHERE id = ?',
            ['won', req.params.id]
        );
        connection.release();
        
        if (result.affectedRows === 0) {
            return res.json({ success: false, message: 'Ticket not found' });
        }
        
        res.json({ success: true, message: 'Ticket updated successfully' });
    } catch (error) {
        console.error('Update ticket error:', error);
        res.json({ success: false, message: 'Error updating ticket' });
    }
});

// Update ticket jackpot status
router.post('/updateJackpotTicket/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            'UPDATE games SET jackpot = ? WHERE id = ?',
            ['won', req.params.id]
        );
        connection.release();
        
        if (result.affectedRows === 0) {
            return res.json({ success: false, message: 'Ticket not found' });
        }
        
        res.json({ success: true, message: 'Jackpot status updated successfully' });
    } catch (error) {
        console.error('Update jackpot error:', error);
        res.json({ success: false, message: 'Error updating jackpot status' });
    }
});

// Basic route to check if the endpoint is working
router.get('/', (req, res) => {
    res.json({ success: true, msg: 'Tickets endpoint is working' });
});

module.exports = router;
