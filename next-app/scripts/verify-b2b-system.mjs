import assert from "assert";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let adminCookie = "";
let testAppId = "";
let testDocUrl = "";
const timestamp = Date.now();
const testEmail = `commercial.director.${timestamp}@testb2bpharma.in`;
const testCompany = `Apex Biocare Distribution LLP ${timestamp}`;

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

async function testPublicB2BConfig() {
  console.log("▶ 2. Testing Public B2B API (/api/b2b)...");
  const res = await fetch(`${BASE_URL}/api/b2b`);
  assert.strictEqual(res.status, 200, "Public B2B endpoint must return HTTP 200");

  const data = await res.json();
  assert.ok(data.pageConfig, "Response must include pageConfig");
  assert.ok(data.pageConfig.hero?.heading, "Hero heading must exist");
  assert.ok(Array.isArray(data.pageConfig.benefits?.cards), "Benefits cards array must exist");
  assert.ok(Array.isArray(data.pageConfig.partnershipTypes?.types), "Partnership types array must exist");
  assert.ok(Array.isArray(data.pageConfig.process?.steps), "Process steps array must exist");
  assert.ok(data.pageConfig.storeLocatorCta?.buttonLink === "/store-locator", "Store locator CTA must link to /store-locator");
  console.log("  ✔ Public B2B API returned valid page and section configurations.");
}

async function testPublicApplicationSubmission() {
  console.log("▶ 3. Testing Public B2B Application Submission with Multipart Document Upload (PDF & PAN)...");

  const formBoundary = `----WebKitFormBoundary${Math.random().toString(36).slice(2)}`;
  const samplePdfContent = `%PDF-1.4\n%Queens Care B2B Distribution Proposal\n1 0 obj\n<< /Title (Apex Biocare Distribution Proposal) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;

  const fields = {
    company: testCompany,
    businessType: "distributor",
    name: "Vikramaditya Singhania",
    designation: "Executive Director - Commercial Supply",
    email: testEmail,
    phone: "+91 98200 11223",
    whatsapp: "+91 98200 11223",
    website: "https://apexbiocare.example.com",
    address: "Plot 42, MIDC Industrial Area, Turbhe",
    city: "Navi Mumbai",
    state: "Maharashtra",
    country: "India",
    pincode: "400705",
    gstNumber: "27ABCDE1234F1Z5",
    drugLicence: "MH-RAI-20B-109283",
    panNumber: "AAACA1234E",
    yearsInBusiness: "14 years",
    distributionNetwork: "Supply network covering 450+ retail pharmacies and 18 hospital chains",
    storeCount: "450 pharmacies / 18 hospitals",
    regionsCovered: "Western Maharashtra (Mumbai MMR, Pune, Nashik, Kolhapur)",
    partnershipType: "distributor",
    productInterest: "Liko-Q, Lumine-C, Clinical Dermatology & Cosmeceuticals",
    requirementVolume: "2,500 - 5,000 units / month",
    territory: "Mumbai Metropolitan Region & Pune Division",
    existingBrands: "Cipla, Sun Pharma, Dr. Reddy's",
    additionalRequirements: "Temperature-controlled warehousing & cold-chain distribution compliant",
    message: "We have established distribution channels across western India and seek exclusive territory rights for Queens Care Laboratories product portfolio.",
    consent: "true",
  };

  let bodyParts = [];
  for (const [key, value] of Object.entries(fields)) {
    bodyParts.push(
      Buffer.from(`--${formBoundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`)
    );
  }

  bodyParts.push(
    Buffer.from(
      `--${formBoundary}\r\nContent-Disposition: form-data; name="document"; filename="Apex_Biocare_Distribution_Proposal.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
    )
  );
  bodyParts.push(Buffer.from(samplePdfContent));
  bodyParts.push(Buffer.from(`\r\n--${formBoundary}--\r\n`));

  const body = Buffer.concat(bodyParts);

  const res = await fetch(`${BASE_URL}/api/b2b/applications`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${formBoundary}`,
    },
    body,
  });

  const data = await res.json();
  assert.strictEqual(res.status, 201, `B2B Application submission must return 201 (Got: ${res.status} ${JSON.stringify(data)})`);
  assert.ok(data.success, "Response must indicate success");
  assert.ok(data.application?.id?.startsWith("QC-B2B-"), "Application ID must start with QC-B2B-");
  testAppId = data.application.id;
  console.log(`  ✔ B2B Application submitted successfully with Reference ID: ${testAppId}`);

  // Test Anti-Duplicate Protection
  console.log("▶ 4. Testing Anti-Duplicate Submission Check...");
  const dupRes = await fetch(`${BASE_URL}/api/b2b/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });

  assert.strictEqual(dupRes.status, 429, "Immediate duplicate submission must be rejected with HTTP 429");
  console.log("  ✔ Anti-duplicate submission protection confirmed.");
}

