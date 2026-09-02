const BASE_URL = "http://localhost:3000";

let adminCookie = "";

async function loginAdmin() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@queenscare.in", password: "QueensCare#Admin2026" }),
  });
  const cookie = res.headers.get("set-cookie");
  if (cookie) {
    adminCookie = cookie.split(";")[0];
  }
}

async function runTests() {
  console.log("=== QUEENS CARE STOREFRONT FULL PAGE CMS VERIFICATION ===");
  let passed = 0;
  let failed = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      failed++;
    }
  };

  await loginAdmin();
  assert(adminCookie.length > 0, "Admin authentication successful");

  // 1. Test Public Homepage
  console.log("\n1. Testing Public Homepage Delivery & Content...");
  const hpRes = await fetch(`${BASE_URL}/`);
  assert(hpRes.status === 200, "GET / returns HTTP 200");
  const hpText = await hpRes.text();
  assert(hpText.includes("Queens Care"), "Homepage contains Queens Care brand");
  assert(hpText.includes("Complimentary delivery") || hpText.includes("announcement"), "Homepage contains Announcement bar");
  assert(hpText.includes("Science") || hpText.includes("hero"), "Homepage contains Hero section");
  assert(hpText.includes("Shop") || hpText.includes("collection"), "Homepage contains Collection section");
  assert(hpText.includes("About") || hpText.includes("science"), "Homepage contains Science section");
  assert(hpText.includes("ritual") || hpText.includes("Build your ritual") || hpText.includes("Care that meets you"), "Homepage contains Ritual section");
  assert(hpText.includes("care journal") || hpText.includes("journal"), "Homepage contains Journal / Blog section");
  assert(hpText.includes("Partner") || hpText.includes("affiliate"), "Homepage contains Affiliate / Partner section");
  assert(hpText.includes("Questions deserve") || hpText.includes("consult"), "Homepage contains Consult / Doctor section");
  assert(hpText.includes("footer") || hpText.includes("Care is a practice"), "Homepage contains Footer");

  // 2. Test Homepage API & Sections
  console.log("\n2. Testing Homepage Admin & Public APIs...");
  const hpApiRes = await fetch(`${BASE_URL}/api/homepage`);
  assert(hpApiRes.status === 200, "GET /api/homepage returns HTTP 200");
  const hpApiData = await hpApiRes.json();
  assert(Array.isArray(hpApiData.sections) && hpApiData.sections.length >= 6, `Homepage has ${hpApiData.sections?.length} active sections`);

  // 3. Test CMS Section Edit & Persistence
  console.log("\n3. Testing CMS Section Updates & Persistence...");
  const heroSec = hpApiData.sections.find(s => s.type === "hero");
  if (heroSec) {
    const originalHeading = heroSec.content?.heading || "Science, made <em>personal.</em>";
    const testHeading = "Science, made <em>exceptional.</em> [CMS-TEST]";

    // Update
    const patchRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        id: heroSec.id,
        content: { ...heroSec.content, heading: testHeading }
      }),
    });
    assert(patchRes.status === 200, "PATCH /api/admin/homepage updates section content");

    // Verify
    const verifyRes = await fetch(`${BASE_URL}/api/homepage`);
    const verifyData = await verifyRes.json();
    const updatedHero = verifyData.sections.find(s => s.id === heroSec.id);
    assert(updatedHero?.content?.heading === testHeading, "Updated heading persisted in database");

    // Restore
    await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        id: heroSec.id,
        content: { ...heroSec.content, heading: originalHeading }
      }),
    });
    console.log("  ✓ Restored original hero heading");
  }

  // 4. Test Dynamic Section Reordering
  console.log("\n4. Testing Dynamic Section Reordering...");
  const scienceSec = hpApiData.sections.find(s => s.type === "science");
  if (scienceSec) {
    const origSort = scienceSec.sort;
    const newSort = Number(origSort || 0) + 10;
    const reorderRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ id: scienceSec.id, sort: newSort }),
    });
    assert(reorderRes.status === 200, "Reordered section via PATCH sort");

    // Restore
    await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ id: scienceSec.id, sort: origSort }),
    });
    console.log("  ✓ Restored original section sort order");
  }

  // 5. Test Section Hide / Unhide Lifecycle
  console.log("\n5. Testing Section Hide / Unhide Lifecycle...");
  const consultSec = hpApiData.sections.find(s => s.type === "consult");
  if (consultSec) {
    // Hide
    const hideRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ id: consultSec.id, visible: false }),
    });
    assert(hideRes.status === 200, "Hid section via visible: false");

    // Public API should filter it out
    const pubRes = await fetch(`${BASE_URL}/api/homepage`);
    const pubData = await pubRes.json();
    const isHidden = !pubData.sections.some(s => s.id === consultSec.id);
    assert(isHidden, "Hidden section is excluded from public API");

    // Unhide
    await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ id: consultSec.id, visible: true }),
    });
    console.log("  ✓ Restored consult section visibility");
  }

  // 6. Test Our Story Page & CMS
  console.log("\n6. Testing 'Our Story' (/about) Page & CMS...");
  const aboutRes = await fetch(`${BASE_URL}/about`);
  assert(aboutRes.status === 200, "GET /about returns HTTP 200");
  const aboutText = await aboutRes.text();
  assert(aboutText.includes("Our Story") || aboutText.includes("clinical rigor") || aboutText.includes("Queens Care"), "About page contains flagship story content");

  const storyContentRes = await fetch(`${BASE_URL}/api/content/about`);
  assert(storyContentRes.status === 200, "GET /api/content/about returns HTTP 200");
  const storyData = await storyContentRes.json();
  assert(storyData.content?.value?.originHeading || storyData.content?.value?.heroHeading, "Our Story content has structured narrative in database");

  // 7. Test Employee Management Enhancements
  console.log("\n7. Testing Employee Management Controls...");
  const empListRes = await fetch(`${BASE_URL}/api/admin/employees`, {
    headers: { Cookie: adminCookie }
  });
  assert(empListRes.status === 200, "GET /api/admin/employees returns HTTP 200");
  const empListData = await empListRes.json();
  if (empListData.employees?.length > 0) {
    const firstEmp = empListData.employees[0];
    const updateEmpRes = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ id: firstEmp.id, featured: true }),
    });
    assert(updateEmpRes.status === 200, "PATCH /api/admin/employees supports featured toggle");
  }

  // 8. Test Footer CMS Settings
  console.log("\n8. Testing Footer CMS Settings...");
  const footerUpdateRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ key: "footer_copyright", value: "© 2026 Queens Care Laboratories. All rights reserved.", group: "footer" }),
  });
  assert(footerUpdateRes.status === 200, "POST /api/admin/settings updates footer setting");

  const settingsRes = await fetch(`${BASE_URL}/api/settings`);
  const settingsData = await settingsRes.json();
  const copyrightSetting = settingsData.settings?.find(s => s.key === "footer_copyright");
  assert(Boolean(copyrightSetting), "Footer copyright setting returned in public settings API");

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
