"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab = "profile" | "orders" | "addresses" | "wishlist" | "settings";
type Address = { id: string; label: string; fullName: string; phone: string; address: string; city: string; state: string; pincode: string; isDefault: boolean };

const req = async (path: string, init?: RequestInit) => {
  const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  return r.json();
};

export default function CustomerDashboard() {
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ label: "Home", fullName: "", phone: "", address: "", city: "", state: "", pincode: "" });
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await req("/api/auth/me");
        if (!cancelled && me.user) {
          setUser(me.user);
          setEditingName(me.user.name || "");
          setEditingPhone(me.user.phone || "");
          const ord = await req("/api/orders");
          if (!cancelled && ord.orders) setOrders(ord.orders);
          const addr = await req("/api/addresses");
          if (!cancelled && addr.addresses) setAddresses(addr.addresses);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => { await req("/api/auth/logout", { method: "POST" }); location.reload(); };

  const saveProfile = async () => {
    await req("/api/account", { method: "PATCH", body: JSON.stringify({ name: editingName, phone: editingPhone }) });
    setMessage("Profile updated.");
  };

  const saveAddress = async () => {
    if (!addrForm.fullName || !addrForm.address || !addrForm.city || !addrForm.pincode) { setMessage("All fields required."); return; }
    await req("/api/addresses", { method: "POST", body: JSON.stringify(addrForm) });
    const addr = await req("/api/addresses");
    if (addr.addresses) setAddresses(addr.addresses);
    setShowAddressForm(false);
    setAddrForm({ label: "Home", fullName: "", phone: "", address: "", city: "", state: "", pincode: "" });
    setMessage("Address saved.");
  };

  const deleteAddress = async (id: string) => {
    await req(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses(addresses.filter(a => a.id !== id));
    setMessage("Address removed.");
  };

  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  if (!user && !loading) {
    const handleLogin = async (e: FormEvent) => {
      e.preventDefault();
      setAuthLoading(true); setAuthMessage("");
      const r = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: authForm.email, password: authForm.password }) });
      if (r.error) { setAuthMessage(r.error); setAuthLoading(false); }
      else router.refresh();
    };
    const handleRegister = async (e: FormEvent) => {
      e.preventDefault();
      setAuthLoading(true); setAuthMessage("");
      const r = await req("/api/auth/register", { method: "POST", body: JSON.stringify(authForm) });
      if (r.error) { setAuthMessage(r.error); setAuthLoading(false); }
      else router.refresh();
    };
    const handleForgot = async (e: FormEvent) => {
      e.preventDefault();
      setAuthLoading(true); setAuthMessage("");
      const r = await req("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: authForm.email }) });
      setAuthMessage(r.resetUrl || r.message || "Check your email."); setAuthLoading(false);
    };

    return (
      <main className="portal" style={{ maxWidth: 420, margin: "60px auto" }}>
        <Link href="/" className="back">← Queens Care</Link>
        <p className="eyebrow">Your care account</p>
        <h1>{forgotMode ? "Reset password" : authTab === "login" ? "Sign in" : "Create account"}</h1>
        {!forgotMode && (
          <Link href="/api/auth/google" style={{ display: "block", padding: "12px 0", border: "1px solid var(--line)", textAlign: "center", marginBottom: 16, fontSize: 13, textDecoration: "none", color: "var(--ink)" }}>Continue with Google</Link>
        )}
        {!forgotMode && <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>or</p>}
        {authMessage && <p style={{ padding: "10px 14px", background: authMessage.includes("error") || authMessage.includes("Error") ? "#fce4ec" : "#e9f7e9", fontSize: 12, marginBottom: 16 }}>{authMessage}</p>}
        {forgotMode ? (
          <form onSubmit={handleForgot} style={{ display: "grid", gap: 12 }}>
            <input type="email" required placeholder="Your email address" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} style={{ padding: "12px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            <button type="submit" disabled={authLoading} className="button" style={{ border: 0 }}>{authLoading ? "Sending…" : "Send reset link →"}</button>
            <button type="button" onClick={() => setForgotMode(false)} style={{ background: "none", border: "none", color: "var(--purple)", fontSize: 12, cursor: "pointer", padding: 0 }}>← Back to sign in</button>
          </form>
        ) : (
          <form onSubmit={authTab === "login" ? handleLogin : handleRegister} style={{ display: "grid", gap: 12 }}>
            {authTab === "register" && <input required placeholder="Your name" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} style={{ padding: "12px 14px", border: "1px solid var(--line)", fontSize: 14 }} />}
            <input type="email" required placeholder="Email address" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} style={{ padding: "12px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            <input type="password" required minLength={10} placeholder="Password (10+ characters)" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} style={{ padding: "12px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            <button type="submit" disabled={authLoading} className="button" style={{ border: 0 }}>{authLoading ? "Please wait…" : authTab === "login" ? "Sign in →" : "Create account →"}</button>
          </form>
        )}
        {authTab === "login" && !forgotMode && <button onClick={() => setForgotMode(true)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", padding: "8px 0", textAlign: "left" }}>Forgot password?</button>}
        <p style={{ fontSize: 13, marginTop: 16 }}>{authTab === "login" ? "Don't have an account?" : "Already have an account?"} <button onClick={() => { setAuthTab(authTab === "login" ? "register" : "login"); setAuthMessage(""); }} style={{ background: "none", border: "none", color: "var(--purple)", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 0 }}>{authTab === "login" ? "Create one" : "Sign in"}</button></p>
      </main>
    );
  }

  const tabs: [Tab, string][] = [["profile", "Profile"], ["orders", "Orders"], ["addresses", "Addresses"], ["wishlist", "Wishlist"], ["settings", "Settings"]];

  return (
    <main className="portal" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 0, minHeight: "100vh" }}>
      <nav style={{ background: "var(--paper)", borderRight: "1px solid var(--line)", padding: "24px 0" }}>
        <div style={{ padding: "0 16px 20px", borderBottom: "1px solid var(--line)" }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", margin: 0 }}>Account</p>
          <p style={{ font: "14px var(--font-display)", margin: "4px 0 0" }}>{String(user?.name || "—")}</p>
        </div>
        <div style={{ padding: "12px 0" }}>
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setMessage(""); }}
              style={{ display: "block", width: "100%", padding: "10px 16px", border: "none", background: tab === id ? "var(--purple)" : "transparent", color: tab === id ? "#fff" : "var(--ink)", cursor: "pointer", fontSize: 12, textAlign: "left", borderLeft: tab === id ? "3px solid var(--gold)" : "3px solid transparent" }}>{label}</button>
          ))}
          <button onClick={handleLogout} style={{ display: "block", width: "100%", padding: "10px 16px", border: "none", background: "transparent", color: "#b34141", cursor: "pointer", fontSize: 12, textAlign: "left", marginTop: 16, borderTop: "1px solid var(--line)" }}>Sign out</button>
        </div>
      </nav>

      <div style={{ padding: "30px 36px", overflowY: "auto" }}>
        {message && <p style={{ padding: "10px 14px", background: "#e9f7e9", fontSize: 12, color: "#2e7d32", marginBottom: 20 }}>{message}</p>}

        {/* ─── PROFILE ─── */}
        {tab === "profile" && user && (
          <div>
            <h2 style={{ font: "24px var(--font-display)", margin: "0 0 24px" }}>Your Profile</h2>
            <div style={{ display: "grid", gap: 14, maxWidth: 500 }}>
              <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Name</label><input value={editingName} onChange={e => setEditingName(e.target.value)} style={{ padding: "12px 14px", border: "1px solid var(--line)", width: "100%", fontSize: 14 }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Email</label><input value={String(user.email)} readOnly style={{ padding: "12px 14px", border: "1px solid var(--line)", width: "100%", fontSize: 14, background: "var(--paper)" }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Phone</label><input value={editingPhone} onChange={e => setEditingPhone(e.target.value)} placeholder="+91 98765 43210" style={{ padding: "12px 14px", border: "1px solid var(--line)", width: "100%", fontSize: 14 }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Role</label><input value={String(user.role)} readOnly style={{ padding: "12px 14px", border: "1px solid var(--line)", width: "100%", fontSize: 14, background: "var(--paper)" }} /></div>
              <button onClick={saveProfile} style={{ padding: "12px 19px", background: "var(--purple)", color: "#fff", border: "none", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", cursor: "pointer", width: "fit-content" }}>Save Changes →</button>
            </div>
          </div>
        )}

        {/* ─── ORDERS ─── */}
        {tab === "orders" && (
          <div>
            <h2 style={{ font: "24px var(--font-display)", margin: "0 0 24px" }}>Your Orders</h2>
            {orders.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No orders yet. <Link href="/shop" style={{ color: "var(--purple)", textDecoration: "underline" }}>Start shopping</Link></p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {orders.map(o => (
                  <div key={String(o.id)} style={{ padding: 18, background: "#fff", border: "1px solid var(--line)", display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 20, alignItems: "center" }}>
                    <div>
                      <b style={{ fontFamily: "monospace", fontSize: 12 }}>{String(o.id).slice(0, 16)}</b>
                      <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>{new Date(String(o.createdAt)).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span style={{ padding: "3px 10px", fontSize: 10, textTransform: "uppercase", background: o.status === "delivered" ? "#4caf50" : o.status === "cancelled" ? "#b34141" : "#d4ad65", color: o.status === "pending" ? "#333" : "#fff" }}>{String(o.status)}</span>
                    <span style={{ padding: "3px 10px", fontSize: 10, textTransform: "uppercase", background: o.paymentStatus === "paid" ? "#4caf50" : "#eee", color: o.paymentStatus === "paid" ? "#fff" : "#333" }}>{String(o.paymentStatus || "pending")}</span>
                    <span style={{ font: "16px var(--font-display)" }}>{inr(Number(o.total))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ADDRESSES ─── */}
        {tab === "addresses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ font: "24px var(--font-display)", margin: 0 }}>Saved Addresses</h2>
              <button onClick={() => setShowAddressForm(!showAddressForm)} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>{showAddressForm ? "Cancel" : "+ Add Address"}</button>
            </div>
            {showAddressForm && (
              <div style={{ padding: 20, background: "#fff", border: "1px solid var(--line)", marginBottom: 20, display: "grid", gap: 12, maxWidth: 500 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Label</label><select value={addrForm.label} onChange={e => setAddrForm({ ...addrForm, label: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }}><option>Home</option><option>Office</option><option>Other</option></select></div>
                  <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Full name *</label><input value={addrForm.fullName} onChange={e => setAddrForm({ ...addrForm, fullName: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} /></div>
                </div>
                <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Phone *</label><input value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} /></div>
                <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Address *</label><input value={addrForm.address} onChange={e => setAddrForm({ ...addrForm, address: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>City *</label><input value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>State</label><input value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>PIN code *</label><input value={addrForm.pincode} onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} /></div>
                </div>
                <button onClick={saveAddress} style={{ padding: "10px 18px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>Save Address →</button>
              </div>
            )}
            {addresses.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No saved addresses yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                {addresses.map(a => (
                  <div key={a.id} style={{ padding: 18, background: "#fff", border: `1px solid ${a.isDefault ? "var(--gold)" : "var(--line)"}`, position: "relative" }}>
                    {a.isDefault && <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, padding: "2px 8px", background: "var(--gold)", color: "#fff", textTransform: "uppercase" }}>Default</span>}
                    <b style={{ fontSize: 13 }}>{a.label}</b>
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0", lineHeight: 1.6 }}>
                      {a.fullName}<br />{a.address}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}
                    </p>
                    <button onClick={() => deleteAddress(a.id)} style={{ border: "none", background: "none", color: "#b34141", fontSize: 11, cursor: "pointer", padding: 0 }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── WISHLIST ─── */}
        {tab === "wishlist" && (
          <div>
            <h2 style={{ font: "24px var(--font-display)", margin: "0 0 24px" }}>Wishlist</h2>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Your saved products will appear here. Click ♡ on any product to save it.</p>
            <Link href="/shop" style={{ color: "var(--purple)", fontSize: 13 }}>Browse products →</Link>
          </div>
        )}

        {/* ─── SETTINGS ─── */}
        {tab === "settings" && (
          <div>
            <h2 style={{ font: "24px var(--font-display)", margin: "0 0 24px" }}>Account Settings</h2>
            <div style={{ display: "grid", gap: 16, maxWidth: 500 }}>
              <div>
                <p style={{ fontSize: 13, marginBottom: 8 }}>Change your display name and phone number from the Profile tab.</p>
                <p style={{ fontSize: 13, marginBottom: 8 }}>Manage your saved addresses from the Addresses tab.</p>
                <p style={{ fontSize: 13, marginBottom: 8 }}>View your order history from the Orders tab.</p>
              </div>
              <div style={{ padding: 16, background: "var(--paper)", border: "1px solid var(--line)" }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Password & Security</p>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>Password management is available through the authentication system. Contact support to reset your password.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
