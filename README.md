# Advanced Database System - Buy237 E-Commerce Platform

## ?? Features Added by TIM

### Backend Features
1. **Wishlist Management** - Users can save products for later
2. **Coupon/Discount System** - Create and apply discount coupons
3. **Notification System** - Real-time user notifications
4. **Inventory Management** - Track and manage product stock
5. **Product Reviews & Ratings** - Submit and view product reviews
6. **Order Tracking** - Track order status in real-time
7. **Product Comparison** - Compare up to 4 products side by side
8. **Flash Sales** - Limited time deals with countdown timers
9. **Product Recommendations** - Personalized product suggestions
10. **Search Analytics** - Track and analyze search patterns
11. **Loyalty Points** - Reward customers with points

### Frontend Components
- Wishlist.jsx - Wishlist management UI
- Notifications.jsx - Notification bell with dropdown
- FlashSales.jsx - Flash sales with countdown timers
- ProductComparison.jsx - Side by side product comparison
- OrderTracking.jsx - Order status tracker
- CouponValidator.jsx - Coupon code input and validation
- ProductReviews.jsx - Reviews with star ratings
- InventoryDashboard.jsx - Vendor inventory management

### Database
- newFeatures.sql - SQL tables for all new features

## ??? Tech Stack
- Backend: Node.js, Express.js
- Frontend: React.js
- Database: PostgreSQL (Supabase)

## ?? Installation

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## ?? API Endpoints

### Wishlist
- GET /api/wishlist/:userId
- POST /api/wishlist/add
- DELETE /api/wishlist/remove

### Coupons
- POST /api/coupons/create
- POST /api/coupons/validate
- POST /api/coupons/apply
- GET /api/coupons/all

### Notifications
- GET /api/notifications/:userId
- GET /api/notifications/:userId/unread-count
- POST /api/notifications/create
- PUT /api/notifications/:id/read
- PUT /api/notifications/:userId/read-all
- DELETE /api/notifications/:id

### Inventory
- GET /api/inventory/vendor/:vendorId
- GET /api/inventory/vendor/:vendorId/low-stock
- GET /api/inventory/vendor/:vendorId/out-of-stock
- PUT /api/inventory/update-stock/:productId
- PUT /api/inventory/restock/:productId

### Reviews
- GET /api/reviews/product/:productId
- GET /api/reviews/product/:productId/summary
- POST /api/reviews/add
- DELETE /api/reviews/:reviewId

### Order Tracking
- GET /api/order-tracking/:orderId/status
- GET /api/order-tracking/user/:userId
- GET /api/order-tracking/user/:userId/history
- PUT /api/order-tracking/:orderId/update-status
- PUT /api/order-tracking/:orderId/cancel

### Comparison
- POST /api/comparison/compare
- POST /api/comparison/summary
- GET /api/comparison/similar/:productId

### Flash Sales
- GET /api/flash-sales/active
- GET /api/flash-sales/upcoming
- POST /api/flash-sales/create
- POST /api/flash-sales/purchase
- PUT /api/flash-sales/:id/end
