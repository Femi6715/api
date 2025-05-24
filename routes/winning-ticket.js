const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config/database');
const passport = require('passport');

const WinningGameSchema = mongoose.Schema({
    game_id:{
        type: String,
        required: true
    },
    user_id:{
        type: String,
        required: true
    },
    draw_date: {
        type: String,
        required: true
    },
    amount_won:{
        type: Number,
        required: true
    },
    ticket_status:{
        type: String,
        required: true
    }
});

const WinningGames = module.exports = mongoose.model('WinningGames', WinningGameSchema);

module.exports.addWinningTicket = function(newWinningGame, callback){
    newWinningGame.save(callback);
}

module.exports.pastWinningTickets = function(callback){
    WinningGames.find(callback);
}

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get user's winning tickets
router.get('/my-winnings', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT t.*, g.game_type, g.draw_date, g.draw_time 
            FROM tickets t 
            JOIN games g ON t.game_id = g.id 
            WHERE t.user_id = ? AND t.status = 'won' 
            ORDER BY t.created_at DESC`,
            [req.user.id]
        );
        connection.release();
        res.json({ success: true, winningTickets: rows });
    } catch (error) {
        console.error('Get winning tickets error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching winning tickets' });
    }
});

// Get winning ticket details
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT t.*, g.game_type, g.draw_date, g.draw_time 
            FROM tickets t 
            JOIN games g ON t.game_id = g.id 
            WHERE t.id = ? AND t.user_id = ? AND t.status = 'won'`,
            [req.params.id, req.user.id]
        );
        connection.release();

        if (rows.length === 0) {
            return res.json({ success: false, msg: 'Winning ticket not found' });
        }

        res.json({ success: true, winningTicket: rows[0] });
    } catch (error) {
        console.error('Get winning ticket error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching winning ticket' });
    }
});

// Get winning summary
router.get('/summary', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                COUNT(*) as total_wins,
                SUM(amount) as total_winnings,
                MAX(amount) as highest_win,
                MIN(amount) as lowest_win
            FROM tickets 
            WHERE user_id = ? AND status = 'won'`,
            [req.user.id]
        );
        connection.release();

        res.json({ success: true, summary: rows[0] });
    } catch (error) {
        console.error('Get winning summary error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching winning summary' });
    }
});

module.exports = router;