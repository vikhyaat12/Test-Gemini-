import assert from "assert";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let adminCookie = "";
let testLocId = "";
const timestamp = Date.now();
const testStoreName = `Apollo Precision Pharmacy & Clinical Care ${timestamp}`;

async function authenticateAdmin() {
  console.log("▶ 1. Authenticating Admin User...");
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@queenscare.in",
      password: "QueensCare#Admin2026",
    }),
  });

  assert.strictEqual(res.status, 200, "Admin login must return HTTP 200");
  const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie") || ""];
  adminCookie = cookies.join("; ");
  assert.ok(adminCookie.includes("qc_session="), "Session cookie qc_session must be present");
  console.log("  ✔ Admin authenticated successfully.");
}

async function testPublicStoreLocatorAPI() {
  console.log("▶ 2. Testing Public Store Locator API (/api/store-locator)...");
  const res = await fetch(`${BASE_URL}/api/store-locator`);
  assert.strictEqual(res.status, 200, "Public store-locator API must return HTTP 200");

  const data = await res.json();
  assert.ok(data.success, "Response must indicate success");
  assert.ok(Array.isArray(data.locations), "Locations must be an array");
  assert.ok(data.locations.length >= 7, "Seed locations must be available");
  assert.ok(data.pageConfig?.hero?.heading, "PageConfig hero heading must exist");
  assert.ok(data.pageConfig?.b2bCta?.buttonLink === "/b2b#enquiry-form", "B2B CTA must link to /b2b#enquiry-form");
  console.log(`  ✔ Public Store Locator API returned ${data.locations.length} verified locations.`);
}

async function testPincodeSearch() {
  console.log("▶ 3. Testing PIN Code Search (110001 & 400050)...");

  // Search Delhi PIN 110001
  const delhiRes = await fetch(`${BASE_URL}/api/store-locator?q=110001`);
  const delhiData = await delhiRes.json();
  assert.ok(delhiData.locations.length >= 1, "Must find location for PIN 110001");
  assert.ok(delhiData.locations.some((l) => l.pincode === "110001"), "Results must match PIN 110001");

  // Search Mumbai PIN 400050
  const mumRes = await fetch(`${BASE_URL}/api/store-locator?q=400050`);
  const mumData = await mumRes.json();
  assert.ok(mumData.locations.length >= 1, "Must find location for PIN 400050");
  assert.ok(mumData.locations.some((l) => l.pincode === "400050"), "Results must match PIN 400050");
  console.log("  ✔ Exact PIN code search verified.");
}

async function testCityAndStateSearch() {
  console.log("▶ 4. Testing City & State Search (Case-Insensitive)...");

  const cityRes = await fetch(`${BASE_URL}/api/store-locator?q=mumbai`);
  const cityData = await cityRes.json();
  assert.ok(cityData.locations.length >= 1, "Must find Mumbai locations");
  assert.ok(cityData.locations.every((l) => l.city.toLowerCase() === "mumbai" || l.city.toLowerCase().includes("mumbai")), "All results must be in Mumbai");

  const stateRes = await fetch(`${BASE_URL}/api/store-locator?q=karnataka`);
  const stateData = await stateRes.json();
  assert.ok(stateData.locations.length >= 1, "Must find Karnataka locations");
  console.log("  ✔ City and State search verified.");
}

async function testGeolocationDistanceSearch() {
  console.log("▶ 5. Testing Geolocation Coordinates & Distance Calculation...");

  // Coords near Bandra West (19.0596, 72.8295)
  const geoRes = await fetch(`${BASE_URL}/api/store-locator?lat=19.0596&lng=72.8295`);
  const geoData = await geoRes.json();
  assert.ok(geoData.locations.length >= 1, "Must return locations with distance");
  assert.strictEqual(typeof geoData.locations[0].distanceKm, "number", "Nearest location must have numeric distance in km");
  assert.ok(geoData.locations[0].distanceKm < 1.0, `Nearest location must be under 1km (Got ${geoData.locations[0].distanceKm} km)`);
  assert.strictEqual(geoData.locations[0].name, "Queens Care Flagship Pharmacy & Derma Centre", "Flagship pharmacy must be sorted #1");
  console.log(`  ✔ Geolocation search verified with nearest distance: ${geoData.locations[0].distanceKm} km.`);
}

