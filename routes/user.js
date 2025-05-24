const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const config = require('../config/database');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Register route
router.post('/register', async (req, res) => {
  try {
    const { surname, firstname, state, email, mobile_no, username, password } = req.body;
    
    const connection = await pool.getConnection();
    
    // Check if username already exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE username = ? OR mobile_no = ?',
      [username, mobile_no]
    );
    
    if (existingUsers.length > 0) {
      connection.release();
      return res.json({ success: false, msg: 'Username or mobile number already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Insert new user - removed gender and dob fields to match schema
    const [result] = await connection.query(
      'INSERT INTO users (surname, firstname, state, email, mobile_no, username, password, main_balance, bonus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        surname,
        firstname,
        state,
        email,
        mobile_no,
        username,
        hash,
        0, // Initial main_balance
        0  // Initial bonus
      ]
    );
    
    connection.release();
    res.json({ success: true, msg: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, msg: 'Registration failed' });
  }
});

// Authenticate user
router.post('/authenticate', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const connection = await pool.getConnection();
    
    // Find user by username or mobile number
    const [users] = await connection.query(
      'SELECT * FROM users WHERE username = ? OR mobile_no = ?',
      [username, username]
    );
    
    connection.release();
    
    if (users.length === 0) {
      return res.json({ success: false, msg: 'User not found' });
    }
    
    const user = users[0];
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      // Create JWT token
      const token = jwt.sign({
        data: {
          _id: user.id,
          username: user.username,
          email: user.email
        }
      }, config.secret, {
        expiresIn: 604800 // 1 week
      });
      
      res.json({
        success: true,
        token: token,
        user: {
          id: user.id,
          surname: user.surname,
          firstname: user.firstname,
          state: user.state,
          email: user.email,
          mobile_no: user.mobile_no,
          username: user.username,
          main_balance: user.main_balance,
          bonus: user.bonus,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } else {
      res.json({ success: false, msg: 'Wrong password' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, msg: 'Authentication failed' });
  }
});

// Get user profile
router.get('/profile', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        surname: req.user.surname,
        firstname: req.user.firstname,
        state: req.user.state,
        email: req.user.email,
        mobile_no: req.user.mobile_no,
        username: req.user.username,
        main_balance: req.user.main_balance,
        bonus: req.user.bonus,
        createdAt: req.user.created_at,
        updatedAt: req.user.updated_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching profile' });
  }
});

// Get user by ID
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
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
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching user' });
  }
});

// Get user's main balance
router.get('/:id/main-balance', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT main_balance FROM users WHERE id = ?',
      [req.params.id]
    );
    connection.release();
    
    if (rows.length === 0) {
      return res.json({ success: false, msg: 'User not found' });
    }
    
    res.json({
      success: true,
      main_balance: rows[0].main_balance
    });
  } catch (error) {
    console.error('Get main balance error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching main balance' });
  }
});

// Get user's bonus balance
router.get('/:id/bonus', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT bonus FROM users WHERE id = ?',
      [req.params.id]
    );
    connection.release();
    
    if (rows.length === 0) {
      return res.json({ success: false, msg: 'User not found' });
    }
    
    res.json({
      success: true,
      bonus: rows[0].bonus
    });
  } catch (error) {
    console.error('Get bonus error:', error);
    res.status(500).json({ success: false, msg: 'Error fetching bonus' });
  }
});

// Update user profile
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    // Only allow users to update their own profile unless admin
    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ success: false, msg: 'Unauthorized' });
    }
    
    const { state, email, mobile_no, current_password, new_password } = req.body;
    
    const connection = await pool.getConnection();
    
    // If updating password, verify current password
    if (current_password && new_password) {
      const [rows] = await connection.query(
        'SELECT password FROM users WHERE id = ?',
        [req.params.id]
      );
      
      if (rows.length === 0) {
        connection.release();
        return res.json({ success: false, msg: 'User not found' });
      }
      
      const isMatch = await bcrypt.compare(current_password, rows[0].password);
      
      if (!isMatch) {
        connection.release();
        return res.json({ success: false, msg: 'Current password is incorrect' });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(new_password, salt);
      
      // Update user with new password
      await connection.query(
        'UPDATE users SET state = ?, email = ?, mobile_no = ?, password = ? WHERE id = ?',
        [state, email, mobile_no, hash, req.params.id]
      );
    } else {
      // Update user without changing password
      await connection.query(
        'UPDATE users SET state = ?, email = ?, mobile_no = ? WHERE id = ?',
        [state, email, mobile_no, req.params.id]
      );
    }
    
    // Get updated user
    const [updatedRows] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );
    
    connection.release();
    
    if (updatedRows.length === 0) {
      return res.json({ success: false, msg: 'User not found after update' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedRows[0];
    
    res.json({
      success: true,
      msg: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, msg: 'Error updating profile' });
  }
});

