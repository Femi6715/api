const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const config = require('../config/database');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM admin_users WHERE username = ?',
      [req.body.username]
    );
    connection.release();

    if (rows.length === 0) {
      return res.json({ success: false, msg: 'Admin user not found' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(req.body.password, admin.password);

    if (isMatch) {
      // Create token for admin
      const token = jwt.sign({
        data: {
          _id: admin.id,
          username: admin.username,
          email: admin.email,
          isAdmin: true
        }
      }, config.secret, {
        expiresIn: 604800 // 1 week
      });

      res.json({
        success: true,
        token: 'JWT ' + token,
        admin: {
          id: admin.id,
          firstname: admin.firstname,
          lastname: admin.lastname,
          email: admin.email,
          username: admin.username
        }
      });
    } else {
      return res.json({ success: false, msg: 'Wrong password' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, msg: 'Admin login failed' });
  }
});

// Get all admin users
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT id, firstname, lastname, email, username FROM admin_users');
    connection.release();
    res.json({ success: true, admins: rows });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching admin users' });
  }
});

// Add new admin user
router.post('/register', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { firstname, lastname, email, mobile_no, username, password } = req.body;
    
    const connection = await pool.getConnection();
    
    // Check if username already exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      connection.release();
      return res.json({ success: false, msg: 'Username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Insert new admin
    await connection.query(
      'INSERT INTO admin_users (firstname, lastname, email, mobile_no, username, password) VALUES (?, ?, ?, ?, ?, ?)',
      [firstname, lastname, email, mobile_no, username, hash]
    );
    
    connection.release();
    res.json({ success: true, msg: 'Admin user registered' });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ success: false, msg: 'Failed to register admin user' });
  }
});

module.exports = router;