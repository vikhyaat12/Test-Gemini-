import { test, expect, type Page } from '@playwright/test';

const productSlug = '/products/lumine-c-serum';
const CART_KEY = 'qc_cart_v1';

/**
 * Resets localStorage cart to a known state.
 * Run this at the start of every test to avoid cross-test contamination.
 */
async function resetCart(page: Page) {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.removeItem('qc_cart_v1'));
}

/** Adds the Lumine-C Serum to the cart from its product page. */
async function addLumine(page: Page) {
  await page.goto(productSlug);
  await page.locator('button:has-text("Add to bag")').first().click();
  await page.waitForFunction((key) => !!window.localStorage.getItem(key), CART_KEY);
}

test('1. Cart: add item, update quantity, see totals', async ({ page }) => {
  await resetCart(page);
  await addLumine(page);

  // Navigate to cart
  await page.goto('/cart');

  // Item should appear in the bag
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await expect(page.locator('.cart-item-info b')).toHaveText(/Lumine/i);

  // Increase quantity to 2
  await page.locator('button[aria-label="Increase quantity"]').click();
  await expect(page.locator('.cart-qty span')).toHaveText('2');
  await expect(page.locator('.cart-item-right em')).toHaveText('₹2,980');
  await expect(page.locator('.cart-total b')).toHaveText('₹2,980');

  // Decrease back to 1
  await page.locator('button[aria-label="Decrease quantity"]').click();
  await expect(page.locator('.cart-qty span')).toHaveText('1');
  await expect(page.locator('.cart-total b')).toHaveText('₹1,589');
});

test('2. Cart: shipping fee applies under ₹1,500 and free delivery above', async ({ page }) => {
  await resetCart(page);
  await addLumine(page); // ₹1,490

  await page.goto('/cart');
  // Under ₹1,500 → ₹99 shipping
  await expect(page.locator('.cart-totals div').nth(1)).toContainText('₹99');
  await expect(page.locator('.cart-total b')).toHaveText('₹1,589');

  // Increase to 2 → ₹2,980 → free shipping
  await page.locator('button[aria-label="Increase quantity"]').click();
  await expect(page.locator('.cart-totals div').nth(1)).toContainText('Free');
  await expect(page.locator('.cart-total b')).toHaveText('₹2,980');
});

test('3. Empty cart: shows empty state and CTA', async ({ page }) => {
  await resetCart(page);
  await page.goto('/cart');

  await expect(page.locator('.cart-empty')).toBeVisible();
  await expect(page.locator('.cart-empty h2')).toHaveText('Your care bag is empty.');
  await expect(page.locator('a:has-text("Explore the collection")')).toBeVisible();

  // Checkout should also show the empty-bag state
  await page.goto('/checkout');
  await expect(page.locator('.checkout-empty-bag')).toBeVisible();
});

test('4. Cart: remove item restores empty state', async ({ page }) => {
  await resetCart(page);
  await addLumine(page);

  await page.goto('/cart');
  await expect(page.locator('.cart-item')).toHaveCount(1);

  await page.locator('button[aria-label^="Remove"]').click();
  await expect(page.locator('.cart-empty')).toBeVisible();
  await expect(page.locator('.cart-item')).toHaveCount(0);
});

test('5. Checkout: validation blocks incomplete forms', async ({ page }) => {
  await resetCart(page);
  await addLumine(page);

  await page.goto('/checkout');
  await expect(page.locator('.checkout-item')).toHaveCount(1);

  // Submit empty form → validation errors appear
  await page.locator('.checkout-submit').click();
  await expect(page.locator('.checkout-field em')).toHaveCount(7);
  await expect(page.locator('.checkout-notice')).toContainText('Please fix the highlighted fields.');

  // Fill form incrementally and confirm errors clear
  await page.locator('input[placeholder="Meera Shah"]').fill('Meera Shah');
  await expect(page.locator('.checkout-field em')).toHaveCount(6);
  await page.locator('input[placeholder="you@example.com"]').fill('meera@example.com');
  await page.locator('input[placeholder="+91 98765 43210"]').fill('+91 98765 43210');
  await page.locator('input[placeholder="Flat no, building, street"]').fill('12 Orchid Avenue, Bandra West');
  await page.locator('input[placeholder="Mumbai"]').fill('Mumbai');
  await page.locator('input[placeholder="Maharashtra"]').fill('Maharashtra');
  await page.locator('input[placeholder="400001"]').fill('400001');
  await expect(page.locator('.checkout-field em')).toHaveCount(0);
});

test('6. Checkout: invalid email and pincode are rejected', async ({ page }) => {
  await resetCart(page);
  await addLumine(page);

  await page.goto('/checkout');
  await page.locator('input[placeholder="Meera Shah"]').fill('Meera Shah');
  await page.locator('input[placeholder="you@example.com"]').fill('not-an-email');
  await page.locator('input[placeholder="+91 98765 43210"]').fill('123');
  await page.locator('input[placeholder="Flat no, building, street"]').fill('12 Orchid Avenue, Bandra West');
  await page.locator('input[placeholder="Mumbai"]').fill('Mumbai');
  await page.locator('input[placeholder="Maharashtra"]').fill('Maharashtra');
  await page.locator('input[placeholder="400001"]').fill('123');

  await page.locator('.checkout-submit').click();
  await expect(page.locator('.checkout-field em').first()).toHaveText('Enter a valid email.');
  await expect(page.locator('.checkout-field em').nth(1)).toHaveText('Enter a valid phone number.');
  await expect(page.locator('.checkout-field em').nth(2)).toHaveText('Enter a valid 6-digit PIN code.');
});

