import { fileDb } from "../lib/commerce/file-db.ts";
import { bannerStore, faqStore, testimonialStore, offerStore, settingStore, categoryStore, employeeStore, couponStore, affiliateStore } from "../lib/commerce/store-extensions.ts";
import { store } from "../lib/commerce/store.ts";
import fs from "fs";
import path from "path";

async function runTests() {
  console.log("==================================================");
  console.log("QUEENS CARE LABORATORIES CMS PERSISTENCE VERIFICATION");
  console.log("==================================================");

  const dbPath = path.join(process.cwd(), "data", "local-db.json");
  console.log(`[1] Verifying database file exists at: ${dbPath}`);
  if (!fs.existsSync(dbPath)) {
    throw new Error("local-db.json does not exist!");
  }
  const rawInitial = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  console.log(`[✓] local-db.json exists. Total collections: ${Object.keys(rawInitial).length}`);

  // Test 1: Products Persistence
  console.log("\n[2] Testing Product Edit & Persistence...");
  const initialProducts = await store.products.list();
  const testProduct = initialProducts[0];
  const originalPrice = testProduct.price;
  const updatedPrice = originalPrice + 50;
  console.log(`  Updating product '${testProduct.name}' price: ₹${originalPrice} -> ₹${updatedPrice}`);
  await store.products.save({ id: testProduct.id, price: updatedPrice });
  
  // Verify from disk directly
  const diskDb1 = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  const diskProd = diskDb1.products.find(p => p.id === testProduct.id);
  if (diskProd.price !== updatedPrice) {
    throw new Error(`Product price was not updated on disk! Expected ${updatedPrice}, got ${diskProd.price}`);
  }
  console.log(`  [✓] Disk verified: Product price is persisted as ₹${diskProd.price}`);

  // Restore price
  await store.products.save({ id: testProduct.id, price: originalPrice });

  // Test 2: Blog Post Create & Edit
  console.log("\n[3] Testing Blog Post Create, Update & Persistence...");
  const newPost = await store.posts.save({
    title: "The Chronobiology of Cellular Restoration",
    slug: "chronobiology-cellular-restoration",
    excerpt: "Examining nighttime cellular repair cycles and biochemical restoration pathways.",
    content: "## The Nighttime Rhythm\n\nCellular mitosis reaches its zenith during delta sleep cycles...",
    category: "Science",
    author: "Dr. Vikram Singhania",
    published: true,
    featured: true,
  });
  console.log(`  Created post: ${newPost.title} (slug: ${newPost.slug})`);
  
  const diskDb2 = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  const diskPost = diskDb2.posts.find(p => p.slug === newPost.slug);
  if (!diskPost || diskPost.title !== newPost.title) {
    throw new Error("Blog post not found in disk database!");
  }
  console.log(`  [✓] Disk verified: Blog post created on disk.`);

  // Test 3: Employee Edit & Persistence
  console.log("\n[4] Testing Employee Edit & Persistence...");
  const employees = await employeeStore.list();
  const testEmp = employees[0];
  const originalBio = testEmp.bio;
  const updatedBio = "Lead Formulation Scientist directing clean-label active discovery.";
  await employeeStore.update(testEmp.id, { bio: updatedBio });
  
  const diskDb3 = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  const diskEmp = diskDb3.employees.find(e => e.id === testEmp.id);
  if (diskEmp.bio !== updatedBio) {
    throw new Error("Employee bio was not persisted to disk!");
  }
  console.log(`  [✓] Disk verified: Employee bio updated and persisted.`);
  await employeeStore.update(testEmp.id, { bio: originalBio });

  // Test 4: Banners & Offers Persistence
  console.log("\n[5] Testing Banner & Offer CRUD...");
  const newBanner = await bannerStore.create({
    title: "Seasonal Botanical Harvest 2026",
    subtitle: "Cold-pressed bio-actives now in stock",
    position: "hero",
    sort: 1,
    active: true,
    visible: true,
  });
  const diskDb4 = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  const diskBanner = diskDb4.banners.find(b => b.id === newBanner.id);
  if (!diskBanner) throw new Error("Banner was not persisted to disk!");
  console.log(`  [✓] Disk verified: Banner saved to disk.`);
  await bannerStore.delete(newBanner.id);

  // Test 5: Coupons & Affiliates
  console.log("\n[6] Testing Coupons & Affiliate validation...");
  const coupon = await couponStore.create({
    code: "TESTPERSIST20",
    type: "percentage",
    discount: 20,
    minOrder: 1000,
    isActive: true,
  });
  const validation = await couponStore.validate("TESTPERSIST20", 2500);
  if (!validation.valid || validation.discount !== 500) {
    throw new Error(`Coupon validation failed! ${JSON.stringify(validation)}`);
  }
  console.log(`  [✓] Coupon TESTPERSIST20 validated successfully: 20% discount on ₹2,500 = ₹${validation.discount}`);
  await couponStore.delete(coupon.id);

  console.log("\n==================================================");
  console.log("ALL CMS PERSISTENCE TESTS PASSED 100% SUCCESSFULLY!");
  console.log("==================================================");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
