const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config/database');
const passport = require('passport');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get all game categories
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM game_categories');
        connection.release();
        res.json({ success: true, categories: rows });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching categories' });
    }
});

// Get category by ID
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM game_categories WHERE id = ?',
            [req.params.id]
        );
        connection.release();

        if (rows.length === 0) {
            return res.json({ success: false, msg: 'Category not found' });
        }

        res.json({ success: true, category: rows[0] });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching category' });
    }
});

// Get active games in category
router.get('/:id/games', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT g.* 
            FROM games g 
            JOIN game_categories gc ON g.game_type = gc.name 
            WHERE gc.id = ? AND g.ticket_status = 'active' 
            ORDER BY g.draw_date ASC`,
            [req.params.id]
        );
        connection.release();
        res.json({ success: true, games: rows });
    } catch (error) {
        console.error('Get category games error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching category games' });
    }
});

// Get category statistics
router.get('/:id/stats', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                COUNT(*) as total_games,
                COUNT(CASE WHEN ticket_status = 'active' THEN 1 END) as active_games,
                COUNT(CASE WHEN ticket_status = 'completed' THEN 1 END) as completed_games,
                COUNT(CASE WHEN jackpot = 'won' THEN 1 END) as jackpot_wins
            FROM games g 
            JOIN game_categories gc ON g.game_type = gc.name 
            WHERE gc.id = ?`,
            [req.params.id]
        );
        connection.release();

        res.json({ success: true, stats: rows[0] });
    } catch (error) {
        console.error('Get category stats error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching category statistics' });
    }
});

module.exports = router; 