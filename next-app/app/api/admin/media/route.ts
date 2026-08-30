import { json, requireUser } from "@/lib/http";
import { readdirSync, statSync } from "fs";
import { join } from "path";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const uploadDir = join(process.cwd(), "public", "uploads");
  const folders = ["products", "blog", "logos", "general"];
  const results: Array<{ folder: string; count: number; items: Array<{ name: string; url: string; size: number; type: string; modified: string }> }> = [];

  for (const folder of folders) {
    try {
      const dirPath = join(uploadDir, folder);
      const files = readdirSync(dirPath).filter(f => !f.startsWith("."));
      const items = files.map(name => {
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
      }).filter(f => f.type !== "folder");

      results.push({ folder, count: items.length, items });
    } catch {
      // Folder doesn't exist
    }
  }

  return json({ folders: results });
}
