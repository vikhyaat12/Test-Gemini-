import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/http";
import AdminDashboard from "./dashboard";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function Page() {
  const user = await requireUser(["admin"]);
  if (!user) redirect("/admin/login");
  return <AdminDashboard />;
}
