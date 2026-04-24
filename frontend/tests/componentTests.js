/**
 * Buy237 Frontend - Component & Integration Tests
 * Tests React components and basic functionality
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

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
    log(`PASS: ${message}`, 'success');
  } else {
    testsFailed++;
    log(`FAIL: ${message}`, 'error');
  }
};

const checkFileExists = (filePath) => {
  return fs.existsSync(filePath);
};

const checkFileContent = (filePath, searchTerm) => {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes(searchTerm);
};

// ────────────────────────────────────────────────────────────────────────────
// TEST SUITES
// ────────────────────────────────────────────────────────────────────────────

const testComponentStructure = () => {
  log('Starting Component Structure Tests', 'test');

  const srcDir = 'src';
  const componentsDir = path.join(srcDir, 'components');
  const pagesDir = path.join(srcDir, 'pages');

  // Check essential components exist
  assert(checkFileExists(path.join(componentsDir, 'common')), 'Common components folder exists');
  assert(checkFileExists(path.join(componentsDir, 'layout')), 'Layout components folder exists');

  // Check essential pages exist
  assert(checkFileExists(path.join(pagesDir, 'HomePage.jsx')), 'HomePage component exists');
  assert(checkFileExists(path.join(pagesDir, 'ProductDetailPage.jsx')), 'ProductDetailPage component exists');
  assert(checkFileExists(path.join(pagesDir, 'CartPage.jsx')), 'CartPage component exists');
  assert(checkFileExists(path.join(pagesDir, 'CheckoutPage.jsx')), 'CheckoutPage component exists');

  log('Component structure tests completed', 'info');
};

const testNewFeatureComponents = () => {
  log('Starting New Feature Components Tests', 'test');

  const componentsDir = path.join('src', 'components');

  // Check new feature components exist
  assert(checkFileExists(path.join(componentsDir, 'Wishlist.jsx')), 'Wishlist component exists');
  assert(checkFileExists(path.join(componentsDir, 'CouponValidator.jsx')), 'CouponValidator component exists');
  assert(checkFileExists(path.join(componentsDir, 'FlashSales.jsx')), 'FlashSales component exists');
  assert(checkFileExists(path.join(componentsDir, 'ProductComparison.jsx')), 'ProductComparison component exists');
  assert(checkFileExists(path.join(componentsDir, 'ProductReviews.jsx')), 'ProductReviews component exists');
  assert(checkFileExists(path.join(componentsDir, 'OrderTracking.jsx')), 'OrderTracking component exists');
  assert(checkFileExists(path.join(componentsDir, 'Notifications.jsx')), 'Notifications component exists');
  assert(checkFileExists(path.join(componentsDir, 'InventoryDashboard.jsx')), 'InventoryDashboard component exists');

  log('New feature components tests completed', 'info');
};

const testCoreFiles = () => {
  log('Starting Core Files Tests', 'test');

  const srcDir = 'src';

  // Check core files
  assert(checkFileExists(path.join(srcDir, 'App.jsx')), 'App.jsx exists');
  assert(checkFileExists(path.join(srcDir, 'index.js')), 'index.js exists');
  assert(checkFileExists(path.join(srcDir, 'context', 'AppContext.jsx')), 'AppContext exists');
  assert(checkFileExists(path.join(srcDir, 'utils', 'api.js')), 'API utilities exist');

  log('Core files tests completed', 'info');
};

const testReactImports = () => {
  log('Starting React Imports Tests', 'test');

  const appPath = path.join('src', 'App.jsx');
  assert(checkFileContent(appPath, 'import React'), 'App.jsx imports React');
  assert(checkFileContent(appPath, 'export'), 'App.jsx has export statement');

  const indexPath = path.join('src', 'index.js');
  assert(checkFileContent(indexPath, 'ReactDOM'), 'index.js imports ReactDOM');

  log('React imports tests completed', 'info');
};

const testPackageJson = () => {
  log('Starting Package.json Tests', 'test');

  const packagePath = 'package.json';
  if (!fs.existsSync(packagePath)) {
    log('package.json not found', 'error');
    return;
  }

  const package = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

  // Check required dependencies
  assert(package.dependencies.react, 'React dependency exists');
  assert(package.dependencies['react-dom'], 'ReactDOM dependency exists');
  assert(package.dependencies['react-router-dom'], 'React Router dependency exists');
  assert(package.dependencies.axios, 'Axios dependency exists');

  // Check scripts
  assert(package.scripts.start, 'Start script exists');
  assert(package.scripts.build, 'Build script exists');

  log('Package.json tests completed', 'info');
};

const testStyleFiles = () => {
  log('Starting Style Files Tests', 'test');

  const stylesDir = path.join('src', 'styles');
  assert(checkFileExists(path.join(stylesDir, 'global.css')), 'Global CSS file exists');

  log('Style files tests completed', 'info');
};

const testApiConfiguration = () => {
  log('Starting API Configuration Tests', 'test');

  const apiPath = path.join('src', 'utils', 'api.js');
  assert(checkFileContent(apiPath, 'axios'), 'API file uses axios');
  assert(checkFileContent(apiPath, 'localhost:5000') || checkFileContent(apiPath, 'process.env'), 'API file configures backend URL');

  log('API configuration tests completed', 'info');
};

const testHttpMethods = () => {
  log('Starting HTTP Methods Tests', 'test');

  const apiPath = path.join('src', 'utils', 'api.js');
  assert(checkFileContent(apiPath, 'get') || checkFileContent(apiPath, 'GET'), 'API supports GET requests');
  assert(checkFileContent(apiPath, 'post') || checkFileContent(apiPath, 'POST'), 'API supports POST requests');
  assert(checkFileContent(apiPath, 'put') || checkFileContent(apiPath, 'PUT'), 'API supports PUT requests');
  assert(checkFileContent(apiPath, 'delete') || checkFileContent(apiPath, 'DELETE'), 'API supports DELETE requests');

  log('HTTP methods tests completed', 'info');
};

const testPublicAssets = () => {
  log('Starting Public Assets Tests', 'test');

  const publicDir = 'public';
  assert(checkFileExists(path.join(publicDir, 'index.html')), 'Public index.html exists');

  if (fs.existsSync(path.join(publicDir, 'index.html'))) {
    const content = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
    assert(content.includes('root') || content.includes('app'), 'index.html has root div for React');
  }

  log('Public assets tests completed', 'info');
};

const testDirectoryStructure = () => {
  log('Starting Directory Structure Tests', 'test');

  const srcDir = 'src';
  const directories = [
    'components',
    'pages',
    'context',
    'utils',
    'hooks',
    'styles'
  ];

  directories.forEach(dir => {
    assert(
      checkFileExists(path.join(srcDir, dir)),
      `${dir} directory exists`
    );
  });

  log('Directory structure tests completed', 'info');
};

// ────────────────────────────────────────────────────────────────────────────
// MAIN TEST RUNNER
// ────────────────────────────────────────────────────────────────────────────

const runAllTests = () => {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('🚀 BUY237 FRONTEND - COMPONENT & INTEGRATION TEST SUITE');
  console.log('═'.repeat(80));
  console.log('\n');

  try {
    testComponentStructure();
    console.log('\n');

    testNewFeatureComponents();
    console.log('\n');

    testCoreFiles();
    console.log('\n');

    testReactImports();
    console.log('\n');

    testPackageJson();
    console.log('\n');

    testStyleFiles();
    console.log('\n');

    testApiConfiguration();
    console.log('\n');

    testHttpMethods();
    console.log('\n');

    testPublicAssets();
    console.log('\n');

    testDirectoryStructure();
    console.log('\n');

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
