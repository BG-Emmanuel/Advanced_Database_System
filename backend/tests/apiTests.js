/**
 * Buy237 E-Commerce Platform - API Test Suite
 * This script performs comprehensive tests on all API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true, // Don't throw on any status code
});

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
let testResults = [];

// Helper functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🧪'
  }[type] || type;
  console.log(`[${timestamp}] ${prefix} ${message}`);
};

const assert = (condition, message) => {
  if (condition) {
    testsPassed++;
    testResults.push({ status: 'PASS', message });
    log(`PASS: ${message}`, 'success');
  } else {
    testsFailed++;
    testResults.push({ status: 'FAIL', message });
    log(`FAIL: ${message}`, 'error');
  }
};

const testEndpoint = async (method, endpoint, data = null, expectedStatus = 200, shouldHaveData = true) => {
  try {
    let response;
    if (method === 'GET') {
      response = await API.get(endpoint);
    } else if (method === 'POST') {
      response = await API.post(endpoint, data);
    } else if (method === 'PUT') {
      response = await API.put(endpoint, data);
    } else if (method === 'DELETE') {
      response = await API.delete(endpoint);
    }

    assert(
      response.status === expectedStatus,
      `${method} ${endpoint} returned status ${response.status} (expected ${expectedStatus})`
    );

    if (shouldHaveData) {
      assert(response.data !== null, `${method} ${endpoint} returned data`);
    }

    return response;
  } catch (error) {
    assert(false, `${method} ${endpoint} threw error: ${error.message}`);
    return null;
  }
};

// ────────────────────────────────────────────────────────────────────────────
// TEST SUITES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Test 1: Health Check
 */
const testHealthCheck = async () => {
  log('Starting Health Check Tests', 'test');
  const response = await testEndpoint('GET', '/health', null, 200, false);
  return response ? response.data : null;
};

/**
 * Test 2: Authentication Endpoints
 */
const testAuthentication = async () => {
  log('Starting Authentication Tests', 'test');

  // Test bad register (missing fields)
  await testEndpoint('POST', '/api/auth/register', {}, 400, false);

  // Test login with bad credentials
  await testEndpoint('POST', '/api/auth/login', {
    email: 'nonexistent@test.com',
    password: 'wrongpassword'
  }, 401, false);

  log('Authentication tests completed', 'info');
};

/**
 * Test 3: Products Endpoints
 */
const testProducts = async () => {
  log('Starting Product Tests', 'test');

  // Get categories
  await testEndpoint('GET', '/api/products/categories', null, 200, true);

  // Get all products with pagination
  await testEndpoint('GET', '/api/products?page=1&limit=10', null, 200, true);

  // Get single product (testing with a likely valid slug)
  await testEndpoint('GET', '/api/products/test-product', null, 404, false);

  log('Product tests completed', 'info');
};

/**
 * Test 4: Cart Endpoints (requires auth)
 */
