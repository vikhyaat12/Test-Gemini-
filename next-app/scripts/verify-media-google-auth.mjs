// @ts-check
import assert from "node:assert/strict";

const BASE = process.env.SITE_URL || "http://localhost:3000";

let adminCookie = "";

async function loginAdmin() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@queenscare.in", password: "AdminPassword123!" }),
  });
  assert.equal(res.status, 200, "Admin login must succeed");
  const cookie = res.headers.get("set-cookie");
  assert.ok(cookie, "Must return session cookie");
  adminCookie = cookie.split(";")[0];
  console.log("✓ Admin logged in successfully, session acquired");
}

async function testFileUpload() {
  console.log("\n--- TEST 1: File Upload API (/api/upload) ---");
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).slice(2);
  const dummySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#230c39"/><circle cx="50" cy="50" r="30" fill="#c59b27"/></svg>`;
  
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="folder"`,
    ``,
    `logos`,
    `--${boundary}`,
    `Content-Disposition: form-data; name="files"; filename="brand-test-logo.svg"`,
    `Content-Type: image/svg+xml`,
    ``,
    dummySvg,
    `--${boundary}--`,
    ``,
  ].join("\r\n");

  const res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Cookie: adminCookie,
    },
    body: Buffer.from(body),
  });

  assert.equal(res.status, 200, "Upload endpoint must return 200");
  const data = await res.json();
  assert.ok(data.files && data.files.length > 0, "Must return uploaded file info");
  assert.ok(data.files[0].url.startsWith("/uploads/logos/"), "URL must be saved in /uploads/logos/");
  console.log("✓ Uploaded SVG logo successfully:", data.files[0].url);
  return data.files[0].url;
}

async function testProductMediaAndGallery(logoUrl) {
  console.log("\n--- TEST 2: Product Multi-Media & Videos ---");
  const testImages = [
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1608248597359-218274577884?auto=format&fit=crop&w=800&q=80",
    logoUrl,
  ];
  const testVideos = [
    {
      id: "vid-test-1",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Lumine-C Clinical Regimen Demonstration",
      posterUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    },
  ];

  // Update Lumine-C product
  const patchRes = await fetch(`${BASE}/api/products/lumine-c-radiance-serum`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      images: testImages,
      image: testImages[0],
      videos: testVideos,
      video: testVideos[0].url,
      videoPoster: testVideos[0].posterUrl,
    }),
  });
  assert.equal(patchRes.status, 200, "Product update must return 200");
  console.log("✓ Product media updated with multi-images and YouTube video");

  // Fetch product to verify persistence
  const getRes = await fetch(`${BASE}/api/products/lumine-c-radiance-serum`);
  assert.equal(getRes.status, 200, "Product fetch must return 200");
  const pData = await getRes.json();
  const prod = pData.product;
  assert.ok(prod.images && prod.images.length >= 3, "Product must have updated images");
  assert.ok(prod.videos && prod.videos.length >= 1, "Product must have updated videos");
  assert.equal(prod.videos[0].url, testVideos[0].url, "Product video URL must match");
  console.log("✓ Verified product media persistence:", prod.images.length, "images,", prod.videos.length, "videos");
}

async function testAPlusContent() {
  console.log("\n--- TEST 3: A+ Content Management & Product Attachment ---");
  // List templates
  const listRes = await fetch(`${BASE}/api/admin/aplus`, { headers: { Cookie: adminCookie } });
  assert.equal(listRes.status, 200, "Admin A+ templates list must return 200");
  const listData = await listRes.json();
  assert.ok(listData.templates && listData.templates.length > 0, "Must have A+ templates");
  console.log(`✓ Loaded ${listData.templates.length} A+ templates`);

  // Create new A+ Template
  const newTplRes = await fetch(`${BASE}/api/admin/aplus`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      title: "Automated Test A+ Protocol",
      description: "Rigorous clinical validation story",
      category: "Science & Clinical",
      sections: [
        {
          type: "hero",
          heading: "State of the Art Cleanroom Formulation",
          text: "Engineered under ISO Class 5 cleanroom conditions.",
          imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1600&q=85",
          published: true,
        },
        {
          type: "comparison",
          heading: "Queens Care vs Generic Market Brands",
          items: [
            "Queens Care: High-bioavailability microencapsulation",
            "Generic: Raw unshielded active oxidizes quickly",
          ],
          published: true,
        },
      ],
      published: true,
    }),
  });
  assert.equal(newTplRes.status, 201, "Template creation must return 201");
  const newTplData = await newTplRes.json();
  const createdTpl = newTplData.template;
  assert.ok(createdTpl && createdTpl.id, "Created template must have id");
  console.log("✓ Created new A+ template:", createdTpl.id, `"${createdTpl.title}"`);

  // Attach template to Lumine-C
  const attachRes = await fetch(`${BASE}/api/admin/aplus`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      action: "attach",
      productId: "lumine-c-radiance-serum",
      templateId: createdTpl.id,
      sections: createdTpl.sections,
      published: true,
    }),
  });
  assert.equal(attachRes.status, 200, "Attach action must return 200");
  console.log("✓ Attached A+ content template to Lumine-C product");

  // Query product A+ content resolution
  const prodAPlusRes = await fetch(`${BASE}/api/products/lumine-c-radiance-serum/aplus`);
  assert.equal(prodAPlusRes.status, 200, "Product A+ API must return 200");
  const prodAPlusData = await prodAPlusRes.json();
  assert.ok(prodAPlusData.sections && prodAPlusData.sections.length === 2, "Must resolve 2 attached sections");
  assert.equal(prodAPlusData.published, true, "Must be published");
  console.log("✓ Verified product A+ content resolution and publishing");
}

async function testTestimonialMedia() {
  console.log("\n--- TEST 4: Testimonials Video & Image Media ---");
  const testRes = await fetch(`${BASE}/api/admin/testimonials`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: "Dr. Ananya Sharma",
      title: "Consultant Dermatologist, AIIMS",
      body: "Lumine-C provides exceptional antioxidant shielding without triggering trans-epidermal moisture loss.",
      rating: 5,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
      visible: true,
    }),
  });
  assert.equal(testRes.status, 200, "Testimonial creation must return 200");
  console.log("✓ Created testimonial with video & image media");

  // Verify public testimonials endpoint
  const pubRes = await fetch(`${BASE}/api/testimonials`);
  assert.equal(pubRes.status, 200, "Public testimonials endpoint must return 200");
  const pubData = await pubRes.json();
  const found = pubData.testimonials?.find((t) => t.name === "Dr. Ananya Sharma");
  assert.ok(found, "Created testimonial must appear in public testimonials list");
  console.log("✓ Verified testimonial public persistence");
}

async function testBannerMedia() {
  console.log("\n--- TEST 5: Banners Desktop & Mobile Video/Image Media ---");
  const banRes = await fetch(`${BASE}/api/admin/banners`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      title: "The Autumn Health & Dermal Ritual",
      subtitle: "Clinically formulated botanical essentials for restorative care.",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1600&q=85",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      mobileImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=85",
      link: "/shop",
      position: "hero",
      sort: 1,
      active: true,
    }),
  });
  assert.equal(banRes.status, 200, "Banner creation must return 200");
  console.log("✓ Created banner with desktop video and mobile image");

  const pubRes = await fetch(`${BASE}/api/banners`);
  assert.equal(pubRes.status, 200, "Public banners endpoint must return 200");
  const pubData = await pubRes.json();
  const found = pubData.banners?.find((b) => b.title === "The Autumn Health & Dermal Ritual");
  assert.ok(found, "Created banner must appear in public banners list");
  console.log("✓ Verified banner public persistence");
}

async function testLogoManagement(logoUrl) {
  console.log("\n--- TEST 6: Logo Management & Public Dimensions Settings ---");
  const saveSetting = async (key, value) => {
    const res = await fetch(`${BASE}/api/admin/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ key, value, group: "branding" }),
    });
    assert.equal(res.status, 200, `Setting ${key} must save`);
  };

  await saveSetting("logo_url", logoUrl);
  await saveSetting("logo_height_desktop", "42");
  await saveSetting("logo_height_mobile", "30");
  await saveSetting("logo_max_width", "200");
  console.log("✓ Saved logo settings: logo_url, desktop=42px, mobile=30px, max_width=200px");

  // Verify public settings API
  const getRes = await fetch(`${BASE}/api/settings`);
  assert.equal(getRes.status, 200, "Public settings API must return 200");
  const sData = await getRes.json();
  const map = Object.fromEntries(sData.settings.map((s) => [s.key, s.value]));
  assert.equal(map.logo_url, logoUrl, "logo_url must match");
  assert.equal(map.logo_height_desktop, "42", "logo_height_desktop must match");
  assert.equal(map.logo_height_mobile, "30", "logo_height_mobile must match");
  assert.equal(map.logo_max_width, "200", "logo_max_width must match");
  console.log("✓ Verified public logo settings persistence");
}

