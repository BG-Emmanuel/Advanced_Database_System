const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// TIM - Test Routes
const wishlistRoutes       = require('./backend/src/routes/wishlist');
const couponRoutes         = require('./backend/src/routes/coupons');
const notificationRoutes   = require('./backend/src/routes/notifications');
const inventoryRoutes      = require('./backend/src/routes/inventory');
const reviewRoutes         = require('./backend/src/routes/reviews');
const orderTrackingRoutes  = require('./backend/src/routes/orderTracking');
const comparisonRoutes     = require('./backend/src/routes/comparison');
const flashSaleRoutes      = require('./backend/src/routes/flashSales');
const recommendationRoutes = require('./backend/src/routes/recommendations');
const analyticsRoutes      = require('./backend/src/routes/analytics');

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TIM Test Server Running!',
    features: [
      'Wishlist Management',
      'Coupon System',
      'Notifications',
      'Inventory Management',
      'Product Reviews',
      'Order Tracking',
      'Product Comparison',
      'Flash Sales',
      'Recommendations',
      'Analytics'
    ]
  });
});

app.use('/api/wishlist',        wishlistRoutes);
app.use('/api/coupons',         couponRoutes);
app.use('/api/notifications',   notificationRoutes);
app.use('/api/inventory',       inventoryRoutes);
app.use('/api/reviews',         reviewRoutes);
app.use('/api/order-tracking',  orderTrackingRoutes);
app.use('/api/comparison',      comparisonRoutes);
app.use('/api/flash-sales',     flashSaleRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics',       analyticsRoutes);

app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, () => {
  console.log('');
  console.log('?? TIM Test Server running on port ' + PORT);
  console.log('?? Health check: http://localhost:' + PORT + '/health');
  console.log('');
  console.log('?? Available endpoints:');
  console.log('   GET  http://localhost:' + PORT + '/api/wishlist/:userId');
  console.log('   GET  http://localhost:' + PORT + '/api/notifications/:userId');
  console.log('   GET  http://localhost:' + PORT + '/api/flash-sales/active');
  console.log('   GET  http://localhost:' + PORT + '/api/flash-sales/upcoming');
  console.log('   GET  http://localhost:' + PORT + '/api/recommendations/trending');
  console.log('   GET  http://localhost:' + PORT + '/api/coupons/all');
  console.log('   GET  http://localhost:' + PORT + '/api/analytics/top-products');
  console.log('');
});

module.exports = app;
