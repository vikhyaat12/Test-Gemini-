// Queens Care Laboratories — Live Integration Verification Script
import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("============================================================");
  console.log("QUEENS CARE LABORATORIES — LIVE END-TO-END VERIFICATION");
  console.log("============================================================\n");

  // Helper for requests
  let adminCookie = "";
  async function fetchWithCookie(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(adminCookie ? { Cookie: adminCookie } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers, redirect: "manual" });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie && setCookie.includes("qc_session=")) {
      adminCookie = setCookie.split(";")[0];
    }
    return res;
  }

  // 1. VERIFY ADMIN ROUTE REDIRECT (UNAUTHENTICATED)
  console.log("1. Testing Admin Route Redirection (Unauthenticated)...");
  const adminUnauth = await fetchWithCookie("/admin");
  console.log(`   Status: ${adminUnauth.status}`);
  const redirectLoc = adminUnauth.headers.get("location") || "";
  console.log(`   Redirect Location: ${redirectLoc}`);
  assert(adminUnauth.status === 307 || adminUnauth.status === 302 || redirectLoc.includes("/admin/login"), "Unauthenticated /admin must redirect to /admin/login");
  console.log("   ✓ Unauthenticated /admin correctly redirects to /admin/login\n");

  // 2. VERIFY ADMIN LOGIN
  console.log("2. Testing Admin Login with seeded credentials (admin@queenscare.in)...");
  const loginRes = await fetchWithCookie("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@queenscare.in", password: "QueensCare#Admin2026" }),
  });
  const loginData = await loginRes.json();
  console.log(`   Login Response:`, loginData);
  assert(loginData.user && loginData.user.role === "admin", "Seeded admin login must succeed");
  console.log("   ✓ Admin authenticated successfully with session cookie\n");

  // 3. VERIFY AUTHENTICATED ADMIN ACCESS
  console.log("3. Testing /api/auth/me for authenticated admin...");
  const meRes = await fetchWithCookie("/api/auth/me");
  const meData = await meRes.json();
  console.log(`   Me Data:`, meData);
  assert(meData.user?.role === "admin", "Current session must identify as admin");
  console.log("   ✓ Admin session verified\n");

  // 4. VERIFY PUBLIC BLOG LISTING & DETAIL VIEW
  console.log("4. Testing Public Blog (/blog and /api/blog)...");
  const blogListRes = await fetchWithCookie("/api/blog");
  const blogListData = await blogListRes.json();
  console.log(`   Blog Posts Count: ${blogListData.posts?.length}`);
  assert(blogListData.posts && blogListData.posts.length > 0, "Public blog must return published posts");
  const demoPost = blogListData.posts[0];
  console.log(`   Sample Post Slug: ${demoPost.slug} | Title: "${demoPost.title}"`);
  
  const blogDetailRes = await fetchWithCookie(`/blog/${demoPost.slug}`);
  console.log(`   Blog Detail Page Status: ${blogDetailRes.status}`);
  assert(blogDetailRes.status === 200, "Blog detail page must load with 200 OK");
  console.log("   ✓ Public Blog archive and detail view working\n");

  // 5. TEST ADMIN CREATING A BLOG POST & PERSISTENCE
  console.log("5. Testing Blog Post Creation via Admin API...");
  const newPostPayload = {
    title: "The Biochemistry of Morning Sunlight",
    slug: "biochemistry-morning-sunlight-test",
    excerpt: "Why photons before screen-time reshape cortisol, dopamine, and mitochondrial ATP.",
    body: "<p>Early morning light contains a unique ratio of infrared and blue wavelengths that entrains the suprachiasmatic nucleus.</p>",
    category: "Expert series",
    author: "Dr. Vikram Singhania",
    readTime: "5 min read",
    published: true,
    visible: true,
  };
  const createBlogRes = await fetchWithCookie("/api/admin/blog", {
    method: "POST",
    body: JSON.stringify(newPostPayload),
  });
  const createBlogData = await createBlogRes.json();
  console.log("   Created Blog Post:", createBlogData.post?.slug);
  assert(createBlogData.post?.slug === "biochemistry-morning-sunlight-test", "Admin post creation must succeed");

  // Verify it appears in public blog API
  const refreshedBlog = await fetchWithCookie("/api/blog");
  const refreshedBlogData = await refreshedBlog.json();
  const foundNew = refreshedBlogData.posts.find(p => p.slug === "biochemistry-morning-sunlight-test");
  assert(foundNew, "Newly created post must appear in /api/blog");
  console.log("   ✓ Newly created blog post appears in public blog feed and persists\n");

  // Clean up test post
  await fetchWithCookie("/api/admin/blog?id=biochemistry-morning-sunlight-test", { method: "DELETE" });

  // 6. VERIFY EMPLOYEE PORTAL & QR PROFILE
  console.log("6. Testing Employee Profile & QR Route (/employee/vikram-singhania)...");
  const empRes = await fetchWithCookie("/api/employee/vikram-singhania");
  const empData = await empRes.json();
  console.log("   Employee Data:", empData.employee?.name, "|", empData.employee?.designation);
  assert(empData.employee?.name === "Dr. Vikram Singhania", "Demo employee profile must exist");
  assert(empData.employee?.employeeId === "QC-EMP-1042", "Demo employee ID must match");
  console.log("   ✓ Demo employee profile and QR ID accessible\n");

  // 7. VERIFY B2B / DISTRIBUTOR APPLICATION FLOW
  console.log("7. Testing B2B Distributor Application Submission...");
  const b2bAppRes = await fetchWithCookie("/api/b2b/applications", {
    method: "POST",
    body: JSON.stringify({
      company: "Apex Wellness Clinics India",
      name: "Dr. Ananya Ray",
      email: "ananya.ray@apexwellness.in",
      phone: "+91 98450 99887",
      city: "Bengaluru",
      state: "Karnataka",
      type: "clinic",
      annualVolume: "₹25L - ₹50L",
      message: "Interested in dispensing Queens Care dermal and sleep formulations across 4 clinical branches.",
    }),
  });
  const b2bAppData = await b2bAppRes.json();
  console.log("   B2B Application Submitted:", b2bAppData.application?.id || b2bAppData.ok || "OK");
  assert(b2bAppRes.status === 200 || b2bAppRes.status === 201, "B2B application submission must succeed");
  console.log("   ✓ B2B application submitted and recorded\n");

  // 8. VERIFY AFFILIATE SYSTEM & TRACKING REDIRECT
  console.log("8. Testing Affiliate Joining, Link Creation & Click Tracking...");
  // Join affiliate
  const joinAffRes = await fetchWithCookie("/api/affiliate/join", { method: "POST" });
  const joinAffData = await joinAffRes.json();
  console.log("   Affiliate Code:", joinAffData.affiliate?.affiliateCode);
  assert(joinAffData.affiliate?.affiliateCode, "Affiliate account must be activated");
  const affCode = joinAffData.affiliate.affiliateCode;

  // Create custom link
  const createLinkRes = await fetchWithCookie("/api/affiliate/links", {
    method: "POST",
    body: JSON.stringify({ productId: "lumine-c-serum", customCode: "live-serum-test" }),
  });
  const createLinkData = await createLinkRes.json();
  console.log("   Custom Affiliate Link Created:", createLinkData.link?.shortCode);
  assert(createLinkData.link?.shortCode === "live-serum-test", "Custom tracking link creation must succeed");

  // Test tracking redirect /r/live-serum-test
  const trackingRedirect = await fetch(`${BASE_URL}/r/live-serum-test`, { redirect: "manual" });
  console.log(`   Tracking Redirect Status: ${trackingRedirect.status}`);
  const trackCookie = trackingRedirect.headers.get("set-cookie") || "";
  console.log(`   Set-Cookie in tracking route: ${trackCookie.includes("qc_affiliate_ref") ? "qc_affiliate_ref set!" : "missing"}`);
  assert(trackCookie.includes("qc_affiliate_ref"), "Tracking route must set qc_affiliate_ref cookie");
  console.log("   ✓ Affiliate tracking link redirect & cookie attribution working\n");

  // 9. VERIFY COUPONS & DISCOUNT LOGIC
  console.log("9. Testing Coupon Validation API (/api/coupons/validate)...");
  const cpnRes1 = await fetchWithCookie("/api/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code: "WELCOME10", subtotal: 1490 }),
  });
  const cpnData1 = await cpnRes1.json();
  console.log("   WELCOME10 on ₹1,490:", cpnData1);
  assert(cpnData1.valid === true && cpnData1.discount === 149, "WELCOME10 must calculate 10% (₹149) discount");

  const cpnRes2 = await fetchWithCookie("/api/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code: "FLAT200", subtotal: 1200 }),
  });
  const cpnData2 = await cpnRes2.json();
  console.log("   FLAT200 on ₹1,200 (below minOrder ₹1,500):", cpnData2);
  assert(cpnData2.valid === false, "FLAT200 must be rejected when order is under ₹1,500");
  console.log("   ✓ Coupon validation and discount computation verified\n");

  // 10. VERIFY DOCTOR PORTAL
  console.log("10. Testing Doctor Portal Registration (/api/doctor/register)...");
  const docRes = await fetchWithCookie("/api/doctor/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Dr. Rajesh Kothari",
      email: "dr.kothari@dermalcare.in",
      phone: "+91 98111 22334",
      clinic: "Kothari Skin & Wellness Clinic",
      specialty: "dermatology",
      qualification: "MBBS, MD (Dermatology)",
      regNumber: "MCI-489201",
      message: "Requesting clinical formulation data for Lumine-C.",
    }),
  });
  const docData = await docRes.json();
  console.log("   Doctor Registration Response:", docData);
  assert(docRes.status === 200 || docRes.status === 201, "Doctor registration must succeed");
  console.log("   ✓ Doctor registration working\n");

  console.log("============================================================");
  console.log("ALL REAL-WORLD INTEGRATION TESTS PASSED (10/10)!");
  console.log("============================================================");
}

main().catch((err) => {
  console.error("VERIFICATION FAILED:", err);
  process.exit(1);
});
