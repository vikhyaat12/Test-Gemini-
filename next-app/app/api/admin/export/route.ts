import { requireUser } from "@/lib/http";
import { NextResponse } from "next/server";
import { fileDb } from "@/lib/commerce/file-db";

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function generateCSV(headers: string[], rows: Array<Record<string, unknown>>): string {
  const headerRow = headers.map(escapeCSV).join(",");
  const dataRows = rows.map((row) =>
    headers.map((h) => escapeCSV(row[h] ?? "")).join(",")
  );
  // Prepend UTF-8 BOM so Excel opens Hindi/Special chars correctly
  return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

export async function GET(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const dataset = searchParams.get("dataset") || "b2b";
  const dateStr = new Date().toISOString().slice(0, 10);

  let csvContent = "";
  let filename = `queenscare-${dataset}-${dateStr}.csv`;

  switch (dataset) {
    case "b2b": {
      const records = fileDb.findMany("b2bApplications", () => true);
      const headers = [
        "id",
        "company",
        "businessType",
        "name",
        "designation",
        "email",
        "phone",
        "whatsapp",
        "website",
        "address",
        "city",
        "state",
        "country",
        "pincode",
        "gstNumber",
        "drugLicence",
        "panNumber",
        "yearsInBusiness",
        "distributionNetwork",
        "storeCount",
        "regionsCovered",
        "partnershipType",
        "productInterest",
        "requirementVolume",
        "territory",
        "existingBrands",
        "additionalRequirements",
        "message",
        "documentUrl",
        "documentFileName",
        "consent",
        "status",
        "notes",
        "createdAt",
      ];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "stores":
    case "locations": {
      const records = fileDb.findMany("storeLocations", () => true);
      const headers = [
        "id",
        "name",
        "type",
        "contactPerson",
        "phone",
        "whatsapp",
        "email",
        "address",
        "city",
        "state",
        "pincode",
        "country",
        "latitude",
        "longitude",
        "region",
        "productsHandled",
        "openingHours",
        "website",
        "directionsUrl",
        "isAuthorized",
        "isFeatured",
        "isActive",
        "isVisible",
        "createdAt",
      ];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "careers": {
      const records = fileDb.findMany("careerApplications", () => true);
      const headers = [
        "id",
        "name",
        "email",
        "phone",
        "whatsapp",
        "position",
        "department",
        "city",
        "experience",
        "currentCompany",
        "currentDesignation",
        "highestQualification",
        "linkedinUrl",
        "portfolioUrl",
        "message",
        "resumeUrl",
        "resumeFileName",
        "status",
        "consent",
        "notes",
        "createdAt",
      ];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "customers": {
      const records = fileDb.findMany("users", () => true);
      const headers = ["id", "name", "email", "phone", "role", "createdAt"];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "subscribers": {
      const records = fileDb.findMany("newsletterSubscribers", () => true);
      const headers = ["id", "email", "source", "status", "createdAt"];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "orders": {
      const records = fileDb.findMany("orders", () => true);
      const headers = [
        "id",
        "trackingCode",
        "total",
        "subtotal",
        "status",
        "paymentStatus",
        "paymentMethod",
        "createdAt",
      ];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "contacts": {
      const records = fileDb.findMany("contactEnquiries", () => true);
      const headers = ["id", "name", "email", "phone", "subject", "message", "status", "createdAt"];
      csvContent = generateCSV(headers, records);
      break;
    }

    case "reviews": {
      const records = fileDb.findMany("reviews", () => true);
      const headers = ["id", "productId", "rating", "title", "content", "userName", "verified", "createdAt"];
      csvContent = generateCSV(headers, records);
      break;
    }

    default: {
      return new NextResponse("Unknown dataset. Supported: b2b, careers, customers, subscribers, orders, contacts, reviews", { status: 400 });
    }
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
