import { json, requireUser } from "@/lib/http";
import { readdirSync, statSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const uploadDir = join(process.cwd(), "public", "uploads");
  const folders = ["products", "blog", "logos", "general", "banners", "testimonials", "reviews", "employees", "aplus"];
  const results: Array<{ folder: string; count: number; items: Array<{ name: string; url: string; size: number; type: string; modified: string }> }> = [];

  for (const folder of folders) {
    try {
      const dirPath = join(uploadDir, folder);
      if (!existsSync(dirPath)) continue;
      const files = readdirSync(dirPath).filter((f) => !f.startsWith("."));
      const items = files
        .map((name) => {
          try {
            const filePath = join(dirPath, name);
            const stat = statSync(filePath);
            return {
              name,
              url: `/uploads/${folder}/${name}`,
              size: stat.size,
              type: stat.isDirectory() ? "folder" : name.split(".").pop() || "unknown",
              modified: stat.mtime.toISOString(),
            };
          } catch {
            return { name, url: `/uploads/${folder}/${name}`, size: 0, type: "unknown", modified: "" };
          }
        })
        .filter((f) => f.type !== "folder");

      results.push({ folder, count: items.length, items });
    } catch {
      // Folder doesn't exist
    }
  }

  const allItems = results.flatMap((f) => f.items);
  return json({ folders: results, media: allItems, total: allItems.length });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url || !url.startsWith("/uploads/")) {
    return json({ error: "Valid /uploads/ URL is required" }, 400);
  }

  try {
    const relativePath = url.replace(/^\//, "").replace(/\//g, "\\");
    const filePath = join(process.cwd(), "public", relativePath);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      return json({ success: true, message: "File deleted successfully" });
    }
    return json({ error: "File not found" }, 404);
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed to delete file" }, 500);
  }
}
