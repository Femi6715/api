const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../../config/database');
const bcrypt = require('bcryptjs');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Get all users
router.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM users');
        connection.release();

        // Remove sensitive information
        const users = rows.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.json({ success: true, users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching users' });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM users WHERE id = ?',
            [req.params.id]
        );
        connection.release();

        if (rows.length === 0) {
            return res.json({ success: false, msg: 'User not found' });
        }

        const user = rows[0];
        delete user.password;
        res.json({ success: true, user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, msg: 'Error fetching user' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const { surname, firstname, state, email, mobile_no, main_balance, bonus } = req.body;

        await connection.query(
            'UPDATE users SET surname = ?, firstname = ?, state = ?, email = ?, mobile_no = ?, main_balance = ?, bonus = ? WHERE id = ?',
            [surname, firstname, state, email, mobile_no, main_balance, bonus, req.params.id]
        );
        connection.release();

        res.json({ success: true, msg: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, msg: 'Error updating user' });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        connection.release();

        res.json({ success: true, msg: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, msg: 'Error deleting user' });
    }
});

// Reset user password
router.post('/:id/reset-password', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.new_password, salt);

        await connection.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.params.id]
        );
        connection.release();

        res.json({ success: true, msg: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, msg: 'Error resetting password' });
    }
});

module.exports = router; 