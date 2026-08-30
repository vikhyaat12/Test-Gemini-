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

async function testEmployeeSystem() {
  console.log("==========================================================================");
  console.log("QUEENS CARE LABORATORIES — EMPLOYEE SYSTEM DEEP AUDIT & VERIFICATION");
  console.log("==========================================================================");

  await loginAdmin();

  const testSlug = `dr-vikram-singhania-lead-${Date.now().toString().slice(-4)}`;
  const employeePayload = {
    name: "Dr. Vikram Singhania, M.D., Ph.D.",
    slug: testSlug,
    employeeId: "QCL-DIR-8801",
    designation: "Chief Medical Director & Senior Formulation Lead",
    department: "Clinical Dermatology & Pharmaceutical R&D",
    email: "vikram.singhania@queenscare.in",
    phone: "+91 98201 54321",
    bio: "Dr. Vikram Singhania leads the advanced clinical dermatology and antioxidant stabilization programs at Queens Care Laboratories. He holds dual doctorates in Molecular Dermatology and Clinical Pharmacology from King's College London, with over 18 peer-reviewed publications on ascorbic acid transdermal bioavailability.",
    active: true,
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=85",
    photoSettings: {
      desktopSize: 200,
      mobileSize: 140,
      borderRadius: 25,
      borderWidth: 4,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true,
    },
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=85",
        caption: "ISO Class 5 Cleanroom Formulation Suite",
      },
      {
        url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=85",
        caption: "Spectrometry & Bioavailability Assay",
      },
      {
        url: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=85",
        caption: "Clinical Trial Phase III Results Evaluation",
      },
    ],
    videos: [
      {
        id: "emp-vid-1",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Keynote Address: Dermal Penetration of Micro-Encapsulated Ascorbic Acid",
        posterUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=85",
      },
      {
        id: "emp-vid-2",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        title: "Laboratory Cleanroom Tour & Quality Control Walkthrough",
        posterUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=85",
      },
    ],
  };

  // 1. Create Employee via POST /api/admin/employees
  console.log("\n[TEST 1] Create Employee with full media, photo controls, gallery & videos");
  const createRes = await fetch(`${BASE}/api/admin/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify(employeePayload),
  });
  assert.equal(createRes.status, 201, "Employee creation must succeed with 201");
  const createData = await createRes.json();
  const createdEmp = createData.employee;
  assert.ok(createdEmp.id, "Created employee must have ID");
  console.log("✓ Test 1 Passed: Employee created with ID:", createdEmp.id);

  // 2. Fetch via Admin API GET /api/admin/employees
  console.log("\n[TEST 2] Verify Employee in Admin API");
  const adminListRes = await fetch(`${BASE}/api/admin/employees`, { headers: { Cookie: adminCookie } });
  assert.equal(adminListRes.status, 200);
  const adminListData = await adminListRes.json();
  const foundAdminEmp = adminListData.employees.find((e) => e.slug === testSlug || e.id === createdEmp.id);
  assert.ok(foundAdminEmp, "Employee must be in Admin API list");
  assert.equal(foundAdminEmp.gallery.length, 3, "Must have 3 gallery items");
  assert.equal(foundAdminEmp.videos.length, 2, "Must have 2 videos");
  assert.equal(foundAdminEmp.photoSettings.desktopSize, 200, "Must have desktopSize=200");
  assert.equal(foundAdminEmp.photoSettings.borderRadius, 25, "Must have borderRadius=25");
  console.log("✓ Test 2 Passed: Admin API returned complete employee payload with media & photoSettings");

  // 3. Fetch via Public API GET /api/employee/[slug]
  console.log("\n[TEST 3] Verify Public Employee API GET /api/employee/[slug]");
  const pubApiRes = await fetch(`${BASE}/api/employee/${testSlug}`);
  assert.equal(pubApiRes.status, 200);
  const pubApiData = await pubApiRes.json();
  assert.equal(pubApiData.employee.name, employeePayload.name);
  assert.equal(pubApiData.employee.gallery.length, 3);
  assert.equal(pubApiData.employee.videos.length, 2);
  assert.equal(pubApiData.employee.photoSettings.desktopSize, 200);
  console.log("✓ Test 3 Passed: Public API returned full public fields & media");

  // 4. Request Public Employee Page GET /employee/[slug]
  console.log("\n[TEST 4] Verify Public HTML Render GET /employee/[slug]");
  const htmlRes = await fetch(`${BASE}/employee/${testSlug}`);
  assert.equal(htmlRes.status, 200);
  const html = await htmlRes.text();
  assert.ok(html.includes("Dr. Vikram Singhania"), "Public page must contain employee name");
  assert.ok(html.includes("Chief Medical Director"), "Public page must contain designation");
  assert.ok(html.includes("Official Staff Directory") || html.includes("VERIFIED ACTIVE EMPLOYEE"), "Public page must contain verified badge");
  assert.ok(html.includes("Professional Profile &amp; Clinical Experience") || html.includes("Professional Profile & Clinical Experience"), "Public page must contain bio section");
  console.log("✓ Test 4 Passed: Public employee page rendered verified HTML with luxury styling");

  // 5. Request Employee Directory GET /employee
  console.log("\n[TEST 5] Verify Staff Directory Page GET /employee");
  const dirRes = await fetch(`${BASE}/employee`);
  assert.equal(dirRes.status, 200);
  const dirHtml = await dirRes.text();
  assert.ok(dirHtml.includes("Clinical &amp; Scientific Leadership") || dirHtml.includes("Clinical & Scientific Leadership"));
  assert.ok(dirHtml.includes("Dr. Vikram Singhania"));
  console.log("✓ Test 5 Passed: Staff directory page includes new employee card");

  // 6. Test Photo & Controls Update via PATCH /api/admin/employees
  console.log("\n[TEST 6] Update Employee Photo Settings (desktopSize=240, borderRadius=50, borderWidth=6)");
  const patchRes = await fetch(`${BASE}/api/admin/employees`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      id: createdEmp.id,
      photoSettings: {
        desktopSize: 240,
        mobileSize: 150,
        borderRadius: 50,
        borderWidth: 6,
        borderColor: "#D4AF37",
        objectFit: "cover",
        shadow: true,
      },
    }),
  });
  assert.equal(patchRes.status, 200);

  const updatedPubApi = await (await fetch(`${BASE}/api/employee/${testSlug}`)).json();
  assert.equal(updatedPubApi.employee.photoSettings.desktopSize, 240);
  assert.equal(updatedPubApi.employee.photoSettings.borderRadius, 50);
  assert.equal(updatedPubApi.employee.photoSettings.borderWidth, 6);
  console.log("✓ Test 6 Passed: Photo presentation controls updated and verified in public API");

  console.log("\n==========================================================================");
  console.log("🎉 ALL EMPLOYEE CMS & PUBLIC PROFILE TESTS PASSED WITH 100% SUCCESS!");
  console.log("==========================================================================");
}

testEmployeeSystem().catch((err) => {
  console.error("❌ EMPLOYEE TEST FAILED:", err);
  process.exit(1);
});
