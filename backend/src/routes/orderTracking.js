const express = require('express');
const router = express.Router();
const orderTrackingService = require('../services/orderTrackingService');

router.get('/:orderId/status', async (req, res) => {
  try {
    const order = await orderTrackingService.getOrderStatus(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await orderTrackingService.getUserOrders(req.params.userId);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/user/:userId/history', async (req, res) => {
  try {
    const history = await orderTrackingService.getOrderHistory(req.params.userId);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:orderId/update-status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await orderTrackingService.updateOrderStatus(req.params.orderId, status);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:orderId/cancel', async (req, res) => {
  try {
    const { userId } = req.body;
    const order = await orderTrackingService.cancelOrder(req.params.orderId, userId);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
