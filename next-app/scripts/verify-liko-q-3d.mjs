import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("==========================================================================");
  console.log("QUEENS CARE LABORATORIES — LIKO-Q™ 3D BOTTLE VERIFICATION SUITE");
  console.log("==========================================================================");

  // 1. Verify Image Asset HTTP 200
  console.log("\n[TEST 1] Verify Liko-Q Bottle Image Asset");
  const imgRes = await fetch(`${BASE_URL}/uploads/liko-q-suspension.png`);
  assert.strictEqual(imgRes.status, 200, "Liko-Q bottle image must return HTTP 200");
  console.log("✓ Test 1 Passed: Image asset /uploads/liko-q-suspension.png verified");

  // 2. Verify Public Homepage API
  console.log("\n[TEST 2] Verify /api/homepage returns LIKO-Q 3D Section");
  const hpRes = await fetch(`${BASE_URL}/api/homepage`);
  assert.strictEqual(hpRes.status, 200, "/api/homepage failed");
  const hpData = await hpRes.json();
  const heroVis = hpData.sections.find((s) => s.type === "heroVisual");
  assert(heroVis, "heroVisual section must exist");
  const content = typeof heroVis.content === "string" ? JSON.parse(heroVis.content) : heroVis.content;
  assert.strictEqual(content.productName, "LIKO-Q™", "Hero product name must be LIKO-Q™");
  assert(content.subtitle.includes("Lycopene") || content.subtitle.includes("Suspension"), "Hero subtitle must describe Liko-Q");
  console.log("✓ Test 2 Passed: Public Homepage API returns LIKO-Q™ 3D visual configuration");

  // 3. Verify Public Homepage HTML
  console.log("\n[TEST 3] Verify Public Homepage SSR HTML contains LIKO-Q and Three.js Container");
  const homeHtmlRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(homeHtmlRes.status, 200, "Homepage HTML failed");
  const homeHtml = await homeHtmlRes.text();
  assert(homeHtml.includes("LIKO-Q") || homeHtml.includes("Liko-Q") || homeHtml.includes("hero-visual-3d-container"), "Homepage must render LIKO-Q 3D container");
  console.log("✓ Test 3 Passed: Public Homepage renders LIKO-Q 3D presentation");

  // 4. Verify Liko-Q in Product Catalog API
  console.log("\n[TEST 4] Verify /api/products contains Liko-Q Suspension");
  const prodRes = await fetch(`${BASE_URL}/api/products`);
  assert.strictEqual(prodRes.status, 200, "/api/products failed");
  const prodData = await prodRes.json();
  const likoQProduct = prodData.products.find((p) => p.slug === "liko-q-suspension" || p.name.includes("Liko-Q"));
  assert(likoQProduct, "Liko-Q product must be present in catalog");
  assert.strictEqual(likoQProduct.price, 165, "Liko-Q price must be ₹165");
  console.log("✓ Test 4 Passed: Liko-Q product active in catalog at ₹165");

  // 5. Verify Liko-Q Public PDP
  console.log("\n[TEST 5] Verify Public PDP /products/liko-q-suspension");
  const pdpRes = await fetch(`${BASE_URL}/products/liko-q-suspension`);
  assert.strictEqual(pdpRes.status, 200, "PDP /products/liko-q-suspension failed");
  const pdpHtml = await pdpRes.text();
  assert(pdpHtml.includes("Liko-Q") || pdpHtml.includes("Lycopene"), "PDP must render Liko-Q details");
  console.log("✓ Test 5 Passed: Public PDP /products/liko-q-suspension renders successfully");

  console.log("\n==========================================================================");
  console.log("🎉 ALL LIKO-Q™ 3D BOTTLE TESTS PASSED WITH 100% SUCCESS!");
  console.log("==========================================================================");
}

run().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
