import assert from "assert";

const BASE = "http://localhost:3000";

async function loginAdmin() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@queenscare.in", password: "QueensCare#Admin2026" }),
  });
  const cookie = res.headers.get("set-cookie");
  assert(cookie, "Failed to login as admin");
  return cookie.split(";")[0];
}

async function runAudit() {
  console.log("==================================================");
  console.log("QUEENS CARE FULL WEBSITE FUNCTIONALITY & AUDIT QA");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Primary Public Routes Test
  console.log("--- 1. Primary Public Routes Verification ---");
  const routes = [
    "/",
    "/shop",
    "/about",
    "/blog",
    "/careers",
    "/b2b",
    "/employee",
    "/store-locator",
    "/contact",
    "/faq",
    "/track-order",
    "/privacy",
    "/terms",
    "/doctors",
    "/affiliate",
    "/account",
    "/cart",
    "/checkout",
    "/admin/login",
    "/manufacturing",
    "/quality-assurance",
    "/research-development",
    "/recommendations",
    "/api/pages",
    "/api/testimonials",
    "/api/products",
  ];

  for (const r of routes) {
    await test(`Route ${r} responds with HTTP 200`, async () => {
      const res = await fetch(`${BASE}${r}`);
      assert.strictEqual(res.status, 200, `Expected 200 but got ${res.status}`);
      const text = await res.text();
      assert(text.length > 50, "Response body too short");
      assert(!text.includes("We are preparing a considered experience for this section"), "Route hit placeholder");
    });
  }

  // 2. Route Aliases & Next.js Redirects
  console.log("\n--- 2. Route Aliases & Next.js Redirects ---");
  const redirects = [
    { from: "/employees", to: "/employee" },
    { from: "/our-team", to: "/employee" },
    { from: "/team", to: "/employee" },
    { from: "/partners", to: "/b2b" },
    { from: "/partner", to: "/b2b" },
    { from: "/distributor", to: "/store-locator" },
    { from: "/distributors", to: "/store-locator" },
    { from: "/locator", to: "/store-locator" },
  ];

  for (const rd of redirects) {
    await test(`Alias ${rd.from} redirects to ${rd.to}`, async () => {
      const res = await fetch(`${BASE}${rd.from}`, { redirect: "manual" });
      const status = res.status;
      const location = res.headers.get("location");
      assert([307, 308].includes(status), `Expected 307/308 redirect, got ${status}`);
      assert(location && location.includes(rd.to), `Expected redirect to ${rd.to}, got ${location}`);
    });
  }

  // 3. Employee Profile & Admin Preview
  console.log("\n--- 3. Employee Profile & Admin Preview ---");
  await test("Public employee profile /employee/dr-ananya-mehta renders correctly", async () => {
    const res = await fetch(`${BASE}/employee/dr-ananya-mehta`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes("Ananya"), "Does not contain Ananya");
    assert(html.includes("Official Staff Directory"), "Missing staff directory indicator");
    assert(html.includes("Return to Queens Care"), "Missing return link");
  });

  const adminCookie = await loginAdmin();

  // 4. Our Team Hide / Unhide Lifecycle
  console.log("\n--- 4. Our Team Hide/Unhide Lifecycle ---");
  await test("Initial state: /api/pages has employee in footer", async () => {
    const res = await fetch(`${BASE}/api/pages`);
    const data = await res.json();
    const hasEmployee = data.footer.some(p => p.slug === "employee");
    assert(hasEmployee, "Expected employee in footer");
  });

  await test("Hide 'Our Team' via Admin PATCH /api/admin/pages", async () => {
    const res = await fetch(`${BASE}/api/admin/pages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ id: "pg-employee", active: false, footerVisible: false }),
    });
    assert.strictEqual(res.status, 200);
  });

  await test("When Hidden: /api/pages excludes employee from footer", async () => {
    const res = await fetch(`${BASE}/api/pages`);
    const data = await res.json();
    const hasEmployee = data.footer.some(p => p.slug === "employee");
    assert(!hasEmployee, "Expected employee NOT in footer when hidden");
  });

  await test("When Hidden: Public visiting /employee receives maintenance screen", async () => {
    const res = await fetch(`${BASE}/employee`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes("Our Team Directory Under Scheduled Review"), "Missing scheduled review notice for public");
    assert(html.includes("Return to Storefront"), "Missing Return to Storefront link");
  });

  await test("When Hidden: Authenticated Admin can still preview /employee with admin badge", async () => {
    const res = await fetch(`${BASE}/employee`, { headers: { Cookie: adminCookie } });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes("ADMIN PREVIEW"), "Missing admin preview banner");
    assert(html.includes("Scientific Leadership"), "Did not render team directory for admin");
  });

  await test("Unhide / Restore 'Our Team' via Admin PATCH", async () => {
    const res = await fetch(`${BASE}/api/admin/pages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ id: "pg-employee", active: true, footerVisible: true }),
    });
    assert.strictEqual(res.status, 200);
  });

  await test("When Restored: /api/pages has employee in footer again", async () => {
    const res = await fetch(`${BASE}/api/pages`);
    const data = await res.json();
    const hasEmployee = data.footer.some(p => p.slug === "employee");
    assert(hasEmployee, "Expected employee restored in footer");
  });

  await test("When Restored: Public /employee loads full directory without maintenance", async () => {
    const res = await fetch(`${BASE}/employee`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(!html.includes("Our Team Directory Under Scheduled Review"), "Maintenance notice still showing after restore");
    assert(html.includes("Scientific Leadership"), "Missing directory heading");
  });

  // 5. Testimonials & Quote Controls API
  console.log("\n--- 5. Testimonials API & Quote Controls ---");
  await test("/api/testimonials returns visible testimonials", async () => {
    const res = await fetch(`${BASE}/api/testimonials`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.testimonials), "Expected testimonials array");
    assert(data.testimonials.length > 0, "Expected at least 1 testimonial");
    assert(data.testimonials[0].body, "Missing body in testimonial");
  });

  // 6. Homepage Verification
  console.log("\n--- 6. Homepage Experience Verification ---");
  await test("Homepage renders with Store locator in footer, dynamic navigation, and clean markup", async () => {
    const res = await fetch(`${BASE}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes("Store locator"), "Footer missing Store locator link");
    assert(html.includes("B2B portal"), "Footer missing B2B portal");
    assert(html.includes("Previous testimonial"), "Missing Previous testimonial button");
    assert(html.includes("Next testimonial"), "Missing Next testimonial button");
  });

  console.log("\n==================================================");
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error("Audit fatal error:", err);
  process.exit(1);
});