async function testAdminB2BListAndLifecycle() {
  console.log("▶ 5. Testing Admin B2B List & Lifecycle (/api/admin/b2b)...");

  const res = await fetch(`${BASE_URL}/api/admin/b2b`, {
    headers: { Cookie: adminCookie },
  });

  assert.strictEqual(res.status, 200, "Admin B2B endpoint must return HTTP 200");
  const data = await res.json();
  assert.ok(Array.isArray(data.applications), "Applications must be an array");

  const target = data.applications.find((a) => a.id === testAppId);
  assert.ok(target, `Submitted application ${testAppId} must exist in admin list`);
  assert.strictEqual(target.company, testCompany);
  assert.strictEqual(target.city, "Navi Mumbai");
  assert.strictEqual(target.gstNumber, "27ABCDE1234F1Z5");
  assert.strictEqual(target.panNumber, "AAACA1234E");
  assert.ok(target.documentUrl?.includes("/uploads/b2b-documents/"), `Document must be stored: ${target.documentUrl}`);
  testDocUrl = target.documentUrl;
  console.log(`  ✔ Found submitted enquiry in admin table with PAN and document: ${testDocUrl}`);

  // Update Status & Notes across lifecycle
  console.log("▶ 6. Testing Admin Status Lifecycle Transitions...");
  for (const st of ["reviewing", "contacted", "approved"]) {
    const patchRes = await fetch(`${BASE_URL}/api/admin/b2b/${testAppId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        status: st,
        notes: `Transitioned to ${st}. Commercial review in progress.`,
      }),
    });

    assert.strictEqual(patchRes.status, 200, `Status update to ${st} must return HTTP 200`);
    const patchData = await patchRes.json();
    assert.strictEqual(patchData.application.status, st, `Status must be ${st}`);
  }
  console.log(`  ✔ Application ${testAppId} lifecycle verified across reviewing → contacted → approved.`);
}

async function testDocumentSecurity() {
  console.log("▶ 7. Testing Document Security & Unauthorized Blocking...");

  const fileName = testDocUrl ? testDocUrl.split("/").pop() : "test.pdf";
  const unauthRes = await fetch(`${BASE_URL}/api/admin/b2b/document/${fileName}`);
  assert.strictEqual(unauthRes.status, 401, "Unauthorized access to candidate document must return HTTP 401");
  console.log("  ✔ Unauthorized partner document download blocked with HTTP 401.");

  const authRes = await fetch(`${BASE_URL}/api/admin/b2b/document/${fileName}`, {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(authRes.status, 200, "Authorized admin download must return HTTP 200");
  assert.strictEqual(authRes.headers.get("content-type"), "application/pdf", "Content-Type must be application/pdf");
  console.log("  ✔ Authorized admin document stream verified.");
}

async function testAdminB2BCMSAndCustomSections() {
  console.log("▶ 8. Testing Admin B2B Page CMS & Custom Sections (/api/admin/b2b/page)...");

  const getRes = await fetch(`${BASE_URL}/api/admin/b2b/page`, {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(getRes.status, 200, "Admin B2B page config GET must return 200");
  const initialConfig = (await getRes.json()).config;

  const updatedHeroHeading = `B2B & Distribution Partnerships — Western India Tier ${timestamp}`;
  const saveRes = await fetch(`${BASE_URL}/api/admin/b2b/page`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      hero: {
        ...initialConfig.hero,
        heading: updatedHeroHeading,
      },
      customSections: [
        {
          id: `custom-sec-${timestamp}`,
          heading: "cGMP Certified Warehouse Infrastructure",
          subheading: "Pan-India Cold Chain",
          content: "Temperature-controlled 15-25°C automated logistics facilities guaranteeing 100% molecular potency.",
          layout: "text_only",
          visible: true,
          sortOrder: 1,
        },
      ],
      storeLocatorCta: {
        heading: "Looking for Retail Stockists or Partner Clinics?",
        description: "Locate verified Queens Care retail pharmacies, authorized clinics, and regional stockists near you.",
        buttonText: "Find a Store / Distributor Near You →",
        buttonLink: "/store-locator",
        visible: true,
      },
    }),
  });

  assert.strictEqual(saveRes.status, 200, "Saving B2B CMS page settings must return 200");

  // Verify public reflection
  const publicRes = await fetch(`${BASE_URL}/api/b2b`);
  const publicData = await publicRes.json();
  assert.strictEqual(publicData.pageConfig.hero.heading, updatedHeroHeading, "Public B2B page must reflect updated heading");
  assert.ok(publicData.pageConfig.customSections?.length > 0, "Custom section must be exposed publicly");
  assert.strictEqual(publicData.pageConfig.storeLocatorCta?.buttonLink, "/store-locator", "Store locator CTA link verified");
  console.log("  ✔ Admin B2B CMS settings, custom sections, and Store Locator CTA verified.");
}

async function testFormDisableLifecycle() {
  console.log("▶ 9. Testing Form Master Switch (ON / OFF)...");

  // Disable form
  await fetch(`${BASE_URL}/api/admin/b2b/page`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      formConfig: { enabled: false, heading: "Enquiries Paused", description: "", submitButtonText: "", contactEmail: "b2b@queenscare.in", contactPhone: "" },
    }),
  });

  // Attempt submission while disabled
  const disabledRes = await fetch(`${BASE_URL}/api/b2b/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company: "Test Blocked Co",
      name: "Tester",
      email: `test.${Date.now()}@blocked.com`,
      phone: "+91 99999 88888",
      city: "Delhi",
      state: "Delhi",
    }),
  });

  assert.strictEqual(disabledRes.status, 403, "Submission while form is disabled must return HTTP 403");
  console.log("  ✔ Disabled form correctly rejects submissions with HTTP 403.");

  // Re-enable form
  await fetch(`${BASE_URL}/api/admin/b2b/page`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      formConfig: { enabled: true, heading: "Partnership & Distribution Enquiry", description: "Submit your organization's profile below.", submitButtonText: "Submit Partnership Enquiry →", contactEmail: "b2b@queenscare.in", contactPhone: "+91 (0) 11 4988 7700" },
    }),
  });
  console.log("  ✔ Form re-enabled successfully.");
}

