const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryService');

router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const inventory = await inventoryService.getInventory(req.params.vendorId);
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/vendor/:vendorId/low-stock', async (req, res) => {
  try {
    const { threshold = 5 } = req.query;
    const products = await inventoryService.getLowStockProducts(req.params.vendorId, parseInt(threshold));
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/vendor/:vendorId/out-of-stock', async (req, res) => {
  try {
    const products = await inventoryService.getOutOfStockProducts(req.params.vendorId);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/update-stock/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await inventoryService.updateStock(req.params.productId, quantity);
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/restock/:productId', async (req, res) => {
  try {
    const { addQuantity } = req.body;
    const product = await inventoryService.restockProduct(req.params.productId, addQuantity);
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
