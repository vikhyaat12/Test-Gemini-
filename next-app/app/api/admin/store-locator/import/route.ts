import { json, requireUser } from "@/lib/http";
import { storeLocatorStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  try {
    const contentType = request.headers.get("content-type") || "";
    let csvText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) return json({ error: "No CSV file provided" }, 400);
      csvText = await file.text();
    } else {
      const body = await request.json().catch(() => ({}));
      csvText = body.csv || "";
    }

    if (!csvText.trim()) {
      return json({ error: "CSV content is empty." }, 400);
    }

    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      return json({ error: "CSV file must contain a header row and at least one data row." }, 400);
    }

    const header = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
    const imported: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Handle simple CSV parsing
      const values = line.split(",").map((v) => v.replace(/^["']|["']$/g, "").trim());
      const row: Record<string, string> = {};
      header.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      const name = row.name || row.storename || row.title;
      const city = row.city;
      const state = row.state;

      if (!name || !city || !state) {
        errors.push(`Row ${i + 1}: Name, City, and State are required.`);
        continue;
      }

      const lat = row.latitude || row.lat ? parseFloat(row.latitude || row.lat) : undefined;
      const lng = row.longitude || row.lng || row.long ? parseFloat(row.longitude || row.lng || row.long) : undefined;

      const loc = await storeLocatorStore.create({
        name,
        type: row.type || "pharmacy",
        contactPerson: row.contact || row.contactperson || undefined,
        phone: row.phone || row.mobile || "",
        whatsapp: row.whatsapp || undefined,
        email: row.email || undefined,
        address: row.address || "",
        city,
        state,
        pincode: row.pincode || row.pin || "",
        latitude: lat,
        longitude: lng,
        region: row.region || row.territory || undefined,
        productsHandled: row.productshandled || undefined,
        openingHours: row.openinghours || row.hours || undefined,
        website: row.website || undefined,
        directionsUrl: row.directionsurl || undefined,
        isAuthorized: row.isauthorized !== "false",
        isFeatured: row.isfeatured === "true" || row.featured === "true",
        isActive: row.isactive !== "false",
        isVisible: row.isvisible !== "false",
      });

      imported.push(loc);
    }

    return json({
      success: true,
      importedCount: imported.length,
      errorsCount: errors.length,
      errors: errors.slice(0, 10),
      message: `Successfully imported ${imported.length} locations.`,
    });
  } catch (error) {
    console.error("Admin import store locations error:", error);
    return json({ error: "Failed to parse and import CSV file." }, 500);
  }
}
