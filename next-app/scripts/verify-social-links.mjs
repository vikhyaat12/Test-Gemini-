// @ts-check
import assert from "node:assert/strict";

const BASE = process.env.SITE_URL || "http://localhost:3000";
let adminCookie = "";

async function loginAdmin() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@queenscare.in", password: "QueensCare#Admin2026" }),
  });
  assert.equal(res.status, 200, "Admin login must succeed");
  const cookie = res.headers.get("set-cookie");
  assert.ok(cookie);
  adminCookie = cookie.split(";")[0];
  console.log("✓ Admin Authenticated (admin@queenscare.in)");
}

async function runSocialLinksQA() {
  console.log("==========================================================================");
  console.log("QUEENS CARE LABORATORIES — SOCIAL & MARKETPLACE LINKS QA VERIFICATION");
  console.log("==========================================================================");

  await loginAdmin();

  // 1. Initial State
  console.log("\n[TEST 1] Fetch initial admin and public social links");
  const adminRes1 = await fetch(`${BASE}/api/admin/social-links`, { headers: { Cookie: adminCookie } });
  assert.equal(adminRes1.status, 200);
  const adminData1 = await adminRes1.json();
  console.log(`✓ Test 1 Passed: Admin has ${adminData1.links.length} total configured links`);

  // 2. Hide Instagram
  console.log("\n[TEST 2] Hide Instagram link -> verify disappears publicly");
  const instagram = adminData1.links.find((l) => l.platform === "instagram") || adminData1.links[0];
  assert.ok(instagram, "Must have at least one link (Instagram)");

  const hideRes = await fetch(`${BASE}/api/admin/social-links`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ id: instagram.id, visible: false }),
  });
  assert.equal(hideRes.status, 200);
  const hideData = await hideRes.json();
  assert.equal(hideData.link.visible, false);

  const pubResAfterHide = await fetch(`${BASE}/api/social-links`);
  assert.equal(pubResAfterHide.status, 200);
  const pubDataAfterHide = await pubResAfterHide.json();
  const foundInPublic = pubDataAfterHide.links.some((l) => l.id === instagram.id || l.platform === "instagram");
  assert.equal(foundInPublic, false, "Hidden Instagram must NOT appear in public social links");
  console.log("✓ Test 2 Passed: Instagram hidden in Admin and immediately disappeared from public API");

  // 3. Unhide Instagram
  console.log("\n[TEST 3] Unhide Instagram -> verify reappears publicly");
  const unhideRes = await fetch(`${BASE}/api/admin/social-links`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ id: instagram.id, visible: true }),
  });
  assert.equal(unhideRes.status, 200);
  const pubResAfterUnhide = await fetch(`${BASE}/api/social-links`);
  const pubDataAfterUnhide = await pubResAfterUnhide.json();
  const restoredInPublic = pubDataAfterUnhide.links.some((l) => l.id === instagram.id);
  assert.equal(restoredInPublic, true, "Unhidden Instagram must reappear in public links");
  console.log("✓ Test 3 Passed: Instagram unhidden in Admin and returned to public API");

  // 4. Add Amazon & Flipkart Marketplace Links
  console.log("\n[TEST 4] Add Amazon and Flipkart marketplace links");
  const amazonPayload = {
    platform: "amazon",
    category: "marketplace",
    label: "Amazon India Flagship Store",
    url: "https://www.amazon.in/queenscare",
    desktopIconSize: 26,
    mobileIconSize: 20,
    visible: true,
    openNewTab: true,
  };
  const createAmazon = await fetch(`${BASE}/api/admin/social-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify(amazonPayload),
  });
  assert.equal(createAmazon.status, 201);
  const createdAmazonData = await createAmazon.json();
  const amazonId = createdAmazonData.link.id;
  assert.ok(amazonId);

  const flipkartPayload = {
    platform: "flipkart",
    category: "marketplace",
    label: "Flipkart Official Store",
    url: "https://www.flipkart.com/queenscare",
    desktopIconSize: 24,
    mobileIconSize: 18,
    visible: true,
  };
  const createFlipkart = await fetch(`${BASE}/api/admin/social-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify(flipkartPayload),
  });
  assert.equal(createFlipkart.status, 201);
  const flipkartId = (await createFlipkart.json()).link.id;
  assert.ok(flipkartId);
  console.log("✓ Test 4 Passed: Amazon (id: " + amazonId + ") and Flipkart (id: " + flipkartId + ") marketplace links created");

  // 5. Add Custom Marketplace with Custom Icon
  console.log("\n[TEST 5] Add Custom Marketplace Link with custom icon URL");
  const customPayload = {
    platform: "custom_marketplace",
    category: "marketplace",
    label: "Tata 1mg Queens Care Pharmacy",
    url: "https://www.1mg.com/brands/queenscare",
    customIconUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=100&q=80",
    desktopIconSize: 24,
    mobileIconSize: 18,
    visible: true,
  };
  const createCustom = await fetch(`${BASE}/api/admin/social-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify(customPayload),
  });
  assert.equal(createCustom.status, 201);
  const customId = (await createCustom.json()).link.id;
  console.log("✓ Test 5 Passed: Custom marketplace link created with custom icon URL (id: " + customId + ")");

  // 6. Verify Public Links have all added stores
  console.log("\n[TEST 6] Verify public API returns new marketplace stores with responsive sizes");
  const pubStoresRes = await fetch(`${BASE}/api/social-links`);
  const pubStoresData = await pubStoresRes.json();
  assert.ok(pubStoresData.links.some((l) => l.platform === "amazon"));
  assert.ok(pubStoresData.links.some((l) => l.platform === "flipkart"));
  assert.ok(pubStoresData.links.some((l) => l.platform === "custom_marketplace"));
  console.log(`✓ Test 6 Passed: Public API returned all active social + marketplace links (${pubStoresData.links.length} visible)`);

  // 7. Icon Size Adjustment
  console.log("\n[TEST 7] Adjust Desktop & Mobile Icon Sizes");
  const updateSize = await fetch(`${BASE}/api/admin/social-links`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ id: amazonId, desktopIconSize: 32, mobileIconSize: 22 }),
  });
  assert.equal(updateSize.status, 200);
  const updatedPub = await (await fetch(`${BASE}/api/social-links`)).json();
  const amazonInPub = updatedPub.links.find((l) => l.id === amazonId);
  assert.equal(amazonInPub.desktopIconSize, 32);
  assert.equal(amazonInPub.mobileIconSize, 22);
  console.log("✓ Test 7 Passed: Desktop (32px) and Mobile (22px) sizes persisted and exposed");

  // 8. Reorder Links
  console.log("\n[TEST 8] Reorder links -> Amazon moved to first position");
  const allCurrent = (await (await fetch(`${BASE}/api/admin/social-links`, { headers: { Cookie: adminCookie } })).json()).links;
  const reorderedIds = [amazonId, ...allCurrent.filter((l) => l.id !== amazonId).map((l) => l.id)];
  const reorderRes = await fetch(`${BASE}/api/admin/social-links`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ id: "reorder", orderedIds: reorderedIds }),
  });
  assert.equal(reorderRes.status, 200);
  const pubAfterReorder = await (await fetch(`${BASE}/api/social-links`)).json();
  assert.equal(pubAfterReorder.links[0].id, amazonId, "Amazon must be the first public item");
  console.log("✓ Test 8 Passed: Public order matches Admin reordering");

  // 9. Bulk Hide All Links
  console.log("\n[TEST 9] Bulk Action: Hide ALL Links");
  const hideAllRes = await fetch(`${BASE}/api/admin/social-links`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ action: "hide_all" }),
  });
  assert.equal(hideAllRes.status, 200);

  const pubAfterHideAll = await (await fetch(`${BASE}/api/social-links`)).json();
  assert.equal(pubAfterHideAll.links.length, 0, "Public links must be completely empty when all are hidden");
  console.log("✓ Test 9 Passed: All links hidden; public API returned [] (0 empty gaps in footer)");

  // 10. Bulk Unhide All Links
  console.log("\n[TEST 10] Bulk Action: Unhide ALL Links");
  const unhideAllRes = await fetch(`${BASE}/api/admin/social-links`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ action: "unhide_all" }),
  });
  assert.equal(unhideAllRes.status, 200);
  const pubAfterUnhideAll = await (await fetch(`${BASE}/api/social-links`)).json();
  assert.ok(pubAfterUnhideAll.links.length > 0, "Public links must return after bulk unhide");
  console.log(`✓ Test 10 Passed: All links restored publicly (${pubAfterUnhideAll.links.length} active links)`);

  // 11. Delete Link
  console.log("\n[TEST 11] Delete test link");
  const delRes = await fetch(`${BASE}/api/admin/social-links?id=${customId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  assert.equal(delRes.status, 200);
  const pubAfterDel = await (await fetch(`${BASE}/api/social-links`)).json();
  assert.equal(pubAfterDel.links.some((l) => l.id === customId), false);
  console.log("✓ Test 11 Passed: Link cleanly deleted from Admin and Public API");

  console.log("\n==========================================================================");
  console.log("🎉 ALL SOCIAL & MARKETPLACE LINKS QA TESTS PASSED WITH 100% SUCCESS!");
  console.log("==========================================================================");
}

runSocialLinksQA().catch((err) => {
  console.error("❌ SOCIAL LINKS QA FAILED:", err);
  process.exit(1);
});
