const express = require('express');
const router = express.Router();
const passport = require('passport');

// Import admin routes
const users = require('./users');
const games = require('./games');
const transactions = require('./transactions');
const tickets = require('./tickets');

// Admin authentication middleware
const adminAuth = passport.authenticate('jwt', { session: false });

// Mount admin routes
router.use('/users', adminAuth, users);
router.use('/games', adminAuth, games);
router.use('/transactions', adminAuth, transactions);
router.use('/tickets', adminAuth, tickets);

module.exports = router; 