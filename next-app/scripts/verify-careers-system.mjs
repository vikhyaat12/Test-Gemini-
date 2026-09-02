// @ts-check
import assert from "assert";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let adminCookie = "";

async function loginAdmin() {
  console.log("▶ 1. Authenticating Admin User...");
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@queenscare.in",
      password: "QueensCare#Admin2026",
    }),
  });

  assert.strictEqual(res.status, 200, "Admin login must succeed with HTTP 200");
  const cookieHeader = res.headers.get("set-cookie");
  assert.ok(cookieHeader, "Admin login must return Set-Cookie header");
  adminCookie = cookieHeader.split(";")[0];
  console.log("  ✔ Admin authenticated successfully.");
}

async function testPublicCareers() {
  console.log("▶ 2. Testing Public Careers API (/api/careers)...");
  const res = await fetch(`${BASE_URL}/api/careers`);
  assert.strictEqual(res.status, 200, "Public careers endpoint must return 200");
  const data = await res.json();

  assert.ok(data.pageConfig, "Response must include pageConfig");
  assert.ok(data.pageConfig.hero, "pageConfig must contain hero section");
  assert.ok(Array.isArray(data.jobs), "Response must include jobs array");
  assert.ok(data.jobs.length >= 4, "Must have at least 4 default seeded jobs");

  const formulationJob = data.jobs.find((j) => j.slug === "senior-formulation-scientist-rd");
  assert.ok(formulationJob, "Must contain senior-formulation-scientist-rd job");
  assert.strictEqual(formulationJob.department, "Research & Development");
  console.log(`  ✔ Public Careers API returned ${data.jobs.length} jobs and valid page configuration.`);
}

async function testSingleJobDetail() {
  console.log("▶ 3. Testing Single Job Detail API (/api/careers/jobs/[slug])...");
  const res = await fetch(`${BASE_URL}/api/careers/jobs/senior-formulation-scientist-rd`);
  assert.strictEqual(res.status, 200, "Single job endpoint must return 200");
  const data = await res.json();

  assert.ok(data.job, "Must return job details");
  assert.strictEqual(data.job.title, "Senior Formulation Scientist (R&D)");
  assert.ok(Array.isArray(data.job.responsibilities), "Must have responsibilities array");
  assert.ok(Array.isArray(data.job.requirements), "Must have requirements array");
  assert.ok(Array.isArray(data.job.skills), "Must have skills array");
  assert.ok(Array.isArray(data.job.benefits), "Must have benefits array");
  console.log("  ✔ Single job detail API returned complete specifications.");
}

let testAppId = "";

async function testPublicApplicationSubmission() {
  console.log("▶ 4. Testing Public Application Submission (/api/careers/apply)...");
  const payload = {
    name: "Dr. Ananya Sharma",
    email: `ananya.sharma.${Date.now()}@example.com`,
    phone: "+91 98765 43210",
    whatsapp: "+91 98765 43210",
    city: "New Delhi",
    position: "Senior Formulation Scientist (R&D)",
    jobId: "QC-JOB-RD-01",
    department: "Research & Development",
    experience: "5.5 Years",
    currentCompany: "National Institute of Pharmaceutical Education and Research",
    currentDesignation: "Postdoctoral Research Associate",
    highestQualification: "Ph.D. in Pharmaceutics",
    linkedinUrl: "https://linkedin.com/in/ananya-sharma-pharma",
    portfolioUrl: "https://scholar.google.com/citations?user=ananyasharma",
    message: "I have 5+ years of specialized experience formulating micro-encapsulated topical actives with verified clinical bio-availability.",
    consent: true,
  };

  const res = await fetch(`${BASE_URL}/api/careers/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (res.status !== 201) console.log("Debug error response:", res.status, data);
  assert.strictEqual(res.status, 201, "Application submission must return 201 Created");
  assert.ok(data.success, "Response must indicate success");
  assert.ok(data.application?.id?.startsWith("QC-CAR-"), "Application ID must start with QC-CAR-");
  testAppId = data.application.id;
  console.log(`  ✔ Application submitted successfully with Reference ID: ${testAppId}`);

  // Test Anti-Duplicate Protection
  console.log("▶ 5. Testing Anti-Duplicate Submission Check...");
  const dupRes = await fetch(`${BASE_URL}/api/careers/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert.strictEqual(dupRes.status, 429, "Duplicate submission must return 429 Too Many Requests");
  console.log("  ✔ Anti-duplicate submission protection confirmed.");
}

async function testAdminCareersCMS() {
  console.log("▶ 6. Testing Admin Careers CMS Settings (/api/admin/careers/page)...");
  const getRes = await fetch(`${BASE_URL}/api/admin/careers/page`, {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(getRes.status, 200, "Admin careers page GET must return 200");
  const currentConfig = (await getRes.json()).config;

  const updateRes = await fetch(`${BASE_URL}/api/admin/careers/page`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      hero: {
        ...currentConfig.hero,
        heading: "Curiosity, Precision, and the Science of Wellbeing. (Verified QA)",
      },
    }),
  });
  assert.strictEqual(updateRes.status, 200, "Admin careers page POST must return 200");
  const updatedConfig = (await updateRes.json()).config;
  assert.ok(updatedConfig.hero.heading.includes("Verified QA"), "Hero heading must update");
  console.log("  ✔ Admin Careers CMS settings update verified.");
}