// Reset password with email
router.post('/reset-password-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    const connection = await pool.getConnection();
    
    // Check if email exists
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    connection.release();
    
    if (rows.length === 0) {
      return res.json({ success: false, msg: 'Email not found' });
    }
    
    // Generate random password
    const newPassword = Math.random().toString(36).slice(-8);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    // Update user with new password
    await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hash, email]
    );
    
    // TODO: Send email with new password
    
    res.json({
      success: true,
      msg: 'New password has been sent to your email'
    });
  } catch (error) {
    console.error('Reset password with email error:', error);
    res.status(500).json({ success: false, msg: 'Error resetting password' });
  }
});

// Reset password with phone
router.post('/reset-password-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    const connection = await pool.getConnection();
    
    // Check if phone number exists
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE mobile_no = ?',
      [phoneNumber]
    );
    
    connection.release();
    
    if (rows.length === 0) {
      return res.json({ success: false, msg: 'Phone number not found' });
    }
    
    // Generate random password
    const newPassword = Math.random().toString(36).slice(-8);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    // Update user with new password
    await connection.query(
      'UPDATE users SET password = ? WHERE mobile_no = ?',
      [hash, phoneNumber]
    );
    
    // TODO: Send SMS with new password
    
    res.json({
      success: true,
      msg: 'New password has been sent to your phone'
    });
  } catch (error) {
    console.error('Reset password with phone error:', error);
    res.status(500).json({ success: false, msg: 'Error resetting password' });
  }
});

// Update user account balance - simplified version
router.patch('/updateAcct', async (req, res) => {
  try {
    const { user_id, main_balance, bonus } = req.body;
    console.log('updateAcct called with:', { user_id, main_balance, bonus });
    
    const connection = await pool.getConnection();
    
    // Verify the user exists
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [user_id]
    );
    
    if (userRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, msg: 'User not found' });
    }
    
    // Update user balance
    await connection.query(
      'UPDATE users SET main_balance = ?, bonus = ? WHERE id = ?',
      [main_balance, bonus, user_id]
    );
    
    // Get updated user data
    const [updatedRows] = await connection.query(
      'SELECT id, main_balance, bonus FROM users WHERE id = ?',
      [user_id]
    );
    
    connection.release();
    
    res.json({
      success: true,
      msg: 'Account balance updated successfully',
      user: {
        id: updatedRows[0].id,
        main_balance: updatedRows[0].main_balance,
        bonus: updatedRows[0].bonus
      }
    });
  } catch (error) {
    console.error('Update account balance error:', error);
    res.status(500).json({ success: false, msg: 'Error updating account balance' });
  }
});

// Also support PUT for backward compatibility
router.put('/updateAcct', async (req, res) => {
  try {
    const { user_id, main_balance, bonus } = req.body;
    console.log('PUT updateAcct called with:', { user_id, main_balance, bonus });
    
    const connection = await pool.getConnection();
    
    // Verify the user exists
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [user_id]
    );
    
    if (userRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, msg: 'User not found' });
    }
    
    // Update user balance
    await connection.query(
      'UPDATE users SET main_balance = ?, bonus = ? WHERE id = ?',
      [main_balance, bonus, user_id]
    );
    
    // Get updated user data
    const [updatedRows] = await connection.query(
      'SELECT id, main_balance, bonus FROM users WHERE id = ?',
      [user_id]
    );
    
    connection.release();
    
    res.json({
      success: true,
      msg: 'Account balance updated successfully',
      user: {
        id: updatedRows[0].id,
        main_balance: updatedRows[0].main_balance,
        bonus: updatedRows[0].bonus
      }
    });
  } catch (error) {
    console.error('Update account balance error:', error);
    res.status(500).json({ success: false, msg: 'Error updating account balance' });
  }
});

module.exports = router;
