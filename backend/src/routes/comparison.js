const express = require('express');
const router = express.Router();
const comparisonService = require('../services/comparisonService');

router.post('/compare', async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || productIds.length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide at least 2 products to compare' });
    }
    if (productIds.length > 4) {
      return res.status(400).json({ success: false, message: 'Cannot compare more than 4 products at once' });
    }
    const comparison = await comparisonService.compareProducts(productIds);
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/summary', async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || productIds.length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide at least 2 products' });
    }
    const summary = await comparisonService.getComparisonSummary(productIds);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/similar/:productId', async (req, res) => {
  try {
    const { limit = 4 } = req.query;
    const products = await comparisonService.getSimilarProductsForComparison(
      req.params.productId,
      parseInt(limit)
    );
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
