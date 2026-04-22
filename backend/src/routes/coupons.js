const express = require('express');
const router = express.Router();
const couponService = require('../services/couponService');

router.post('/create', async (req, res) => {
  try {
    const { code, discountPercent, maxUses, expiresAt } = req.body;
    const coupon = await couponService.createCoupon(code, discountPercent, maxUses, expiresAt);
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await couponService.validateCoupon(code);
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/apply', async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await couponService.applyCoupon(code);
    res.json({ success: true, data: coupon, discount: coupon.discount_percent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const coupons = await couponService.getAllCoupons();
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
