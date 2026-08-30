"use client";

import { useState, useEffect } from "react";

type MediaItem = {
  name: string;
  url: string;
  size: number;
  type: string;
  modified: string;
};

type FolderStats = {
  folder: string;
  count: number;
  items: MediaItem[];
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
};

const getMediaType = (name: string): "image" | "video" | "gif" | "other" => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "gif") return "gif";
  if (["mp4", "webm", "avi", "mov"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "webp", "svg"].includes(ext)) return "image";
  return "other";
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "image": return { bg: "#e8f5e9", color: "#2e7d32" };
    case "gif": return { bg: "#fff3e0", color: "#e65100" };
    case "video": return { bg: "#f3e5f5", color: "var(--purple)" };
    default: return { bg: "#f5f5f5", color: "#666" };
  }
};

export default function MediaLibrary() {
  const [stats, setStats] = useState<FolderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "image" | "gif" | "video">("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState("");

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      setStats(data.folders || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchMedia(); }, []);

  const allItems: (MediaItem & { folder: string })[] = [];
  stats.forEach(f => f.items.forEach(item => allItems.push({ ...item, folder: f.folder })));
  const filtered = allItems
    .filter(item => {
      if (filter !== "all") {
        const t = getMediaType(item.name);
        if (filter === "gif" && t !== "gif") return false;
        if (filter === "image" && t !== "image") return false;
        if (filter === "video" && t !== "video") return false;
      }
      if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.url.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ font: "18px var(--font-display)", margin: 0 }}>🖼️ Media Library</h3>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
            {allItems.length} files · {stats.reduce((s, f) => s + f.count, 0)} total
          </p>
        </div>
        <button onClick={fetchMedia} style={{ padding: "6px 14px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {(["all", "image", "gif", "video"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
              background: filter === f ? "var(--purple)" : "#f0f0f0",
              color: filter === f ? "#fff" : "var(--muted)",
            }}>
            {f === "all" ? "All" : f === "image" ? "📷 Images" : f === "gif" ? "🎨 GIFs" : "🎬 Videos"}
          </button>
        ))}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search files…"
          style={{ flex: 1, minWidth: 150, padding: "6px 12px", border: "1px solid var(--line)", fontSize: 12 }}
        />
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          {stats.map(f => (
            <div key={f.folder} style={{ padding: "8px 14px", background: "#faf9f7", border: "1px solid var(--line)", fontSize: 11 }}>
              <b>{f.folder}</b>: {f.count} files
            </div>
          ))}
        </div>
      )}

      {/* Media grid */}
      {loading ? (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading media…</p>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", border: "2px dashed var(--line)", color: "var(--muted)" }}>
          <p style={{ fontSize: 14 }}>No media files found.</p>
          <p style={{ fontSize: 12 }}>Upload files from product editors, A+ content, or other admin sections.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {filtered.map(item => {
            const mediaType = getMediaType(item.name);
            const tc = getTypeColor(mediaType);
            return (
              <div key={item.url} style={{ border: "1px solid var(--line)", background: "#fff", overflow: "hidden" }}>
                {/* Preview */}
                <div style={{ height: 140, background: "#f5f0eb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {mediaType === "video" ? (
                    <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
                  ) : (
                    <img src={item.url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} loading="lazy" />
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, ...tc, fontWeight: 600, textTransform: "uppercase" as const }}>
                      {mediaType}
                    </span>
                    <span style={{ fontSize: 9, color: "var(--muted)" }}>{formatSize(item.size)}</span>
                  </div>
                  <p style={{ fontSize: 10, color: "var(--ink)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: 9, color: "var(--muted)", margin: "0 0 6px" }}>
                    {item.folder} · {new Date(item.modified).toLocaleDateString("en-IN")}
                  </p>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => copyUrl(item.url)}
                      style={{ flex: 1, padding: "4px 8px", fontSize: 9, background: copied === item.url ? "#e9f7e9" : "#f0f0f0", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      {copied === item.url ? "✓ Copied" : "Copy URL"}
                    </button>
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: "4px 8px", fontSize: 9, background: "#f0f0f0", textDecoration: "none", color: "inherit" }}>
                      Open
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
