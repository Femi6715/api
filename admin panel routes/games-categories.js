const express = require('express');
const router = express.Router();
const passport = require('passport');
const GameCategory = require('../models/mysql/game_category');

// Get all categories
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const categories = await GameCategory.findAll();
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, msg: 'Failed to get categories' });
    }
});

// Add new category
router.post('/add', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { name, description } = req.body;

        const category = await GameCategory.create({
            name,
            description
        });

        res.json({
            success: true,
            msg: 'Category added successfully',
            category
        });
    } catch (error) {
        console.error('Add category error:', error);
        res.status(500).json({ success: false, msg: 'Failed to add category' });
    }
});

module.exports = router;