test('7. Complete purchase: place order → confirmation → cart cleared', async ({ page }) => {
  await resetCart(page);
  await addLumine(page);

  await page.goto('/checkout');

  // Fill in valid shipping details
  await page.locator('input[placeholder="Meera Shah"]').fill('Meera Shah');
  await page.locator('input[placeholder="you@example.com"]').fill('meera@example.com');
  await page.locator('input[placeholder="+91 98765 43210"]').fill('+91 98765 43210');
  await page.locator('input[placeholder="Flat no, building, street"]').fill('12 Orchid Avenue, Bandra West');
  await page.locator('input[placeholder="Mumbai"]').fill('Mumbai');
  await page.locator('input[placeholder="Maharashtra"]').fill('Maharashtra');
  await page.locator('input[placeholder="400001"]').fill('400001');

  // Place the order
  await page.locator('.checkout-submit').click();

  // Confirmation screen appears
  await expect(page.locator('.checkout-success')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.checkout-success h1')).toContainText('Meera');
  await expect(page.locator('.checkout-success-sub')).toContainText('has been placed');

  // Extract order ID for later assertions
  const orderId = (await page.locator('.checkout-success-sub b').textContent()) || '';
  expect(orderId).toMatch(/^QC-/);

  // Amount shown matches the server-computed total (₹1,490 + ₹99 shipping)
  await expect(page.locator('.checkout-success-total b')).toHaveText('₹1,589');

  // Cart is cleared after order placement
  const storedCart = await page.evaluate((key) => window.localStorage.getItem(key), CART_KEY);
  expect(JSON.parse(storedCart || '[]')).toEqual([]);

  // Continue shopping link back to home
  await page.locator('a:has-text("Continue shopping")').click();
  await expect(page).toHaveURL('/');
});

test('8. Stock: server rejects orders above available stock', async ({ page }) => {
  await resetCart(page);

  // Add 100 of the Lumine serum directly to localStorage (stock is 46)
  await page.goto('/');
  await page.evaluate((key) => window.localStorage.setItem(key, JSON.stringify([{ productId: 'lumine-c-serum', quantity: 100 }])), CART_KEY);

  await page.goto('/checkout');
  // Products fetched — item should still render
  await expect(page.locator('.checkout-item')).toHaveCount(1);
  await expect(page.locator('.checkout-item b')).toContainText('Lumine');

  // Fill valid shipping
  await page.locator('input[placeholder="Meera Shah"]').fill('Meera Shah');
  await page.locator('input[placeholder="you@example.com"]').fill('meera@example.com');
  await page.locator('input[placeholder="+91 98765 43210"]').fill('+91 98765 43210');
  await page.locator('input[placeholder="Flat no, building, street"]').fill('12 Orchid Avenue, Bandra West');
  await page.locator('input[placeholder="Mumbai"]').fill('Mumbai');
  await page.locator('input[placeholder="Maharashtra"]').fill('Maharashtra');
  await page.locator('input[placeholder="400001"]').fill('400001');

  // Attempt order
  await page.locator('.checkout-submit').click();

  // Server returns insufficient stock error
  await expect(page.locator('.checkout-notice')).toContainText('Insufficient stock', { timeout: 10000 });
  await expect(page.locator('.checkout-success')).not.toBeVisible();
});

test('9. Mobile: cart and checkout render responsively at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await resetCart(page);
  await addLumine(page);

  // Mobile cart layout — single column (summary stacks below items)
  await page.goto('/cart');
  await expect(page.locator('.cart-item')).toBeVisible();
  await expect(page.locator('.cart-summary')).toHaveCSS('position', 'static');

  // Mobile checkout layout — single column
  await page.goto('/checkout');
  await expect(page.locator('.checkout-item')).toBeVisible();
  await expect(page.locator('.checkout-summary')).toHaveCSS('position', 'static');

  // Complete a purchase on mobile to verify the full flow
  await page.locator('input[placeholder="Meera Shah"]').fill('Meera Shah');
  await page.locator('input[placeholder="you@example.com"]').fill('meera@example.com');
  await page.locator('input[placeholder="+91 98765 43210"]').fill('+91 98765 43210');
  await page.locator('input[placeholder="Flat no, building, street"]').fill('12 Orchid Avenue, Bandra West');
  await page.locator('input[placeholder="Mumbai"]').fill('Mumbai');
  await page.locator('input[placeholder="Maharashtra"]').fill('Maharashtra');
  await page.locator('input[placeholder="400001"]').fill('400001');
  await page.locator('.checkout-submit').click();

  await expect(page.locator('.checkout-success')).toBeVisible({ timeout: 10000 });
});