let createdJobId = "";

async function testAdminJobCRUD() {
  console.log("▶ 7. Testing Admin Jobs Management CRUD (/api/admin/careers/jobs)...");
  
  // 1. Create Job
  const createRes = await fetch(`${BASE_URL}/api/admin/careers/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      title: "Clinical Trials & Medical Affairs Director",
      department: "Medical Affairs",
      location: "New Delhi / Remote",
      workMode: "Hybrid",
      employmentType: "Full-Time",
      experience: "8-12 Years",
      qualification: "MD Pharmacology / MBBS + Ph.D.",
      salaryRange: "₹28 - ₹38 LPA",
      description: "Direct multicenter Phase III/IV dermatological clinical trials and investigator-initiated studies.",
      responsibilities: ["Design clinical study protocols", "Oversee GCP compliance"],
      requirements: ["MD/MBBS with 8+ years clinical experience"],
      skills: ["Clinical Trials", "GCP Compliance", "Medical Writing"],
      benefits: ["Executive health plan", "Global travel allowance"],
      active: true,
      published: true,
      featured: true,
    }),
  });
  assert.strictEqual(createRes.status, 201, "Job creation must return 201 Created");
  const createdData = await createRes.json();
  createdJobId = createdData.job.id;
  assert.ok(createdJobId, "Created job must have an ID");
  console.log(`  ✔ Created new job: "${createdData.job.title}" (${createdJobId})`);

  // 2. Patch Job
  const patchRes = await fetch(`${BASE_URL}/api/admin/careers/jobs/${createdJobId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ salaryRange: "₹30 - ₹40 LPA" }),
  });
  assert.strictEqual(patchRes.status, 200, "Job patch must return 200");
  const patchedData = await patchRes.json();
  assert.strictEqual(patchedData.job.salaryRange, "₹30 - ₹40 LPA");
  console.log("  ✔ Patched job salary range verified.");

  // 3. Duplicate Job
  const dupRes = await fetch(`${BASE_URL}/api/admin/careers/jobs/${createdJobId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ _action: "duplicate" }),
  });
  assert.strictEqual(dupRes.status, 201, "Job duplication must return 201 Created");
  const dupData = await dupRes.json();
  assert.ok(dupData.job.title.includes("(Copy)"), "Duplicated job must have (Copy) in title");
  console.log(`  ✔ Duplicated job as draft: "${dupData.job.title}"`);

  // 4. Delete Duplicated Job
  const delDupRes = await fetch(`${BASE_URL}/api/admin/careers/jobs/${dupData.job.id}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(delDupRes.status, 200, "Job deletion must return 200");
  console.log("  ✔ Cleaned up duplicated job.");
}

async function testAdminApplicationLifecycle() {
  console.log("▶ 8. Testing Admin Application Lifecycle & Status Changes...");
  assert.ok(testAppId, "Must have testAppId from previous step");

  const patchRes = await fetch(`${BASE_URL}/api/admin/careers/${testAppId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ status: "shortlisted", notes: "Excellent R&D pedigree, scheduled for technical interview round." }),
  });
  assert.strictEqual(patchRes.status, 200, "Application status update must return 200");
  const patched = await patchRes.json();
  assert.strictEqual(patched.application.status, "shortlisted");
  console.log(`  ✔ Candidate application ${testAppId} transitioned to 'shortlisted' with HR notes.`);
}

async function testResumeSecurity() {
  console.log("▶ 9. Testing Resume Security & Unauthorized Blocking...");
  // Unauthorized request without cookie
  const unauthRes = await fetch(`${BASE_URL}/api/admin/careers/resume/test-resume.pdf`);
  assert.strictEqual(unauthRes.status, 401, "Unauthorized access to candidate resumes must return 401");
  console.log("  ✔ Unauthorized candidate resume download blocked with HTTP 401.");
}

async function testCSVExport() {
  console.log("▶ 10. Testing Excel/CSV Export for Careers (/api/admin/export?dataset=careers)...");
  const res = await fetch(`${BASE_URL}/api/admin/export?dataset=careers`, {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(res.status, 200, "Careers export must return 200");
  const text = await res.text();
  assert.ok(text.includes("whatsapp"), "Export must include whatsapp column");
  assert.ok(text.includes("highestQualification"), "Export must include highestQualification column");
  assert.ok(text.includes("linkedinUrl"), "Export must include linkedinUrl column");
  console.log("  ✔ Excel/CSV export verified with all extended candidate fields.");
}

async function runAll() {
  console.log("==================================================");
  console.log("QUEENS CARE LABORATORIES — DEDICATED CAREERS QA SUITE");
  console.log("==================================================");

  try {
    await loginAdmin();
    await testPublicCareers();
    await testSingleJobDetail();
    await testPublicApplicationSubmission();
    await testAdminCareersCMS();
    await testAdminJobCRUD();
    await testAdminApplicationLifecycle();
    await testResumeSecurity();
    await testCSVExport();

    console.log("\n==================================================");
    console.log("✨ ALL 10 CAREERS QA TEST SUITES PASSED (100% SUCCESS) ✨");
    console.log("==================================================");
  } catch (err) {
    console.error("\n❌ CAREERS QA TEST FAILED:", err);
    process.exit(1);
  }
}

runAll();
