"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "../../components/BrandLogo";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      // Check if user is admin or employee
      const me = await fetch("/api/auth/me");
      const meData = await me.json();
      if (meData.user?.role === "admin" || meData.user?.role === "employee") {
        router.push("/admin");
      } else {
        setError("Access denied. Admin or authorized employee credentials required.");
        setLoading(false);
        // Logout non-admin
        await fetch("/api/auth/logout", { method: "POST" });
      }
    } catch {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="portal" style={{ maxWidth: 420, margin: "80px auto", padding: "0 20px" }}>
      <Link href="/" className="back" style={{ display: "block", marginBottom: 24 }}>← Queens Care</Link>
      <div style={{ marginBottom: 20 }}><BrandLogo showText overrideHeight={40} overrideMobileHeight={32} overrideMaxWidth={180} /></div>
      <h1 style={{ font: "32px var(--font-display)", marginBottom: 8 }}>Admin Access</h1>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>Sign in with administrator credentials to access the management dashboard.</p>

      {error && (
        <p style={{ padding: "10px 14px", background: "#fce4ec", fontSize: 12, marginBottom: 16, color: "#b34141" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          required
          placeholder="Admin email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "12px 14px", border: "1px solid var(--line)", fontSize: 14 }}
        />
        <input
          type="password"
          required
          minLength={10}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "12px 14px", border: "1px solid var(--line)", fontSize: 14 }}
        />
        <button type="submit" disabled={loading} className="button" style={{ border: 0 }}>
          {loading ? "Signing in…" : "Sign in to Dashboard →"}
        </button>
      </form>

      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 24, lineHeight: 1.6 }}>
        First registered user in development mode automatically receives admin access.
        In production, configure admin users through the database.
      </p>
    </main>
  );
}
