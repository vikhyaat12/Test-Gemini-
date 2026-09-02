import { NextResponse } from "next/server";
import { fileDb } from "@/lib/commerce/file-db";

export async function DELETE() {
  try {
    // Clear analytics events and sessions by saving empty arrays
    fileDb.save({
      analyticsEvents: [],
      analyticsSessions: [],
    });
    return NextResponse.json({ ok: true, message: "Analytics data cleared" });
  } catch (err) {
    console.error("Clear analytics error:", err);
    return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
  }
}
