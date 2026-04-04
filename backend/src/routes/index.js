const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { verifyCsrfToken } = require('../middleware/csrf');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');

const auth    = require('../controllers/authController');
const product = require('../controllers/productController');
const cart    = require('../controllers/cartController');
const order   = require('../controllers/orderController');
const vendor  = require('../controllers/vendorController');
const address = require('../controllers/addressController');
const payment = require('../controllers/paymentController');
const upload  = require('../controllers/uploadController');
const search  = require('../controllers/searchController');
const chat    = require('../controllers/chatController');
const { uploadSingle: uploadVisual } = require('../middleware/upload');

// ── AUTH ─────────────────────────────────────────────────────────────────────
router.post('/auth/register',         auth.register);
router.post('/auth/login',            auth.login);
router.post('/auth/google',           auth.googleAuth);
router.post('/auth/forgot-password',  auth.forgotPassword);
router.post('/auth/reset-password',   auth.resetPassword);
router.post('/auth/logout',           auth.logout);
router.get ('/auth/me',               authenticate, auth.getMe);
router.put ('/auth/profile',          authenticate, auth.updateProfile);
router.post('/auth/change-password',  authenticate, auth.changePassword);

// ── PRODUCTS (specific routes BEFORE /:slug) ─────────────────────────────────
router.get ('/products/categories',   product.getCategories);
router.get ('/products',              product.getProducts);
router.get ('/products/:slug',        product.getProduct);
router.post('/products',              authenticate, requireRole('vendor','admin'), product.createProduct);
router.put ('/products/:id',          authenticate, requireRole('vendor','admin'), product.updateProduct);
router.delete('/products/:id',        authenticate, requireRole('vendor','admin'), product.deleteProduct);
router.post('/products/:id/reviews',  authenticate, product.addReview);

// ── CART ─────────────────────────────────────────────────────────────────────
router.get   ('/cart',                authenticate, cart.getCart);
router.post  ('/cart/items',          authenticate, cart.addToCart);
router.put   ('/cart/items/:itemId',  authenticate, cart.updateCartItem);
router.delete('/cart/items/:itemId',  authenticate, cart.removeCartItem);
router.delete('/cart',                authenticate, cart.clearCart);

// ── ORDERS (specific before /:id) ────────────────────────────────────────────
router.post('/orders/checkout',       authenticate, order.checkout);
router.get ('/orders/all',            authenticate, requireRole('admin'), order.getAllOrders);
router.get ('/orders',                authenticate, order.getOrders);
router.get ('/orders/:id',            authenticate, order.getOrder);
router.put ('/orders/:id/cancel',     authenticate, order.cancelOrder);
router.put ('/orders/:id/status',     authenticate, requireRole('admin','vendor'), order.updateOrderStatus);

// ── PAYMENTS ─────────────────────────────────────────────────────────────────
router.post('/payments/initiate',           authenticate, payment.initiatePayment);
router.get ('/payments/status/:transactionId', authenticate, payment.checkPaymentStatus);
router.post('/payments/momo/callback',      payment.momoCallback);   // MTN webhook (no auth)
router.post('/payments/orange/callback',    payment.orangeCallback); // Orange webhook (no auth)

// ── FILE UPLOAD ───────────────────────────────────────────────────────────────
router.post('/upload/image',   authenticate, uploadSingle,   handleUploadError, upload.uploadImage);
router.post('/upload/images',  authenticate, uploadMultiple, handleUploadError, upload.uploadImages);
router.delete('/upload/:filename', authenticate, requireRole('vendor','admin'), upload.deleteImage);

// ── VISUAL SEARCH ────────────────────────────────────────────────────────────
// POST with image upload — public (works without login for casual shoppers)
router.post('/search/visual',           uploadVisual, search.visualSearch);
router.post('/search/index/:productId', authenticate, requireRole('vendor','admin'), search.indexProduct);
router.post('/search/index-all',        authenticate, requireRole('admin'), search.indexAllProducts);
router.get ('/search/stats',            authenticate, requireRole('admin'), search.getSearchStats);

// ── CHAT ─────────────────────────────────────────────────────────────────────
router.get ('/chats',                    authenticate, chat.getMyChats);
router.get ('/chats/vendor-inbox',       authenticate, requireRole('vendor','admin'), chat.getVendorInbox);
router.get ('/chats/:vendorId',          authenticate, chat.getChat);
router.post('/chats/:vendorId/messages', authenticate, chat.sendMessage);

// ── VENDORS (specific before /:id) ───────────────────────────────────────────
router.post('/vendors/register',      authenticate, vendor.registerVendor);
router.get ('/vendors/profile',       authenticate, requireRole('vendor','admin'), vendor.getVendorProfile);
router.put ('/vendors/profile',       authenticate, requireRole('vendor','admin'), vendor.updateVendorProfile);
router.get ('/vendors/dashboard',     authenticate, requireRole('vendor','admin'), vendor.getDashboard);
router.get ('/vendors/products',      authenticate, requireRole('vendor','admin'), vendor.getVendorProducts);
router.get ('/vendors/:id',           vendor.getPublicVendor);

// ── ADDRESSES ────────────────────────────────────────────────────────────────
router.get   ('/delivery-zones',      address.getDeliveryZones);
router.get   ('/addresses',           authenticate, address.getAddresses);
router.post  ('/addresses',           authenticate, address.addAddress);
router.put   ('/addresses/:id',       authenticate, address.updateAddress);
router.delete('/addresses/:id',       authenticate, address.deleteAddress);

module.exports = router;
