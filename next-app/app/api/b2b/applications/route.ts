import { json, requireUser } from "@/lib/http";
import { b2bStore, b2bPageStore } from "@/lib/commerce/store-extensions";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

const B2B_DOC_DIR = join(process.cwd(), "public", "uploads", "b2b-documents");
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET() {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  try {
    const applications = await b2bStore.applications.list();
    const userApps = user.role === "admin" ? applications : applications.filter((a) => a.email === user.email);
    return json({ applications: userApps });
  } catch {
    return json({ applications: [] });
  }
}

export async function POST(request: Request) {
  try {
    const pageConfig = await b2bPageStore.get();
    if (pageConfig.formConfig?.enabled === false) {
      return json({ error: "Partnership enquiries are currently paused for scheduled territory review. Please contact b2b@queenscare.in directly." }, 403);
    }

    const contentType = request.headers.get("content-type") || "";

    let company = "";
    let businessType = "distributor";
    let name = "";
    let designation = "";
    let email = "";
    let phone = "";
    let whatsapp = "";
    let website = "";
    let address = "";
    let city = "";
    let state = "";
    let country = "India";
    let pincode = "";
    let gstNumber = "";
    let drugLicence = "";
    let panNumber = "";
    let yearsInBusiness = "";
    let distributionNetwork = "";
    let storeCount = "";
    let regionsCovered = "";
    let partnershipType = "distributor";
    let productInterest = "";
    let requirementVolume = "";
    let territory = "";
    let existingBrands = "";
    let additionalRequirements = "";
    let message = "";
    let consent = true;
    let documentUrl = "";
    let documentFileName = "";
    let documentFileSize = 0;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      company = String(formData.get("company") || "").trim();
      businessType = String(formData.get("businessType") || "distributor").trim();
      name = String(formData.get("name") || "").trim();
      designation = String(formData.get("designation") || "").trim();
      email = String(formData.get("email") || "").trim();
      phone = String(formData.get("phone") || "").trim();
      whatsapp = String(formData.get("whatsapp") || "").trim();
      website = String(formData.get("website") || "").trim();
      address = String(formData.get("address") || "").trim();
      city = String(formData.get("city") || "").trim();
      state = String(formData.get("state") || "").trim();
      country = String(formData.get("country") || "India").trim();
      pincode = String(formData.get("pincode") || "").trim();
      gstNumber = String(formData.get("gstNumber") || "").trim();
      drugLicence = String(formData.get("drugLicence") || "").trim();
      panNumber = String(formData.get("panNumber") || formData.get("pan") || "").trim();
      yearsInBusiness = String(formData.get("yearsInBusiness") || "").trim();
      distributionNetwork = String(formData.get("distributionNetwork") || "").trim();
      storeCount = String(formData.get("storeCount") || "").trim();
      regionsCovered = String(formData.get("regionsCovered") || "").trim();
      partnershipType = String(formData.get("partnershipType") || formData.get("type") || "distributor").trim();
      productInterest = String(formData.get("productInterest") || "").trim();
      requirementVolume = String(formData.get("requirementVolume") || "").trim();
      territory = String(formData.get("territory") || "").trim();
      existingBrands = String(formData.get("existingBrands") || formData.get("existingBusiness") || "").trim();
      additionalRequirements = String(formData.get("additionalRequirements") || "").trim();
      message = String(formData.get("message") || "").trim();
      consent = formData.get("consent") !== "false";

      const docEntry = formData.get("document") || formData.get("file");
      if (docEntry && typeof docEntry === "object" && "arrayBuffer" in docEntry) {
        const file = docEntry as File;
        const fileSize = file.size || 0;
        const rawFileName = file.name || "document.pdf";
        if (fileSize > 0) {
          if (fileSize > MAX_DOC_SIZE) {
            return json({ error: "Document file size exceeds the 10MB limit." }, 400);
          }

          const ext = rawFileName.split(".").pop()?.toLowerCase() || "pdf";
          if (!["pdf", "doc", "docx", "jpg", "jpeg", "png"].includes(ext)) {
            return json({ error: "Unsupported file type. Please upload a PDF, DOC, DOCX, JPG, or PNG document." }, 400);
          }

          if (!existsSync(B2B_DOC_DIR)) {
            await mkdir(B2B_DOC_DIR, { recursive: true });
          }

          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const safeBaseName = rawFileName
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .slice(0, 40) || "b2b-doc";
          const filename = `${safeBaseName}-${Date.now()}.${ext}`;
          const filePath = join(B2B_DOC_DIR, filename);

          await writeFile(filePath, buffer);
          documentUrl = `/uploads/b2b-documents/${filename}`;
          documentFileName = rawFileName;
          documentFileSize = fileSize;
        }
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body) return json({ error: "Invalid request payload." }, 400);
      company = String(body.company || "").trim();
      businessType = String(body.businessType || "distributor").trim();
      name = String(body.name || "").trim();
      designation = String(body.designation || "").trim();
      email = String(body.email || "").trim();
      phone = String(body.phone || "").trim();
      whatsapp = String(body.whatsapp || "").trim();
      website = String(body.website || "").trim();
      address = String(body.address || "").trim();
      city = String(body.city || "").trim();
      state = String(body.state || "").trim();
      country = String(body.country || "India").trim();
      pincode = String(body.pincode || "").trim();
      gstNumber = String(body.gstNumber || "").trim();
      drugLicence = String(body.drugLicence || "").trim();
      panNumber = String(body.panNumber || body.pan || "").trim();
      yearsInBusiness = String(body.yearsInBusiness || "").trim();
      distributionNetwork = String(body.distributionNetwork || "").trim();
      storeCount = String(body.storeCount || "").trim();
      regionsCovered = String(body.regionsCovered || "").trim();
      partnershipType = String(body.partnershipType || body.type || "distributor").trim();
      productInterest = String(body.productInterest || "").trim();
      requirementVolume = String(body.requirementVolume || "").trim();
      territory = String(body.territory || "").trim();
      existingBrands = String(body.existingBrands || body.existingBusiness || "").trim();
      additionalRequirements = String(body.additionalRequirements || "").trim();
      message = String(body.message || "").trim();
      consent = body.consent !== false;
      documentUrl = String(body.documentUrl || "").trim();
      documentFileName = String(body.documentFileName || "").trim();
    }

    // Required fields validation
    if (!company || !name || !email || !phone) {
      return json({ error: "Company name, contact person name, email address, and phone number are required." }, 422);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Please enter a valid business email address." }, 422);
    }
    if (phone.replace(/[^0-9]/g, "").length < 8) {
      return json({ error: "Please enter a valid telephone/mobile number." }, 422);
    }

    // Anti-duplicate protection: check if same email and company submitted in last 2 minutes
    const existingApps = await b2bStore.applications.list();
    const isDuplicate = existingApps.some((a) => {
      const sameEmail = (a.email || "").toLowerCase() === email.toLowerCase();
      const sameCompany = (a.company || "").toLowerCase() === company.toLowerCase();
      const isRecent = a.createdAt ? Date.now() - new Date(a.createdAt).getTime() < 120000 : false;
      return sameEmail && sameCompany && isRecent;
    });

    if (isDuplicate) {
      return json({
        error: "A partnership enquiry for this organization was recently submitted. Our commercial partnerships team is currently processing your request.",
      }, 429);
    }

    const application = await b2bStore.applications.create({
      company,
      businessType,
      name,
      designation: designation || undefined,
      email,
      phone,
      whatsapp: whatsapp || undefined,
      website: website || undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      country: country || "India",
      pincode: pincode || undefined,
      gstNumber: gstNumber || undefined,
      drugLicence: drugLicence || undefined,
      panNumber: panNumber || undefined,
      yearsInBusiness: yearsInBusiness || undefined,
      distributionNetwork: distributionNetwork || undefined,
      storeCount: storeCount || undefined,
      regionsCovered: regionsCovered || undefined,
      partnershipType,
      type: partnershipType,
      productInterest: productInterest || undefined,
      requirementVolume: requirementVolume || undefined,
      territory: territory || undefined,
      existingBrands: existingBrands || undefined,
      additionalRequirements: additionalRequirements || undefined,
      message: message || undefined,
      documentUrl: documentUrl || undefined,
      documentFileName: documentFileName || undefined,
      documentFileSize: documentFileSize || undefined,
      consent,
    });

    // Optional email notification trigger (non-blocking)
    try {
      if (pageConfig.notifications?.adminNotificationEnabled) {
        console.log(`[B2B Commercial Alert] New partnership enquiry from ${company} (${name}, ${phone}) — ID: ${application.id}`);
      }
    } catch {}

    return json({
      success: true,
      message: "Thank you. Your partnership enquiry has been received. Our commercial partnerships lead will review your territory credentials and reach out within 2 business days.",
      application: {
        id: application.id,
        company: application.company,
        name: application.name,
        email: application.email,
        status: application.status,
        createdAt: application.createdAt,
      },
    }, 201);
  } catch (error: any) {
    console.error("B2B application error:", error);
    return json({ error: error?.message || "An unexpected error occurred while processing your enquiry. Please try again." }, 500);
  }
}