async function testB2BExport() {
  console.log("▶ 10. Testing Excel/CSV Export for B2B Leads (/api/admin/export?dataset=b2b)...");

  const res = await fetch(`${BASE_URL}/api/admin/export?dataset=b2b`, {
    headers: { Cookie: adminCookie },
  });

  assert.strictEqual(res.status, 200, "Export route must return HTTP 200");
  assert.strictEqual(res.headers.get("content-type"), "text/csv; charset=utf-8", "Content-Type must be text/csv; charset=utf-8");

  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check UTF-8 BOM (0xEF, 0xBB, 0xBF)
  assert.strictEqual(bytes[0], 0xef, "First byte must be 0xEF (BOM)");
  assert.strictEqual(bytes[1], 0xbb, "Second byte must be 0xBB (BOM)");
  assert.strictEqual(bytes[2], 0xbf, "Third byte must be 0xBF (BOM)");

  const text = new TextDecoder().decode(buffer);
  assert.ok(text.includes("company"), "Header must include company");
  assert.ok(text.includes("gstNumber"), "Header must include gstNumber");
  assert.ok(text.includes("panNumber"), "Header must include panNumber");
  assert.ok(text.includes("partnershipType"), "Header must include partnershipType");
  assert.ok(text.includes(testCompany), "Exported file must contain test company");
  console.log("  ✔ Excel/CSV export verified with all extended B2B lead fields.");
}

async function cleanup() {
  console.log("▶ 11. Cleaning up test enquiry...");
  if (testAppId) {
    const res = await fetch(`${BASE_URL}/api/admin/b2b/${testAppId}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(res.status, 200, "Delete must return HTTP 200");
    console.log(`  ✔ Cleaned up test record: ${testAppId}`);
  }
}

async function runAll() {
  console.log("==================================================");
  console.log("QUEENS CARE LABORATORIES — DEDICATED B2B QA SUITE");
  console.log("==================================================");

  try {
    await authenticateAdmin();
    await testPublicB2BConfig();
    await testPublicApplicationSubmission();
    await testAdminB2BListAndLifecycle();
    await testDocumentSecurity();
    await testAdminB2BCMSAndCustomSections();
    await testFormDisableLifecycle();
    await testB2BExport();
    await cleanup();

    console.log("\n==================================================");
    console.log("✨ ALL 11 B2B QA TEST SUITES PASSED (100% SUCCESS) ✨");
    console.log("==================================================");
  } catch (error) {
    console.error("\n❌ B2B QA TEST FAILED:", error);
    process.exit(1);
  }
}

runAll();
