import { test, expect } from '@playwright/test';

test.describe('Queens Care — Blog, Journal, Affiliate & Navigation Verification', () => {
  test('1. Public Blog Page (/blog) renders full editorial layout and filters', async ({ page }) => {
    await page.goto('/blog');
    
    // Page title and eyebrow
    await expect(page.locator('h1')).toContainText('The care journal');
    await expect(page.locator('.eyebrow')).toContainText('Queens Care Laboratories');
    
    // Category filters exist
    await expect(page.locator('a:has-text("All")')).toBeVisible();
    
    // Articles and Newsletter CTA exist
    await expect(page.locator('.journal-grid')).toBeVisible();
    await expect(page.locator('.journal-cta')).toBeVisible();
    await expect(page.locator('input[placeholder="Your email address"]')).toBeVisible();
  });

  test('2. Public Blog Post Detail View (/blog/[slug]) loads full article', async ({ page }) => {
    // Navigate to known blog post
    await page.goto('/blog/afternoon-slump-not-a-personality-flaw');
    
    // Header and title
    await expect(page.locator('h1')).toContainText('Why your afternoon slump is not a personality flaw');
    await expect(page.locator('.back')).toHaveText('← All articles');
    
    // Metadata (author, read time, date)
    await expect(page.locator('text=Dr. Anya Sharma')).toBeVisible();
    await expect(page.locator('text=6 min read')).toBeVisible();
    
    // Content body and tags
    await expect(page.locator('article')).toBeVisible();
    
    // Share section
    await expect(page.locator('text=Share this article')).toBeVisible();
  });

  test('3. Homepage renders dynamic Journal, Affiliate section, and Doctor CTA', async ({ page }) => {
    await page.goto('/');
    
    // 1. Journal section
    const journalSec = page.locator('#journal');
    await expect(journalSec).toBeVisible();
    await expect(journalSec.locator('h2')).toContainText('Ideas, insights and');
    await expect(journalSec.locator('a:has-text("View all journal")')).toHaveAttribute('href', '/blog');
    
    // 2. Affiliate section
    await expect(page.locator('text=Partner with Queens Care Laboratories')).toBeVisible();
    await expect(page.locator('text=10%')).toBeVisible();
    await expect(page.locator('a:has-text("BECOME AN AFFILIATE")')).toHaveAttribute('href', '/affiliate');
    
    // 3. Healthcare Professionals / Doctor CTA
    await expect(page.locator('a:has-text("For healthcare professionals")').first()).toHaveAttribute('href', '/doctors');
    
    // 4. Footer Links
    await expect(page.locator('footer a[href="/blog"]')).toBeVisible();
    await expect(page.locator('footer a[href="/affiliate"]')).toBeVisible();
    await expect(page.locator('footer a[href="/doctors"]')).toBeVisible();
    await expect(page.locator('footer a[href="/b2b"]')).toBeVisible();
  });

  test('4. Public Affiliate Landing Page (/affiliate) renders value prop, FAQ, and Registration form', async ({ page }) => {
    await page.goto('/affiliate');
    
    // Heading
    await expect(page.locator('h1')).toContainText('Partner with Queens Care');
    
    // Value pillars
    await expect(page.locator('text=10% Commission')).toBeVisible();
    await expect(page.locator('text=30-Day Cookie Window')).toBeVisible();
    await expect(page.locator('text=Live Analytics')).toBeVisible();
    await expect(page.locator('text=Direct Monthly Payouts')).toBeVisible();
    
    // 3 Steps
    await expect(page.locator('text=Three simple steps to start earning')).toBeVisible();
    
    // Registration form for unauthenticated visitors
    await expect(page.locator('form input[placeholder*="Priya Sharma"]')).toBeVisible();
    await expect(page.locator('button:has-text("JOIN AS AFFILIATE")')).toBeVisible();
    
    // FAQ Accordion
    await expect(page.locator('text=How much does it cost to join?')).toBeVisible();
    await page.locator('button:has-text("How much does it cost to join?")').click();
    await expect(page.locator('text=Joining the Queens Care Affiliate Programme is completely free')).toBeVisible();
  });

  test('5. Affiliate Tracking Link (/r/[code]) redirects and sets attribution cookie', async ({ page, context }) => {
    // Navigate via custom affiliate tracking link
    const response = await page.goto('/r/QC123456');
    
    // Verifies redirect occurred
    expect(response?.status()).toBeLessThan(400);
    
    // Verifies qc_affiliate_ref cookie was set
    const cookies = await context.cookies();
    const refCookie = cookies.find(c => c.name === 'qc_affiliate_ref');
    expect(refCookie).toBeDefined();
  });

  test('6. Admin Route Security redirects unauthenticated requests to /admin/login', async ({ page }) => {
    await page.goto('/admin');
    
    // Redirects to admin login page, not customer account
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('h1')).toContainText('Admin Access');
  });

  test('7. Doctor Portal (/doctors) renders application form and benefits', async ({ page }) => {
    await page.goto('/doctors');
    
    await expect(page.locator('h1')).toContainText('Doctor & Clinic Portal');
    await expect(page.locator('text=Clinical Data')).toBeVisible();
    await expect(page.locator('text=Professional Partnership Application')).toBeVisible();
    await expect(page.locator('form input[required]')).toHaveCount(2);
  });

  test('8. Employee Directory and Demo Profile (/employee & /employee/vikram-singhania)', async ({ page }) => {
    await page.goto('/employee');
    await expect(page.locator('h1')).toContainText('Employee Directory');
    await expect(page.locator('text=Dr. Vikram Singhania')).toBeVisible();

    await page.goto('/employee/vikram-singhania');
    await expect(page.locator('h1')).toContainText('Dr. Vikram Singhania');
    await expect(page.locator('text=QC-EMP-1042')).toBeVisible();
    await expect(page.locator('text=Lead Research Scientist')).toBeVisible();
  });

  test('9. B2B / Wholesale Portal (/b2b) renders distributor application form', async ({ page }) => {
    await page.goto('/b2b');
    await expect(page.locator('h1')).toContainText('B2B & Distribution Portal');
    await expect(page.locator('text=Distributor & Partner Application')).toBeVisible();
    await expect(page.locator('form input[name="company"]')).toBeVisible();
    await expect(page.locator('form input[name="name"]')).toBeVisible();
    await expect(page.locator('form input[name="email"]')).toBeVisible();
  });

  test('10. Product Card Navigation from Homepage & Shop opens /products/[slug]', async ({ page }) => {
    await page.goto('/');
    const firstProduct = page.locator('.product-grid a[href*="/products/"]').first();
    await expect(firstProduct).toBeVisible();
    const href = await firstProduct.getAttribute('href');
    await firstProduct.click();
    await expect(page).toHaveURL(new RegExp(href || '/products/'));
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Add to ritual bag')).toBeVisible();
  });
});

