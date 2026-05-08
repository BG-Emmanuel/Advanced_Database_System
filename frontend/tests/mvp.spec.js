const { test, expect } = require('@playwright/test');

const API_BASE = process.env.API_BASE || 'http://localhost:8081/api';

const uniqueEmail = () => `testuser_${Date.now()}@buy237.local`;

async function createProduct(request) {
  const slug = `test-product-${Date.now()}`;
  const payload = {
    name: 'Test Product',
    description: 'Playwright created product',
    price: 12345,
    sale: 9999,
    category: 'electronics',
    slug,
  };
  const res = await request.post(`${API_BASE}/products`, { data: payload });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return { slug, id: body.id };
}

test.describe('Buy237 MVP UI', () => {
  test('home page renders core sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Deals of the Day')).toBeVisible();
    await expect(page.locator('.product-card').first()).toBeVisible();
  });

  test('search page loads products', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByText('Filters')).toBeVisible();
    await expect(page.locator('.product-card').first()).toBeVisible();
  });

  test('product detail page renders', async ({ page }) => {
    await page.goto('/');
    await page.locator('.product-card a').first().click();
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible();
  });
});

test.describe('Buy237 MVP API', () => {
  test('auth register and login', async ({ request }) => {
    const email = uniqueEmail();
    const password = 'Passw0rd!';
    const register = await request.post(`${API_BASE}/auth/register`, {
      data: { email, password, name: 'Playwright User' },
    });
    expect(register.ok()).toBeTruthy();
    const regBody = await register.json();
    expect(regBody.token).toBeTruthy();

    const login = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password },
    });
    expect(login.ok()).toBeTruthy();
    const loginBody = await login.json();
    expect(loginBody.token).toBeTruthy();
  });

  test('products CRUD basic', async ({ request }) => {
    const { slug, id } = await createProduct(request);

    const get = await request.get(`${API_BASE}/products/${slug}`);
    expect(get.ok()).toBeTruthy();
    const product = await get.json();
    expect(product.slug).toBe(slug);

    const del = await request.delete(`${API_BASE}/products/${id}`);
    expect([200, 204]).toContain(del.status());
  });
});