async function testGoogleAuthEndpoints() {
  console.log("\n--- TEST 7: Google OAuth Flow Endpoints ---");
  // Test /api/auth/google initiation endpoint
  const googleInitRes = await fetch(`${BASE}/api/auth/google`, { redirect: "manual" });
  assert.ok(
    googleInitRes.status === 302 || googleInitRes.status === 307,
    "Google OAuth initiation must return redirect"
  );
  const redirectLoc = googleInitRes.headers.get("location");
  assert.ok(redirectLoc, "Must have redirect location");
  console.log("✓ /api/auth/google redirects correctly to:", redirectLoc);

  // Test /api/auth/google/callback error handling when credentials missing
  const callbackRes = await fetch(`${BASE}/api/auth/google/callback?code=test-code`, { redirect: "manual" });
  assert.ok(callbackRes.status === 302 || callbackRes.status === 307, "Callback must handle code");
  const cbLoc = callbackRes.headers.get("location");
  console.log("✓ /api/auth/google/callback handles parameters gracefully, redirects to:", cbLoc);
}

async function main() {
  console.log("================================================================");
  console.log("QUEENS CARE LABORATORIES — MEDIA SYSTEM & GOOGLE AUTH E2E TEST");
  console.log("Target:", BASE);
  console.log("================================================================");

  await loginAdmin();
  const logoUrl = await testFileUpload();
  await testProductMediaAndGallery(logoUrl);
  await testAPlusContent();
  await testTestimonialMedia();
  await testBannerMedia();
  await testLogoManagement(logoUrl);
  await testGoogleAuthEndpoints();

  console.log("\n================================================================");
  console.log("🎉 ALL 7 TEST SUITES PASSED FLAWLESSLY WITH 100% PERSISTENCE!");
  console.log("================================================================");
}

main().catch((err) => {
  console.error("❌ VERIFICATION FAILED:", err);
  process.exit(1);
});
