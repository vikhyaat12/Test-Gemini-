import { requireUser } from "@/lib/http";
import { NextResponse } from "next/server";
import { join, normalize, extname } from "path";
import { existsSync, readFileSync, statSync } from "fs";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  // Strict Admin authorization required to access B2B applicant documents
  const user = await requireUser(["admin", "employee"]);
  if (!user) {
    return new NextResponse("Unauthorized. Admin authentication required to access B2B partnership documents.", {
      status: 401,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const filenameSegments = (await params).filename;
  if (!filenameSegments || filenameSegments.length === 0) {
    return new NextResponse("File not specified", { status: 400 });
  }

  const safeFilename = normalize(filenameSegments.join("/")).replace(/^(\.\.[\/\\])+/, "");
  const filePath = join(process.cwd(), "public", "uploads", "b2b-documents", safeFilename);

  if (!existsSync(filePath)) {
    return new NextResponse("Document not found on server", { status: 404 });
  }

  const stat = statSync(filePath);
  if (!stat.isFile()) {
    return new NextResponse("Invalid file path", { status: 400 });
  }

  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const fileBuffer = readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Content-Disposition": `inline; filename="${safeFilename}"`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
