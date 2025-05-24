const express = require('express');
const router = express.Router();
const passport = require('passport');
const TransferRecipient = require('../models/mysql/transfer_recipient');
const User = require('../models/mysql/user');

// Get user's transfer recipients
router.get('/user/:userId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const recipients = await TransferRecipient.findAll({
            where: { user_id: req.params.userId }
        });
        res.json({ success: true, recipients });
    } catch (error) {
        console.error('Get recipients error:', error);
        res.status(500).json({ success: false, msg: 'Failed to get recipients' });
    }
});

// Add new transfer recipient
router.post('/add', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { recipient_code, bank_code, account_number, account_name } = req.body;

        const recipient = await TransferRecipient.create({
            user_id: req.user.id,
            recipient_code,
            bank_code,
            account_number,
            account_name
        });

        res.json({
            success: true,
            msg: 'Transfer recipient added successfully',
            recipient
        });
    } catch (error) {
        console.error('Add recipient error:', error);
        res.status(500).json({ success: false, msg: 'Failed to add recipient' });
    }
});

// Delete transfer recipient
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const recipient = await TransferRecipient.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        if (!recipient) {
            return res.json({ success: false, msg: 'Recipient not found' });
        }

        await recipient.destroy();

        res.json({
            success: true,
            msg: 'Transfer recipient deleted successfully'
        });
    } catch (error) {
        console.error('Delete recipient error:', error);
        res.status(500).json({ success: false, msg: 'Failed to delete recipient' });
    }
});

module.exports = router;
