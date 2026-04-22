const express = require('express');
const router = express.Router();
const wishlistService = require('../services/wishlistService');

router.get('/:userId', async (req, res) => {
  try {
    const items = await wishlistService.getUserWishlist(req.params.userId);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const item = await wishlistService.addToWishlist(userId, productId);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/remove', async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const item = await wishlistService.removeFromWishlist(userId, productId);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
