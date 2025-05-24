const express = require('express');
const router = express.Router();
const passport = require('passport');
const mysql = require('mysql2/promise');
const config = require('../config/database');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Add new ticket
router.post('/newticket', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            'INSERT INTO games (mobile_no, game_id, user_id, ticket_id, time_stamp, stake_amt, draw_time, draw_date, potential_winning, ticket_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                req.body.mobile_no,
                req.body.game_id,
                req.body.user_id,
                req.body.ticket_id,
                req.body.time_stamp,
                req.body.stake_amt,
                req.body.draw_time,
                req.body.draw_date,
                req.body.potential_winning,
                req.body.ticket_status
            ]
        );
        connection.release();
        
        res.json({
            success: true,
            msg: `Your bet has been placed successfully! Your Ticket Number is ${req.body.ticket_id}. Check your dashboard to view your ticket. Play multiple times to increase your chances!`
        });
    } catch (error) {
        console.error('New ticket error:', error);
        res.json({ success: false, msg: 'Sorry, your bet could not be placed.' });
    }
});

// Get all tickets for a user
router.post('/alltickets', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE user_id = ? ORDER BY time_stamp DESC',
            [req.body.id]
        );
        connection.release();
        res.json({ success: true, tickets: rows });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.json({ success: false, msg: 'Could not fetch your tickets at this time.' });
    }
});

// Get last 5 tickets for a user
router.post('/last5tickets', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE user_id = ? ORDER BY time_stamp DESC LIMIT 5',
            [req.body.id]
        );
        connection.release();
        res.json({ success: true, tickets: rows });
    } catch (error) {
        console.error('Get last 5 tickets error:', error);
        res.json({ success: false, msg: 'Could not fetch your tickets at this time.' });
    }
});

// Get winning tickets for a date
router.get('/winning-tickets-signal/:draw_date/:ticket_status', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE draw_date = ? AND ticket_status = ?',
            [req.params.draw_date, req.params.ticket_status]
        );
        connection.release();
        
        if (rows.length === 0) {
            res.json('Today\'s tickets are too few to shuffle!');
        } else {
            res.json(rows);
        }
    } catch (error) {
        console.error('Get winning tickets error:', error);
        res.json({ success: false, msg: 'Could not fetch winners at this time.' });
    }
});

// Get past winning tickets
router.get('/pastWinningTickets/:ticket_status/:stake_amt', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE ticket_status = ? AND stake_amt = ?',
            [req.params.ticket_status, req.params.stake_amt]
        );
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Get past winning tickets error:', error);
        res.json({ success: false, msg: 'Could not fetch past winning tickets.' });
    }
});

// Helper function for selecting tickets by stake amount
const selector = async (selectedDate, stake_amt) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE draw_date = ? AND stake_amt = ?',
            [selectedDate, stake_amt]
        );
        connection.release();
        return rows;
    } catch (error) {
        console.error('Selector error:', error);
        return [];
    }
};

// Get stats for a date
router.post('/stats', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const currentDay = new Date();
        const year = currentDay.getFullYear();
        const selectedDate = `${req.body.day}-${req.body.month}-${year}`;
        
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE draw_date = ?',
            [selectedDate]
        );
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Get stats error:', error);
        res.json({ success: false, msg: 'Could not fetch stats.' });
    }
});

// Get today's stats
router.post('/statstoday', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE draw_date = ?',
            [req.body.today]
        );
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Get today stats error:', error);
        res.json({ success: false, msg: 'Could not fetch today\'s stats.' });
    }
});

// Get stats for 25k stake
router.post('/statsBy25k', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const currentDay = new Date();
    const year = currentDay.getFullYear();
    const selectedDate = `${req.body.day}-${req.body.month}-${year}`;
    const result = await selector(selectedDate, '25');
    res.json(result);
});

// Get today's stats for 25k stake
router.post('/statstoday25k', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const result = await selector(req.body.today, '25');
    res.json(result);
});

// Get stats for 50k stake
router.post('/statsBy50k', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const currentDay = new Date();
    const year = currentDay.getFullYear();
    const selectedDate = `${req.body.day}-${req.body.month}-${year}`;
    const result = await selector(selectedDate, '50');
    res.json(result);
});

// Get today's stats for 50k stake
router.post('/statstoday50k', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const result = await selector(req.body.today, '50');
    res.json(result);
});

// Get stats for 100k stake
router.post('/statsBy100k', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const currentDay = new Date();
    const year = currentDay.getFullYear();
    const selectedDate = `${req.body.day}-${req.body.month}-${year}`;
    const result = await selector(selectedDate, '100');
    res.json(result);
});

// Get today's stats for 100k stake
router.post('/statstoday100k', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const result = await selector(req.body.today, '100');
    res.json(result);
});

// Get total stakes
router.post('/totalstakes', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT SUM(stake_amt) as total FROM games');
        connection.release();
        res.json(rows[0].total || 0);
    } catch (error) {
        console.error('Get total stakes error:', error);
        res.json({ success: false, msg: 'Could not fetch total stakes.' });
    }
});

// Get total stakes for today
router.post('/totalstakesToday', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT SUM(stake_amt) as total FROM games WHERE draw_date = ?',
            [req.body.today]
        );
        connection.release();
        res.json(rows[0].total || 0);
    } catch (error) {
        console.error('Get today total stakes error:', error);
        res.json({ success: false, msg: 'Could not fetch today\'s total stakes.' });
    }
});

// Get total stakes for a date
router.post('/totalstakesByDate', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const currentDay = new Date();
        const year = currentDay.getFullYear();
        const selectedDate = `${req.body.day}-${req.body.month}-${year}`;
        
        const [rows] = await connection.query(
            'SELECT SUM(stake_amt) as total FROM games WHERE draw_date = ?',
            [selectedDate]
        );
        connection.release();
        res.json(rows[0].total || 0);
    } catch (error) {
        console.error('Get date total stakes error:', error);
        res.json({ success: false, msg: 'Could not fetch total stakes for date.' });
    }
});

// Get one user's tickets
router.post('/getOneUserTickets', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE user_id = ? ORDER BY time_stamp DESC',
            [req.body.user_id]
        );
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Get user tickets error:', error);
        res.json({ success: false, msg: 'Could not fetch user tickets.' });
    }
});

// Get one user's winning tickets
router.post('/getOneUserTicketsWon', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE user_id = ? AND ticket_status = ? ORDER BY time_stamp DESC',
            [req.body.user_id, 'won']
        );
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Get user winning tickets error:', error);
        res.json({ success: false, msg: 'Could not fetch user winning tickets.' });
    }
});

// Basic route to check if the endpoint is working
router.get('/', (req, res) => {
    res.json({ success: true, msg: 'Games endpoint is working' });
});

module.exports = router;