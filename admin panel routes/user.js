const express = require('express');
const router = express.Router();
const User = require('../models/mysql/user');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const sequelize = require('../models/mysql/index');

// Ensure DB connection is established
sequelize.authenticate()
    .then(() => console.log('User routes: Database connection verified.'))
    .catch(err => console.error('User routes: Unable to connect to the database:', err));

// Get user by username - must come before /:id route
router.get('/username/:username', async (req, res) => {
    try {
        const username = req.params.username.toLowerCase();
        console.log('Searching for user with username:', username);
        
        const user = await User.findOne({ 
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('username')),
                username
            ),
            logging: console.log // Enable query logging
        });
        
        console.log('Query result:', user);
        
        if (!user) {
            console.log('No user found with username:', username);
            return res.status(404).json({ success: false, msg: 'User not found' });
        }
        
        console.log('Found user:', {
            id: user.id,
            username: user.username,
            email: user.email
        });
        
        res.json({
            success: true,
            user: {
                id: user.id,
                surname: user.surname,
                firstname: user.firstname,
                state: user.state,
                email: user.email,
                mobile_no: user.mobile_no,
                username: user.username,
                main_balance: user.main_balance,
                bonus: user.bonus
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, msg: 'Error fetching user' });
    }
});

// Update user account
router.patch('/updateAcct', async (req, res) => {
    try {
        const { user_id, main_balance, bonus } = req.body;
        const user = await User.findByPk(user_id);
        
        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        await user.update({
            main_balance: main_balance,
            bonus: bonus
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                main_balance: user.main_balance,
                bonus: user.bonus
            }
        });
    } catch (error) {
        console.error('Error updating user account:', error);
        res.status(500).json({ success: false, msg: 'Error updating user account' });
    }
});

// Get user by ID - must come after specific routes
router.get('/:id', async (req, res) => {
    try {
        console.log('Fetching user with ID:', req.params.id);
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            console.log('User not found with ID:', req.params.id);
            return res.status(404).json({ success: false, msg: 'User not found' });
        }
        
        console.log('User found:', user.username);
        
        res.json({
            success: true,
            user: {
                id: user.id,
                surname: user.surname,
                firstname: user.firstname,
                state: user.state,
                email: user.email,
                mobile_no: user.mobile_no,
                username: user.username,
                main_balance: user.main_balance,
                bonus: user.bonus
            }
        });
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ success: false, msg: 'Error fetching user' });
    }
});

// Authenticate user
router.post('/authenticate', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('Authentication attempt for user:', username);
        
        // Convert username to lowercase for case-insensitive comparison
        const lowercaseUsername = username.toLowerCase();
        
        // Find user by username (case insensitive)
        const user = await User.findOne({ 
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('username')),
                lowercaseUsername
            )
        });
        
        if (!user) {
            console.log('Authentication failed: User not found');
            return res.status(401).json({ success: false, msg: 'User not found' });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Authentication failed: Incorrect password');
            return res.status(401).json({ success: false, msg: 'Incorrect password' });
        }
        
        // User authenticated, create token
        const token = jwt.sign({
            data: {
                _id: user.id,
                username: user.username,
                email: user.email
            }
        }, config.secret, {
            expiresIn: 604800 // 1 week
        });
        
        console.log('Authentication successful for user:', user.username);
        
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
                bonus: user.bonus
            }
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ success: false, msg: 'Authentication failed' });
    }
});

module.exports = router; 