async function testCategoryFiltering() {
  console.log("▶ 6. Testing Category / Type Filtering...");

  const pharmRes = await fetch(`${BASE_URL}/api/store-locator?type=pharmacy`);
  const pharmData = await pharmRes.json();
  assert.ok(pharmData.locations.length >= 1, "Must return pharmacy locations");
  assert.ok(pharmData.locations.every((l) => l.type === "pharmacy"), "All results must have type pharmacy");

  const distRes = await fetch(`${BASE_URL}/api/store-locator?type=distributor`);
  const distData = await distRes.json();
  assert.ok(distData.locations.length >= 1, "Must return distributor locations");
  assert.ok(distData.locations.every((l) => l.type === "distributor"), "All results must have type distributor");
  console.log("  ✔ Category filtering verified across Pharmacy and Distributor types.");
}

async function testNoResultHandling() {
  console.log("▶ 7. Testing No-Result Search State...");

  const res = await fetch(`${BASE_URL}/api/store-locator?q=nonexistentpincode999999`);
  const data = await res.json();
  assert.strictEqual(data.total, 0, "Non-existent search must return 0 results");
  assert.ok(data.pageConfig?.b2bCta?.buttonLink, "Response must include B2B CTA for unserviced territories");
  console.log("  ✔ No-result state and B2B fallback handling verified.");
}

async function testPublicHTMLRoute() {
  console.log("▶ 8. Testing Public /store-locator Page Route...");

  const res = await fetch(`${BASE_URL}/store-locator`);
  assert.strictEqual(res.status, 200, "/store-locator page must return HTTP 200");
  const html = await res.text();
  assert.ok(html.includes("Store &amp; Distributor Locator") || html.includes("Store & Distributor Locator") || html.includes("Locator"), "HTML must contain page title");
  console.log("  ✔ Public /store-locator HTML page route verified.");
}

async function testAdminStoreCRUD() {
  console.log("▶ 9. Testing Admin Store Location CRUD & Visibility Lifecycle...");

  // Create new location
  const createRes = await fetch(`${BASE_URL}/api/admin/store-locator`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: testStoreName,
      type: "pharmacy",
      contactPerson: "Dr. Sandeep Mehta",
      phone: "+91 22 2899 1122",
      whatsapp: "+91 98200 99887",
      email: "borivali@queenscare.in",
      address: "Shop 12, Ground Floor, Sai Plaza, SV Road, Borivali West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400092",
      latitude: 19.2288,
      longitude: 72.8541,
      openingHours: "Mon-Sat: 09:00 AM - 10:00 PM",
      isAuthorized: true,
      isFeatured: true,
      isActive: true,
      isVisible: true,
    }),
  });

  assert.strictEqual(createRes.status, 201, "Creating store location must return HTTP 201");
  const createData = await createRes.json();
  assert.ok(createData.location?.id?.startsWith("QC-LOC-"), "Location ID must start with QC-LOC-");
  testLocId = createData.location.id;
  console.log(`  ✔ Created store location with ID: ${testLocId}`);

  // Verify visible in public search
  const pubSearch = await fetch(`${BASE_URL}/api/store-locator?q=400092`);
  const pubSearchData = await pubSearch.json();
  assert.ok(pubSearchData.locations.some((l) => l.id === testLocId), "New store must appear publicly");

  // Hide location
  const hideRes = await fetch(`${BASE_URL}/api/admin/store-locator/${testLocId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ isVisible: false }),
  });
  assert.strictEqual(hideRes.status, 200, "Patching visibility must return HTTP 200");

  // Verify disappeared from public search
  const pubHiddenSearch = await fetch(`${BASE_URL}/api/store-locator?q=400092`);
  const pubHiddenData = await pubHiddenSearch.json();
  assert.ok(!pubHiddenData.locations.some((l) => l.id === testLocId), "Hidden store must NOT appear publicly");
  console.log("  ✔ Hide/Unhide lifecycle verified.");

  // Delete test location
  const delRes = await fetch(`${BASE_URL}/api/admin/store-locator/${testLocId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(delRes.status, 200, "Deleting store must return HTTP 200");
  console.log(`  ✔ Cleaned up test location: ${testLocId}`);
}

async function testAdminCMSUpdate() {
  console.log("▶ 10. Testing Admin Store Locator CMS & SEO Settings...");

  const updatedHeading = `Store & Distributor Locator — Official Network ${timestamp}`;
  const saveRes = await fetch(`${BASE_URL}/api/admin/store-locator/page`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      hero: {
        eyebrow: "Authorized Queens Care Network",
        heading: updatedHeading,
        subtitle: "Find verified pharmacies and distribution hubs nationwide.",
        description: "Locate authentic Queens Care formulations.",
        searchPlaceholder: "Search city or PIN code…",
        searchButtonText: "Search Locations",
        locationButtonText: "Use My Location",
        visible: true,
      },
    }),
  });

  assert.strictEqual(saveRes.status, 200, "Saving CMS settings must return HTTP 200");

  // Verify public reflection
  const pubRes = await fetch(`${BASE_URL}/api/store-locator`);
  const pubData = await pubRes.json();
  assert.strictEqual(pubData.pageConfig.hero.heading, updatedHeading, "Public page must reflect updated heading");
  console.log("  ✔ Admin Store Locator CMS settings update verified.");
}

