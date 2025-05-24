const express = require('express');
const router = express.Router();

// Basic route to check if the endpoint is working
router.get('/', (req, res) => {
    res.json({ success: true, msg: 'Transfer recipients endpoint is working' });
});

module.exports = router; 