const testCart = async (token) => {
  log('Starting Cart Tests', 'test');

  if (!token) {
    log('No auth token provided, skipping cart tests', 'warning');
    return;
  }

  try {
    // Get cart
    const response = await API.get('/api/cart', {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(response.status === 200, 'GET /api/cart returns 200');

    log('Cart tests completed', 'info');
  } catch (error) {
    log(`Cart test error: ${error.message}`, 'error');
  }
};

/**
 * Test 5: New Features - Wishlist
 */
const testWishlist = async () => {
  log('Starting Wishlist Tests', 'test');

  // Test without auth (should fail)
  await testEndpoint('GET', '/api/wishlist', null, 401, false);

  log('Wishlist tests completed', 'info');
};

/**
 * Test 6: New Features - Coupons
 */
const testCoupons = async () => {
  log('Starting Coupon Tests', 'test');

  // Get coupons (public endpoint)
  await testEndpoint('GET', '/api/coupons', null, 200, true);

  log('Coupon tests completed', 'info');
};

/**
 * Test 7: New Features - Notifications
 */
const testNotifications = async () => {
  log('Starting Notification Tests', 'test');

  // Test without auth (should fail)
  await testEndpoint('GET', '/api/notifications', null, 401, false);

  log('Notification tests completed', 'info');
};

/**
 * Test 8: New Features - Flash Sales
 */
const testFlashSales = async () => {
  log('Starting Flash Sales Tests', 'test');

  // Get active flash sales
  await testEndpoint('GET', '/api/flash-sales/active', null, 200, true);

  log('Flash sales tests completed', 'info');
};

/**
 * Test 9: New Features - Order Tracking
 */
const testOrderTracking = async () => {
  log('Starting Order Tracking Tests', 'test');

  // Get order tracking (requires valid order ID and auth)
  await testEndpoint('GET', '/api/order-tracking/invalid-id', null, 401, false);

  log('Order tracking tests completed', 'info');
};

/**
 * Test 10: New Features - Comparison
 */
const testComparison = async () => {
  log('Starting Product Comparison Tests', 'test');

  // Get comparison data
  await testEndpoint('POST', '/api/comparison/compare', {
    productIds: []
  }, 400, false);

  log('Comparison tests completed', 'info');
};

/**
 * Test 11: New Features - Reviews
 */
const testReviews = async () => {
  log('Starting Product Reviews Tests', 'test');

  // Get reviews without auth
  await testEndpoint('GET', '/api/reviews/product/test-id', null, 200, true);

  log('Reviews tests completed', 'info');
};

/**
 * Test 12: New Features - Recommendations
 */
const testRecommendations = async () => {
  log('Starting Recommendations Tests', 'test');

  // Get recommendations
  await testEndpoint('GET', '/api/recommendations/suggested', null, 200, true);

  log('Recommendations tests completed', 'info');
};

/**
 * Test 13: Search Analytics
 */
const testAnalytics = async () => {
  log('Starting Analytics Tests', 'test');

  // Get analytics (requires admin auth)
  await testEndpoint('GET', '/api/analytics/stats', null, 401, false);

  log('Analytics tests completed', 'info');
};

/**
 * Test 14: Inventory Management
 */
const testInventory = async () => {
  log('Starting Inventory Tests', 'test');

  // Get inventory (requires vendor/admin auth)
  await testEndpoint('GET', '/api/inventory', null, 401, false);

  log('Inventory tests completed', 'info');
};

/**
 * Test 15: Search Functionality
 */
const testSearch = async () => {
  log('Starting Search Tests', 'test');

  // Search products
  await testEndpoint('GET', '/api/products?search=laptop', null, 200, true);

  log('Search tests completed', 'info');
};

// ────────────────────────────────────────────────────────────────────────────
// MAIN TEST RUNNER
// ────────────────────────────────────────────────────────────────────────────

const runAllTests = async () => {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('🚀 BUY237 E-COMMERCE PLATFORM - API TEST SUITE');
  console.log('═'.repeat(80));
  console.log('\n');

  try {
    // Health check
    await testHealthCheck();
    console.log('\n');

    // Auth tests
    await testAuthentication();
    console.log('\n');

    // Product tests
    await testProducts();
    console.log('\n');

    // New feature tests
    await testWishlist();
    console.log('\n');

    await testCoupons();
    console.log('\n');

    await testNotifications();
    console.log('\n');

    await testFlashSales();
    console.log('\n');

    await testOrderTracking();
    console.log('\n');

    await testComparison();
    console.log('\n');

    await testReviews();
    console.log('\n');

    await testRecommendations();
    console.log('\n');

    await testAnalytics();
    console.log('\n');

    await testInventory();
    console.log('\n');

    await testSearch();
    console.log('\n');

    // Cart tests (would need actual token)
    await testCart(null);

    // Summary
    console.log('═'.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(80));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Total: ${testsPassed + testsFailed}`);
    console.log(`📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);
    console.log('═'.repeat(80));
    console.log('\n');

  } catch (error) {
    log(`Test suite error: ${error.message}`, 'error');
  }
};

// Run tests
runAllTests();
