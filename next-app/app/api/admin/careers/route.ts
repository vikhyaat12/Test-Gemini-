import { json, requireUser } from "@/lib/http";
import { careerStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const applications = await careerStore.all();
  return json({ applications });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.position) {
    return json({ error: "Name, email, and position are required." }, 422);
  }

  const application = await careerStore.create({
    name: String(body.name),
    email: String(body.email),
    phone: String(body.phone || ""),
    whatsapp: String(body.whatsapp || ""),
    city: String(body.city || body.location || ""),
    position: String(body.position),
    jobId: String(body.jobId || ""),
    department: String(body.department || ""),
    experience: String(body.experience || ""),
    currentCompany: String(body.currentCompany || ""),
    currentDesignation: String(body.currentDesignation || ""),
    highestQualification: String(body.highestQualification || ""),
    linkedinUrl: String(body.linkedinUrl || ""),
    portfolioUrl: String(body.portfolioUrl || ""),
    message: String(body.message || ""),
    resumeUrl: String(body.resumeUrl || ""),
    resumeFileName: String(body.resumeFileName || ""),
    consent: body.consent !== false,
  });

  return json({ application }, 201);
}
