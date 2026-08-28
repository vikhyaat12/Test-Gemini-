import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/http";
import PortalWorkspace from "@/app/components/PortalWorkspace";

// Private analytics view — same server-side admin gate as /admin.
export const metadata: Metadata = { title: "Analytics", robots: { index: false, follow: false } };

export default async function Page() {
  const user = await requireUser(["admin"]);
  if (!user) redirect("/account");
  return <PortalWorkspace mode="admin" />;
}
