import { json } from "@/lib/http";
import { careerStore, careerPageStore, careerJobStore } from "@/lib/commerce/store-extensions";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const RESUME_UPLOAD_DIR = join(process.cwd(), "public", "uploads", "resumes");
const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let name = "";
    let email = "";
    let phone = "";
    let whatsapp = "";
    let city = "";
    let position = "";
    let jobId = "";
    let department = "";
    let experience = "";
    let currentCompany = "";
    let currentDesignation = "";
    let highestQualification = "";
    let linkedinUrl = "";
    let portfolioUrl = "";
    let message = "";
    let consent = true;
    let resumeUrl = "";
    let resumeFileName = "";
    let resumeFileSize = 0;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = String(formData.get("name") || "").trim();
      email = String(formData.get("email") || "").trim();
      phone = String(formData.get("phone") || "").trim();
      whatsapp = String(formData.get("whatsapp") || "").trim();
      city = String(formData.get("city") || formData.get("location") || "").trim();
      position = String(formData.get("position") || "").trim();
      jobId = String(formData.get("jobId") || "").trim();
      department = String(formData.get("department") || "").trim();
      experience = String(formData.get("experience") || "").trim();
      currentCompany = String(formData.get("currentCompany") || "").trim();
      currentDesignation = String(formData.get("currentDesignation") || "").trim();
      highestQualification = String(formData.get("highestQualification") || "").trim();
      linkedinUrl = String(formData.get("linkedinUrl") || "").trim();
      portfolioUrl = String(formData.get("portfolioUrl") || "").trim();
      message = String(formData.get("message") || "").trim();
      consent = formData.get("consent") !== "false";

      const resumeEntry = formData.get("resume");
      if (resumeEntry && typeof resumeEntry === "object" && "arrayBuffer" in resumeEntry) {
        const resumeFile = resumeEntry as File;
        const fileSize = resumeFile.size || 0;
        const rawFileName = resumeFile.name || "resume.pdf";
        if (fileSize > 0) {
          if (fileSize > MAX_RESUME_SIZE) {
            return json({ error: "Resume file size exceeds the 10MB limit." }, 400);
          }

          const ext = rawFileName.split(".").pop()?.toLowerCase() || "pdf";
          if (!["pdf", "doc", "docx"].includes(ext)) {
            return json({ error: "Unsupported file type. Please upload a PDF, DOC, or DOCX document." }, 400);
          }

          if (!existsSync(RESUME_UPLOAD_DIR)) {
            await mkdir(RESUME_UPLOAD_DIR, { recursive: true });
          }

          const bytes = await resumeFile.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const safeBaseName = rawFileName
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .slice(0, 40) || "resume";
          const filename = `${safeBaseName}-${Date.now()}.${ext}`;
          const filePath = join(RESUME_UPLOAD_DIR, filename);

          await writeFile(filePath, buffer);
          resumeUrl = `/uploads/resumes/${filename}`;
          resumeFileName = rawFileName;
          resumeFileSize = fileSize;
        }
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body) return json({ error: "Invalid request payload." }, 400);
      name = String(body.name || "").trim();
      email = String(body.email || "").trim();
      phone = String(body.phone || "").trim();
      whatsapp = String(body.whatsapp || "").trim();
      city = String(body.city || body.location || "").trim();
      position = String(body.position || "").trim();
      jobId = String(body.jobId || "").trim();
      department = String(body.department || "").trim();
      experience = String(body.experience || "").trim();
      currentCompany = String(body.currentCompany || "").trim();
      currentDesignation = String(body.currentDesignation || "").trim();
      highestQualification = String(body.highestQualification || "").trim();
      linkedinUrl = String(body.linkedinUrl || "").trim();
      portfolioUrl = String(body.portfolioUrl || "").trim();
      message = String(body.message || "").trim();
      consent = body.consent !== false;
      resumeUrl = String(body.resumeUrl || "").trim();
      resumeFileName = String(body.resumeFileName || "").trim();
    }

    // Validation
    if (!name || !email || !phone || !position) {
      return json({ error: "Full Name, Email Address, Phone Number, and Position are required." }, 422);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Please provide a valid email address." }, 422);
    }
    if (phone.replace(/[^0-9]/g, "").length < 8) {
      return json({ error: "Please enter a valid telephone/mobile number." }, 422);
    }

    // If jobId provided, populate department if missing
    if (jobId && !department) {
      const job = await careerJobStore.byId(jobId);
      if (job) department = job.department;
    }

    // Anti-duplicate check: reject exact same email + position submitted in last 2 minutes
    const recentApps = await careerStore.all();
    const isDuplicate = recentApps.some((a) => {
      const isSameEmail = (a.email || "").toLowerCase() === email.toLowerCase();
      const isSamePos = (a.position || "").toLowerCase() === position.toLowerCase();
      const isRecent = a.createdAt ? Date.now() - new Date(a.createdAt).getTime() < 120000 : false;
      return isSameEmail && isSamePos && isRecent;
    });

    if (isDuplicate) {
      return json({
        error: "An application with this email and position was recently submitted. Our talent acquisition team already has your details.",
      }, 429);
    }

    const application = await careerStore.create({
      name,
      email,
      phone,
      whatsapp: whatsapp || undefined,
      city: city || undefined,
      position,
      jobId: jobId || undefined,
      department: department || undefined,
      experience: experience || undefined,
      currentCompany: currentCompany || undefined,
      currentDesignation: currentDesignation || undefined,
      highestQualification: highestQualification || undefined,
      linkedinUrl: linkedinUrl || undefined,
      portfolioUrl: portfolioUrl || undefined,
      message: message || undefined,
      resumeUrl: resumeUrl || undefined,
      resumeFileName: resumeFileName || undefined,
      resumeFileSize: resumeFileSize || undefined,
      consent,
    });

    // Optional email notification trigger (non-blocking)
    try {
      const pageConfig = await careerPageStore.get();
      if (pageConfig.notifications?.adminNotificationEnabled) {
        // Notification logged / queued for talent team
        console.log(`[Talent Acquisition Notification] New applicant: ${name} for ${position} (Ref: ${application.id})`);
      }
    } catch {}

    return json({
      success: true,
      message: "Your application has been received successfully! Our talent acquisition team will review your profile and reach out within 3-5 business days.",
      application: {
        id: application.id,
        name: application.name,
        position: application.position,
        resumeUrl: application.resumeUrl,
        createdAt: application.createdAt,
      },
    }, 201);
  } catch (error: any) {
    console.error("Career application error:", error);
    return json({ error: error?.message || "An unexpected error occurred while processing your application. Please try again." }, 500);
  }
}
