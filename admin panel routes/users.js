const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const EmailTemplate = require('email-templates').EmailTemplate;
const path = require('path');
const Promise = require('bluebird');

// Create MySQL connection pool
const pool = mysql.createPool(config.database);

// Email configuration


// Helper functions
const sendMail = async (cb) => {
  return await transporter.sendMail(cb, function(res) {
    console.log(res);
  });
};

const sendTemplate = (templateName, contexts) => {
  let template = new EmailTemplate(
    path.join(__dirname, 'templates', templateName)
  );
  return Promise.all(
    contexts.map(context => {
      return new Promise((resolve, reject) => {
        template.render(context, (err, result) => {
          if (err) reject(err);
          else
            resolve({
              email: result,
              context
            });
        });
      });
    })
  );
};

// Passport middleware
require('../config/passport');

// GET all users
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
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, msg: 'Error fetching users' });
  }
});

// GET user by username
router.get('/username/:username', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [req.params.username]
    );
    connection.release();

    if (rows.length === 0) {
      return res.json({ success: false, msg: 'User not found' });
    }

    const user = rows[0];
    delete user.password;
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, msg: 'Error fetching user' });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Check if username exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE username = ? OR mobile_no = ?',
      [req.body.username, req.body.mobile_no]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.json({
        success: false,
        msg: 'Username or mobile number already taken'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Insert new user
    const [result] = await connection.query(
      'INSERT INTO users (surname, firstname, state, email, mobile_no, username, password, main_balance, bonus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.body.surname,
        req.body.firstname,
        req.body.state,
        req.body.email,
        req.body.mobile_no,
        req.body.username.replace(/ +/g, ''),
        hashedPassword,
        req.body.main_balance || 0,
        req.body.bonus || 0
      ]
    );
    connection.release();

    // Send welcome email
    if (req.body.email) {
      const user_mail_info = [{
        firstname: req.body.firstname,
        surname: req.body.surname
      }];

      try {
        const results = await sendTemplate('welcome', user_mail_info);
        await Promise.all(
          results.map(result => 
            sendMail({
              from: 'welcome@padilotto.ng',
              to: req.body.email,
              subject: 'Simplelotto Welcome Email',
              html: result.email.html,
              text: result.email.text
            })
          )
        );
        console.log('Welcome email sent!');
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }
    }

    res.json({ success: true, msg: 'User Registration Successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, msg: 'User Registration Failed' });
  }
});

// Authenticate user
router.post('/authenticate', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [req.body.username]
    );
    connection.release();

    if (rows.length === 0) {
      return res.json({ success: false, msg: 'User not found' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) {
      return res.json({ success: false, msg: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id }, config.secret, { expiresIn: '24h' });
    delete user.password;

    res.json({
      success: true,
      token: 'JWT ' + token,
      user
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, msg: 'Authentication failed' });
  }
});

// Reset password via email
router.post('/reset', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [req.body.username]
    );
    connection.release();

    if (rows.length === 0) {
      return res.json({ success: false, msg: 'Invalid email address' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.new_pwd, salt);

    await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, req.body.username]
    );

    const pwdReset = [{
      user_new_pwd: req.body.new_pwd,
      user_email: req.body.username
    }];

    try {
      const results = await sendTemplate('resetPassword', pwdReset);
      await Promise.all(
        results.map(result => 
          sendMail({
            from: 'info@padilotto.ng',
            to: result.context.user_email,
            subject: 'Simplelotto Password Reset',
            html: result.email.html,
            text: result.email.text
          })
        )
      );
      console.log('Password reset email sent!');
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
    }

    res.json({
      success: true,
      msg: 'A new password has been sent to your e-mail address'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, msg: 'Password reset failed' });
  }
});

// Reset password via SMS
router.post('/resetWithSms', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE mobile_no = ?',
      [req.body.username]
    );
    connection.release();

    if (rows.length === 0) {
      return res.json({ success: false, msg: 'Invalid phone number' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.new_pwd, salt);

    await connection.query(
      'UPDATE users SET password = ? WHERE mobile_no = ?',
      [hashedPassword, req.body.username]
    );

    const url = `http://api.ebulksms.com:8080/sendsms?username=management@padilotto.ng&apikey=8521a8fc22fa85a013f63e724086420447b7b907&sender=Simplelotto&messagetext=Your%20new%20simplelotto%20password%20is%20${req.body.new_pwd}&flash=0&recipients=${req.body.username}`;
    
    try {
      const response = await fetch(url);
      const json = await response.json();
      console.log('SMS sent:', json);
    } catch (smsError) {
      console.error('Error sending SMS:', smsError);
    }

    res.json({
      success: true,
      msg: 'A new password has been sent to your mobile number'
    });
  } catch (error) {
    console.error('SMS reset error:', error);
    res.status(500).json({ success: false, msg: 'Password reset failed' });
  }
});

module.exports = router;