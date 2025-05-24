const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const config = require('../config/database');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Register new admin
router.post('/register', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        // Check if username exists
        const [existingAdmins] = await connection.query(
            'SELECT * FROM admins WHERE username = ?',
            [req.body.username]
        );

        if (existingAdmins.length > 0) {
            connection.release();
            return res.json({ success: false, msg: 'Username exists already' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Insert new admin
        await connection.query(
            'INSERT INTO admins (firstname, lastname, email, mobile_no, username, password) VALUES (?, ?, ?, ?, ?, ?)',
            [
                req.body.firstname,
                req.body.lastname,
                req.body.email,
                req.body.mobile_no,
                req.body.username,
                hashedPassword
            ]
        );
        connection.release();

        res.json({ success: true, msg: 'Admin Registration Successful' });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.json({ success: false, msg: 'Admin Registration Failed' });
    }
});

// Authenticate admin
router.post('/authenticate', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM admins WHERE username = ?',
            [req.body.username]
        );
        connection.release();

        if (rows.length === 0) {
            return res.json({ success: false, msg: 'User not Found' });
        }

        const admin = rows[0];
        const isMatch = await bcrypt.compare(req.body.password, admin.password);

        if (isMatch) {
            const token = jwt.sign({ data: admin }, config.secret, {
                expiresIn: 604800 // token expires in one week
            });

            res.json({
                success: true,
                token: 'jwt4admin ' + token
            });
        } else {
            res.json({ success: false, msg: 'Wrong password' });
        }
    } catch (error) {
        console.error('Admin authentication error:', error);
        res.json({ success: false, msg: 'Authentication failed' });
    }
});

module.exports = router;