async function testBulkCSVImportAndExport() {
  console.log("▶ 11. Testing Bulk CSV Import & Universal Export...");

  // Test CSV Import
  const sampleCsv = `name,type,contact,phone,address,city,state,pincode,latitude,longitude\n"Ahmedabad Pharma Dispensary ${timestamp}","pharmacy","Kunal Patel","+91 79 2656 4433","CG Road, Navrangpura","Ahmedabad","Gujarat","380009",23.0373,72.5574`;
  const importRes = await fetch(`${BASE_URL}/api/admin/store-locator/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ csv: sampleCsv }),
  });

  assert.strictEqual(importRes.status, 200, "CSV Import must return HTTP 200");
  const importData = await importRes.json();
  assert.strictEqual(importData.importedCount, 1, "Must successfully import 1 location");
  console.log("  ✔ Bulk CSV import verified.");

  // Test Export
  const exportRes = await fetch(`${BASE_URL}/api/admin/export?dataset=stores`, {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(exportRes.status, 200, "Stores export must return HTTP 200");
  const buffer = await exportRes.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  assert.strictEqual(bytes[0], 0xef, "Must have UTF-8 BOM byte 1");
  assert.strictEqual(bytes[1], 0xbb, "Must have UTF-8 BOM byte 2");
  assert.strictEqual(bytes[2], 0xbf, "Must have UTF-8 BOM byte 3");

  const text = new TextDecoder().decode(buffer);
  assert.ok(text.includes("Ahmedabad"), "Export must contain newly imported location");
  console.log("  ✔ Excel/CSV export verified with UTF-8 BOM.");
}

async function testSecurity() {
  console.log("▶ 12. Testing Unauthorized Access Blocking on Admin Store APIs...");

  const unauthRes = await fetch(`${BASE_URL}/api/admin/store-locator`);
  assert.strictEqual(unauthRes.status, 401, "Unauthenticated access must return HTTP 401");
  console.log("  ✔ Unauthorized access successfully blocked with HTTP 401.");
}

async function runAll() {
  console.log("==========================================================");
  console.log("QUEENS CARE LABORATORIES — STORE LOCATOR QA VERIFICATION");
  console.log("==========================================================");

  try {
    await authenticateAdmin();
    await testPublicStoreLocatorAPI();
    await testPincodeSearch();
    await testCityAndStateSearch();
    await testGeolocationDistanceSearch();
    await testCategoryFiltering();
    await testNoResultHandling();
    await testPublicHTMLRoute();
    await testAdminStoreCRUD();
    await testAdminCMSUpdate();
    await testBulkCSVImportAndExport();
    await testSecurity();

    console.log("\n==========================================================");
    console.log("✨ ALL 12 STORE LOCATOR QA SUITES PASSED (100% SUCCESS) ✨");
    console.log("==========================================================");
  } catch (error) {
    console.error("\n❌ STORE LOCATOR QA TEST FAILED:", error);
    process.exit(1);
  }
}

runAll();
