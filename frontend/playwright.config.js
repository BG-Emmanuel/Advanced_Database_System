// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
