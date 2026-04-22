const express = require('express');
const router = express.Router();
const flashSaleService = require('../services/flashSaleService');

router.get('/active', async (req, res) => {
  try {
    const sales = await flashSaleService.getActiveFlashSales();
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/upcoming', async (req, res) => {
  try {
    const sales = await flashSaleService.getUpcomingFlashSales();
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { productId, salePrice, startTime, endTime, maxQuantity } = req.body;
    const sale = await flashSaleService.createFlashSale(
      productId, salePrice, startTime, endTime, maxQuantity
    );
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/purchase', async (req, res) => {
  try {
    const { flashSaleId, quantity } = req.body;
    const sale = await flashSaleService.purchaseFlashSaleItem(flashSaleId, quantity);
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:flashSaleId/end', async (req, res) => {
  try {
    const sale = await flashSaleService.endFlashSale(req.params.flashSaleId);
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
