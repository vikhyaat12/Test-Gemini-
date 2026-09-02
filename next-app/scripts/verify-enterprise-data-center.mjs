// scripts/verify-enterprise-data-center.mjs
// Comprehensive verification suite for B2B, Careers, Data Center, OTP Controls,
// Notification Templates, Google Sheets sync, and Universal CSV Exports.

const BASE_URL = "http://localhost:3000";

let adminCookie = "";

async function loginAdmin() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@queenscare.in",
      password: "QueensCare#Admin2026",
    }),
  });
  if (!res.ok) throw new Error(`Admin login failed: ${res.status}`);
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    adminCookie = setCookie.split(";")[0];
  }
  return adminCookie;
}

async function runTests() {
  console.log("==================================================================");
  console.log("  QUEENS CARE LABORATORIES — ENTERPRISE DATA CENTER VERIFICATION");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await loginAdmin();
    console.log("  ✓ Admin authenticated successfully.\n");
  } catch (err) {
    console.error("  ✗ Admin authentication failed:", err.message);
    process.exit(1);
  }

  // ── TEST 1: Public Careers Page ──────────────────────────────────────────
  console.log("1. Testing Public Career Portal (/careers)...");
  try {
    const res = await fetch(`${BASE_URL}/careers`);
    const html = await res.text();
    assert(res.status === 200, "Careers page returned HTTP 200");
    assert(html.includes("Careers at Queens Care Laboratories"), "Contains Careers header");
    assert(html.includes("Open Opportunities"), "Contains open opportunities section");
    assert(html.includes("Application Form"), "Contains application form section");
  } catch (e) {
    assert(false, `Careers page failed: ${e.message}`);
  }

  // ── TEST 2: Career Application Submission with Resume ─────────────────────
  console.log("\n2. Testing Career Application Submission with Resume File...");
  let submittedCandidateId = "";
  let resumeDownloadUrl = "";
  try {
    const formBoundary = "----WebKitFormBoundaryQueensCareTest";
    const sampleResumeContent = "%PDF-1.4 Mock Clinical Biochemist Resume Queens Care Laboratories";
    
    const body = [
      `--${formBoundary}`,
      `Content-Disposition: form-data; name="name"`,
      ``,
      `Dr. Ananya Iyer`,
      `--${formBoundary}`,
      `Content-Disposition: form-data; name="email"`,
      ``,
      `ananya.iyer.${Date.now()}@testqueenscare.in`,
      `--${formBoundary}`,
      `Content-Disposition: form-data; name="phone"`,
      ``,
      `+91 98765 11223`,
      `--${formBoundary}`,
      `Content-Disposition: form-data; name="position"`,
      ``,
      `Senior Formulation Scientist (R&D)`,
      `--${formBoundary}`,
      `Content-Disposition: form-data; name="location"`,
      ``,
      `New Delhi`,
      `--${formBoundary}`,
      `Content-Disposition: form-data; name="experience"`,
      ``,
      `6 Years Pharmaceutical Formulations & QC`,
      `--${formBoundary}`,
      `Content-Disposition: form-data; name="message"`,
      ``,
      `Passionate about clinical active integrity and micro-encapsulation research.`,
      `--${formBoundary}`,
      `Content-Disposition: form-data; name="resume"; filename="Dr_Ananya_Iyer_Resume.pdf"`,
      `Content-Type: application/pdf`,
      ``,
      sampleResumeContent,
      `--${formBoundary}--`,
      ``
    ].join("\r\n");

    const res = await fetch(`${BASE_URL}/api/careers/apply`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${formBoundary}`,
      },
      body,
    });

    const data = await res.json();
    if (res.status !== 201) console.log("Debug careers/apply error:", res.status, data);
    assert(res.status === 201 && data.success === true, "Career application submitted successfully (HTTP 201)");
    assert(data.application?.id?.startsWith("QC-CAR-"), `Unique candidate ID generated: ${data.application?.id}`);
    assert(data.application?.resumeUrl?.includes("/uploads/resumes/"), `Resume file saved to uploads: ${data.application?.resumeUrl}`);
    
    submittedCandidateId = data.application?.id;
    resumeDownloadUrl = data.application?.resumeUrl;
  } catch (e) {
    assert(false, `Career application submission failed: ${e.message}`);
  }

  // ── TEST 3: Dynamic Resume Asset Delivery ────────────────────────────────
  console.log("\n3. Testing Dynamic Resume Static Asset Serving (/uploads/resumes/...)...");
  try {
    if (resumeDownloadUrl) {
      const res = await fetch(`${BASE_URL}${resumeDownloadUrl}`);
      const text = await res.text();
      assert(res.status === 200, `Resume URL returned HTTP 200`);
      assert(res.headers.get("content-type")?.includes("application/pdf"), "Content-Type is application/pdf");
      assert(text.includes("Mock Clinical Biochemist Resume"), "Resume file content served intact");
    } else {
      assert(false, "No resume URL to test");
    }
  } catch (e) {
    assert(false, `Resume serving failed: ${e.message}`);
  }

  // ── TEST 4: Admin Careers Management & Status Lifecycle ─────────────────
  console.log("\n4. Testing Admin Career Applications Management & Status Update...");
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/careers`, {
      headers: { Cookie: adminCookie },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, "Admin careers list returned HTTP 200");
    const found = listData.applications?.find(a => a.id === submittedCandidateId);
    assert(Boolean(found), `Found submitted candidate in admin candidate table (${found?.name})`);

    // Update status to 'shortlisted'
    const patchRes = await fetch(`${BASE_URL}/api/admin/careers/${submittedCandidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ status: "shortlisted", notes: "Excellent R&D background, invited for round 1." }),
    });
    const patchData = await patchRes.json();
    assert(patchRes.status === 200, "Candidate status updated to 'shortlisted' (HTTP 200)");
    assert(patchData.application?.status === "shortlisted", "Verified status is shortlisted in DB");
  } catch (e) {
    assert(false, `Admin careers test failed: ${e.message}`);
  }

  // ── TEST 5: B2B Enquiry Submission & Persistence ────────────────────────
  console.log("\n5. Testing B2B Wholesale & Distribution Enquiry Submission...");
  let submittedB2BId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/b2b/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Vikram Malhotra",
        company: "Apex Medisurg Distributors LLP",
        email: "vikram@apexmedisurg.in",
        phone: "+91 98111 22334",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        businessType: "distributor",
        territory: "Western Maharashtra & Goa",
        gstNumber: "27AAACA1234A1Z5",
        drugLicence: "MH-WZ-2024-9988",
        existingBusiness: "Leading distributor of clinical dermatological and nutritional therapeutics across 240+ pharmacies.",
        productInterest: "Liko-Q 200ml Suspension, Lumine-C Topical Serum",
        requirementVolume: "2,500 units/month",
        message: "Looking for exclusive regional distribution rights for Queens Care Laboratories.",
      }),
    });
    const data = await res.json();
    assert(res.status === 201, "B2B application submitted successfully (HTTP 201)");
    assert(Boolean(data.application?.id), `Generated unique B2B ID: ${data.application?.id}`);
    submittedB2BId = data.application?.id;
  } catch (e) {
    assert(false, `B2B enquiry submission failed: ${e.message}`);
  }

  // ── TEST 6: Universal CSV / Excel Export Engine (All 7 Datasets) ──────────
  console.log("\n6. Testing Universal CSV / Excel Export Engine (All 7 Datasets)...");
  const datasets = [
    { id: "b2b", name: "B2B Leads", checkStr: "Apex Medisurg Distributors" },
    { id: "careers", name: "Career Applications", checkStr: "Dr. Ananya Iyer" },
    { id: "customers", name: "Registered Customers", checkStr: "admin@queenscare.in" },
    { id: "subscribers", name: "Newsletter Subscribers", checkStr: "email" },
    { id: "orders", name: "Orders & Transactions", checkStr: "total" },
    { id: "contacts", name: "Contact Enquiries", checkStr: "email" },
    { id: "reviews", name: "Product Reviews", checkStr: "rating" },
  ];

    for (const ds of datasets) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/export?dataset=${ds.id}`, {
        headers: { Cookie: adminCookie },
      });
      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);
      const csvText = buf.toString("utf-8");
      assert(res.status === 200, `Export [${ds.name}] returned HTTP 200`);
      assert(res.headers.get("content-type")?.includes("text/csv"), `Export [${ds.name}] Content-Type is text/csv`);
      assert(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF, `Export [${ds.name}] contains UTF-8 BOM (0xEF, 0xBB, 0xBF) for Microsoft Excel compatibility`);
      assert(csvText.includes(ds.checkStr), `Export [${ds.name}] contains expected data fields`);
    } catch (e) {
      assert(false, `Export [${ds.name}] failed: ${e.message}`);
    }
  }

  // ── TEST 7: OTP & Multi-Channel Security Configuration ───────────────────
  console.log("\n7. Testing OTP & Security Configuration Controls...");
  try {
    const saveRes = await fetch(`${BASE_URL}/api/admin/otp/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        emailOtpEnabled: true,
        smsOtpEnabled: true,
        whatsappOtpEnabled: false,
        expiryMinutes: 10,
        maxAttempts: 4,
        resendCooldownSeconds: 45,
      }),
    });
    const saveData = await saveRes.json();
    assert(saveRes.status === 200, "Saved OTP security settings (HTTP 200)");
    assert(saveData.settings?.emailOtpEnabled === true, "Email OTP enabled");
    assert(saveData.settings?.smsOtpEnabled === true, "SMS OTP enabled");
    assert(saveData.settings?.expiryMinutes === 10, "Expiry set to 10 minutes");

    const getRes = await fetch(`${BASE_URL}/api/admin/otp/settings`, {
      headers: { Cookie: adminCookie },
    });
    const getData = await getRes.json();
    assert(getData.settings?.resendCooldownSeconds === 45, "Fetched persisted OTP config across requests");
  } catch (e) {
    assert(false, `OTP settings test failed: ${e.message}`);
  }

  // ── TEST 8: Order Notification Rules Matrix & Dynamic Templates ──────────
  console.log("\n8. Testing Order Notification Rules Matrix & Dynamic Templates...");
  try {
    const customTemplate = "Clinical update: Hello {{customer_name}}, your Queens Care order {{order_id}} has been dispatched! Tracking: {{tracking_number}}.";
    const saveRes = await fetch(`${BASE_URL}/api/admin/notifications/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        order_placed: { event: "order_placed", title: "Order Placed", email: true, sms: false, whatsapp: false, template: "Hi {{customer_name}}, order {{order_id}} placed." },
        order_dispatched: { event: "order_dispatched", title: "Order Dispatched", email: true, sms: true, whatsapp: true, template: customTemplate },
      }),
    });
    const saveData = await saveRes.json();
    assert(saveRes.status === 200, "Saved Notification rules (HTTP 200)");
    assert(saveData.rules?.order_dispatched?.whatsapp === true, "WhatsApp channel enabled for dispatch event");
    assert(saveData.rules?.order_dispatched?.template === customTemplate, "Dynamic template variables preserved");

    const getRes = await fetch(`${BASE_URL}/api/admin/notifications/settings`, {
      headers: { Cookie: adminCookie },
    });
    const getData = await getRes.json();
    assert(getData.rules?.order_dispatched?.template.includes("{{customer_name}}"), "Fetched persisted notification rules from DB");
  } catch (e) {
    assert(false, `Notification rules test failed: ${e.message}`);
  }

  // ── TEST 9: Google Sheets Integration & Honest Status ────────────────────
  console.log("\n9. Testing Google Sheets Integration & Honest Status Reporting...");
  try {
    // Unconfigured state test
    const resetRes = await fetch(`${BASE_URL}/api/admin/googlesheets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ spreadsheetId: "", webhookUrl: "", enabled: false }),
    });
    const resetData = await resetRes.json();
    assert(resetData.config?.syncStatus === "not_configured", "Reports syncStatus: not_configured when keys are empty");

    // Sync trigger without credentials
    const testSyncRes = await fetch(`${BASE_URL}/api/admin/googlesheets`, {
      method: "PUT",
      headers: { Cookie: adminCookie },
    });
    const syncResult = await testSyncRes.json();
    assert(syncResult.status === "not_configured", "Honest provider response: does NOT fake success when unconfigured");
    assert(syncResult.message?.includes("not configured"), "Honest status message returned to Admin");
  } catch (e) {
    assert(false, `Google Sheets test failed: ${e.message}`);
  }

  console.log("\n==================================================================");
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
