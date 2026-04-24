const express = require('express');
const router = express.Router();
const reviewService = require('../services/reviewService');

router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await reviewService.getProductReviews(req.params.productId);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/product/:productId/summary', async (req, res) => {
  try {
    const summary = await reviewService.getProductRatingSummary(req.params.productId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await reviewService.getUserReviews(req.params.userId);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { userId, productId, rating, comment } = req.body;
    const review = await reviewService.addReview(userId, productId, rating, comment);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:reviewId', async (req, res) => {
  try {
    const { userId } = req.body;
    const review = await reviewService.deleteReview(req.params.reviewId, userId);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
