import { NextRequest, NextResponse } from "next/server";
import { fileDb } from "@/lib/commerce/file-db";

export async function GET(_req: NextRequest) {
  const links = fileDb
    .findMany("socialMediaLinks", (s: Record<string, unknown>) => {
      // Must be explicitly visible and have a valid non-empty URL
      if (s.visible === false) return false;
      const url = String(s.url || "").trim();
      if (!url || url === "#") return false;
      return true;
    })
    .sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)
    );

  return NextResponse.json({ links });
}
