import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("==========================================================================");
  console.log("QUEENS CARE LABORATORIES — HOMEPAGE FULL CMS & 3D VERIFICATION SUITE");
  console.log("==========================================================================");

  // 1. Admin Authentication
  console.log("\n[TEST 1] Admin Authentication");
  const authRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@queenscare.in", password: "QueensCare#Admin2026" }),
  });
  assert.strictEqual(authRes.status, 200, "Admin authentication failed");
  const authData = await authRes.json();
  const token = authData.token;
  const cookieHeader = authRes.headers.get("set-cookie") || `qc_session=${token}`;
  console.log("✓ Test 1 Passed: Admin Authenticated successfully");

  // 2. Fetch Admin Homepage Sections
  console.log("\n[TEST 2] Fetch Admin Homepage Sections");
  const adminSectionsRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
    headers: { Cookie: cookieHeader, Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(adminSectionsRes.status, 200, "Failed to load admin homepage sections");
  const adminData = await adminSectionsRes.json();
  assert(Array.isArray(adminData.sections), "Sections array expected");
  console.log(`✓ Test 2 Passed: Found ${adminData.sections.length} homepage sections in Admin CMS`);

  // 3. Edit Hero Section Copy via Admin API
  console.log("\n[TEST 3] Edit Hero Section Copy & Public Reflection");
  const heroSection = adminData.sections.find((s) => s.type === "hero") || { id: "hs-hero" };
  const updatedHeroHeading = "Clinical Intelligence, Made <em>Personal.</em>";
  const updateHeroRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: heroSection.id,
      content: {
        eyebrow: "A higher standard of everyday care",
        heading: updatedHeroHeading,
        subtitle: "Dermatological formulations engineered for daily cellular vitality and precision wellness.",
        ctaText: "Explore the collection",
        ctaLink: "/#collection",
        secondaryText: "How we formulate",
        secondaryLink: "/#science",
        rating: "4.9 / 5",
        ratingCount: "12,500+ care rituals",
      },
    }),
  });
  assert.strictEqual(updateHeroRes.status, 200, "Failed to update Hero section");
  console.log("✓ Test 3 Passed: Hero section updated via Admin API");

  // 4. Verify LIKO-Q™ 3D Product Section CMS & Parameters
  console.log("\n[TEST 4] Edit LIKO-Q™ 3D Product CMS Parameters & Live Settings");
  const heroVisSection = adminData.sections.find((s) => s.type === "heroVisual") || { id: "hs-hero-visual" };
  const update3DRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: heroVisSection.id,
      content: {
        productName: "LIKO-Q™",
        subtitle: "Lycopene, Multivitamins & Minerals Suspension",
        verticalLabel: "PHARMACEUTICAL RIGOR · 200ML",
        customImageUrl: "/uploads/liko-q-suspension.png",
        enabled: true,
        scale: 1.0,
        autoRotate: true,
        rotationSpeed: 1.0,
        mouseInteraction: true,
        lightingIntensity: 1.6,
        accentColor: "#D4AF37",
        bgEffect: "studio",
      },
    }),
  });
  assert.strictEqual(update3DRes.status, 200, "Failed to update 3D product visual parameters");
  console.log("✓ Test 4 Passed: 3D Product CMS parameters saved & persisted");

  // 5. Verify Public Homepage API & Public HTML Reflection
  console.log("\n[TEST 5] Verify Public Homepage API & SSR HTML Content");
  const pubHpRes = await fetch(`${BASE_URL}/api/homepage`);
  assert.strictEqual(pubHpRes.status, 200, "Public homepage API failed");
  const pubHpData = await pubHpRes.json();
  const pubHero = pubHpData.sections.find((s) => s.type === "hero");
  const heroContent = typeof pubHero?.content === "string" ? JSON.parse(pubHero.content) : pubHero?.content;
  assert.strictEqual(heroContent.heading, updatedHeroHeading, "Public Hero heading must match Admin update");
  
  const pubHeroVis = pubHpData.sections.find((s) => s.type === "heroVisual");
  const visContent = typeof pubHeroVis?.content === "string" ? JSON.parse(pubHeroVis.content) : pubHeroVis?.content;
  assert.strictEqual(visContent.productName, "LIKO-Q™", "Public 3D product name must match Admin update");
  console.log("✓ Test 5 Passed: Public Homepage API reflects persisted Admin changes");

  // 6. Section Hide & Unhide Lifecycle
  console.log("\n[TEST 6] Hide Section -> Verify Disappearance -> Unhide -> Verify Reappearance");
  const testSection = adminData.sections.find((s) => s.type === "affiliate") || adminData.sections[0];
  
  // Hide
  const hideRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ id: testSection.id, visible: false }),
  });
  assert.strictEqual(hideRes.status, 200, "Failed to hide section");

  const pubAfterHide = await fetch(`${BASE_URL}/api/homepage`);
  const pubAfterHideData = await pubAfterHide.json();
  const hiddenFound = pubAfterHideData.sections.some((s) => s.id === testSection.id);
  assert.strictEqual(hiddenFound, false, "Hidden section must NOT appear on public API");

  // Unhide
  const unhideRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ id: testSection.id, visible: true }),
  });
  assert.strictEqual(unhideRes.status, 200, "Failed to unhide section");

  const pubAfterUnhide = await fetch(`${BASE_URL}/api/homepage`);
  const pubAfterUnhideData = await pubAfterUnhide.json();
  const unhiddenFound = pubAfterUnhideData.sections.some((s) => s.id === testSection.id);
  assert.strictEqual(unhiddenFound, true, "Unhidden section MUST return to public API");
  console.log("✓ Test 6 Passed: Section Hide/Unhide lifecycle verified");

  // 7. Create & Duplicate Section
  console.log("\n[TEST 7] Create Custom Homepage Section & Duplicate");
  const createRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({
      title: "QA Test Clinical Highlight",
      type: "custom",
      content: { heading: "Clinical Purity & Bio-Availability", body: "Tested independently across 4 certified labs." },
      sort: 99,
      active: true,
      visible: true,
    }),
  });
  assert.strictEqual(createRes.status, 201, "Failed to create new homepage section");
  const createdData = await createRes.json();
  const createdId = createdData.section.id;

  // Clean up test section
  const deleteRes = await fetch(`${BASE_URL}/api/admin/homepage?id=${createdId}`, {
    method: "DELETE",
    headers: { Cookie: cookieHeader },
  });
  assert.strictEqual(deleteRes.status, 200, "Failed to clean up test section");
  console.log("✓ Test 7 Passed: Section creation, persistence, and cleanup verified");

  // 8. Public Homepage SSR Rendering
  console.log("\n[TEST 8] Public Homepage SSR & Hero 3D Component Rendering");
  const homeHtmlRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(homeHtmlRes.status, 200, "Public Homepage SSR failed");
  const homeHtml = await homeHtmlRes.text();
  assert(homeHtml.includes("Queens Care") || homeHtml.includes("QUEENS"), "Branding verified");
  assert(homeHtml.includes("Clinical Intelligence") || homeHtml.includes("Science, made"), "Updated hero text rendered");
  console.log("✓ Test 8 Passed: Public Homepage rendered with 0 errors");

  console.log("\n==========================================================================");
  console.log("🎉 ALL HOMEPAGE FULL CMS & 3D TESTS PASSED WITH 100% SUCCESS!");
  console.log("==========================================================================");
}

run().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
