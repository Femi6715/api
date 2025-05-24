const mongoose = require('mongoose');
const config = require('../config/database');
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const passport = require('passport');

// game schema

const GameSchema = mongoose.Schema({
  mobile_no: {
    type: Number,
    required: true,
    minlength: 11,
    maxlength: 11
  },
  game_id: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  ticket_id: {
    type: String,
    required: true
  },
  time_stamp: {
    type: Date,
    required: true
  },
  stake_amt: {
    type: Number,
    required: true
  },
  draw_time: {
    type: String,
    required: true
  },
  draw_date: {
    type: String,
    required: true
  },
  potential_winning: {
    type: Number,
    required: true
  },
  ticket_status: {
    type: String,
    required: true
  },
  jackpot: {
    type: String
  }
});

const Game = (module.exports = mongoose.model('Game', GameSchema));

module.exports.getGameByUserId = function(user_id, callback) {
  const query = { user_id: user_id };
  Game.find(query, callback);
};

module.exports.getLast5GamesByUserId = function(user_id, callback) {
  const query = { user_id: user_id };
  Game.find(query, callback)
    .sort({ _id: -1 })
    .limit(5);
};

module.exports.addTicket = function(newGame, callback) {
  newGame.save(callback);
};

module.exports.todayWinners = function(draw_date, ticket_status, callback) {
  const query = {
    draw_date: draw_date,
    ticket_status: ticket_status
  };
  Game.find(query, callback);
};

module.exports.pastWinningTickets = function(
  ticket_status,
  stake_amt,
  callback
) {
  const query = { ticket_status: ticket_status, stake_amt: stake_amt };
  Game.find(query, callback);
};

module.exports.selectBystake = function(selectedDate, stake_amt, callback) {
  const query = { draw_date: selectedDate, stake_amt: stake_amt };
  Game.countDocuments(query, callback);
};

module.exports.selectBy = function(selectedDate, callback) {
  const query = { draw_date: selectedDate };
  Game.countDocuments(query, callback);
};

module.exports.totalStakes = function(callback) {
  Game.find(callback);
};

module.exports.totalStakesByDate = function(selectedDate, callback) {
  const query = { draw_date: selectedDate };
  Game.find(query, callback);
};
module.exports.getOneUserTickets = function(user_id, callback) {
  const query = { user_id };
  Game.countDocuments(query, callback);
};
module.exports.getOneUserTicketsWon = function(
  user_id,
  ticket_status,
  callback
) {
  const query = { user_id, ticket_status };
  Game.countDocuments(query, callback);
};

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get active games
router.get('/active', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE ticket_status = "active" ORDER BY draw_date ASC'
        );
        connection.release();
        res.json({ success: true, games: rows });
    } catch (error) {
        console.error('Get active games error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching active games' });
    }
});

// Get game by ID
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
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

// Get user's games
router.get('/user/history', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        connection.release();
        res.json({ success: true, games: rows });
    } catch (error) {
        console.error('Get user games error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching user games' });
    }
});

// Create new game
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const { game_type, draw_date, ticket_status, jackpot } = req.body;

        const [result] = await connection.query(
            'INSERT INTO games (user_id, game_type, draw_date, ticket_status, jackpot) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, game_type, draw_date, ticket_status, jackpot]
        );
        connection.release();

        res.json({
            success: true,
            msg: 'Game created successfully',
            gameId: result.insertId
        });
    } catch (error) {
        console.error('Create game error:', error);
        res.status(500).json({ success: false, msg: 'Error creating game' });
    }
});

// Get game results
router.get('/:id/results', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM games WHERE id = ? AND ticket_status = "completed"',
            [req.params.id]
        );
        connection.release();

        if (rows.length === 0) {
            return res.json({ success: false, msg: 'Game results not available' });
        }

        res.json({ success: true, results: rows[0] });
    } catch (error) {
        console.error('Get game results error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching game results' });
    }
});

// Create new ticket
router.post('/newticket', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { 
      mobile_no, game_id, user_id, ticket_id, stake_amt, 
      potential_winning, time_stamp, draw_time, draw_date, ticket_status 
    } = req.body;
    
    const connection = await pool.getConnection();
    
    // Insert new ticket
    await connection.query(
      `INSERT INTO tickets 
      (mobile_no, game_id, user_id, ticket_id, stake_amt, potential_winning, time_stamp, draw_time, draw_date, ticket_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mobile_no, game_id, user_id, ticket_id, stake_amt, potential_winning, time_stamp, draw_time, draw_date, ticket_status]
    );
    
    connection.release();
    
    res.json({
      success: true,
      msg: 'Ticket created successfully. Good luck!'
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, msg: 'Failed to create ticket' });
  }
});

// Get winning tickets
router.get('/winning-tickets', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      `SELECT t.*, u.username, u.mobile_no 
       FROM tickets t
       JOIN users u ON t.user_id = u.id
       WHERE t.ticket_status = 'won'
       ORDER BY t.time_stamp DESC`
    );
    
    connection.release();
    
    res.json({
      success: true,
      tickets: rows
    });
  } catch (error) {
    console.error('Get winning tickets error:', error);
    res.status(500).json({ success: false, msg: 'Failed to get winning tickets' });
  }
});

// Get all tickets for a user
router.post('/alltickets', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { user_id } = req.body;
    
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      `SELECT * FROM tickets 
       WHERE user_id = ? 
       ORDER BY time_stamp DESC`,
      [user_id]
    );
    
    connection.release();
    
    res.json({
      success: true,
      tickets: rows
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, msg: 'Failed to get tickets' });
  }
});

// Get last 5 tickets for a user
router.post('/last5tickets', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { user_id } = req.body;
    
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      `SELECT * FROM tickets 
       WHERE user_id = ? 
       ORDER BY time_stamp DESC 
       LIMIT 5`,
      [user_id]
    );
    
    connection.release();
    
    res.json({
      success: true,
      tickets: rows
    });
  } catch (error) {
    console.error('Get last 5 tickets error:', error);
    res.status(500).json({ success: false, msg: 'Failed to get tickets' });
  }
});

module.exports = router;
