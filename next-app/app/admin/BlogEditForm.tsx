"use client";

import { useState } from "react";

const BLOG_CATEGORIES = [
  "Wellness notes",
  "Expert series",
  "Nutrition",
  "Women's Care",
  "Family Care",
  "Product Education",
  "Health Education",
  "Company",
];

export default function BlogEditForm({
  item,
  onSave,
  inputStyle,
  labelStyle,
}: {
  item: Record<string, unknown>;
  onSave: () => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
}) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    setSaving(true);
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = "/api/admin/blog";
    const payload = {
      ...(form.isNew ? {} : { id: form.id }),
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      body: form.body,
      content: form.content || form.body,
      category: form.category,
      tags: form.tags,
      author: form.author,
      readTime: form.readTime,
      image: form.image,
      images: form.images,
      videoUrl: form.videoUrl,
      videoTitle: form.videoTitle,
      featured: !!form.featured,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      ogImage: form.ogImage,
      published: !!form.published,
      visible: form.visible !== false,
    };
    try {
      const res = await fetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage("Post saved!");
        setTimeout(onSave, 500);
      } else {
        const d = await res.json();
        setMessage(d.error || "Failed.");
      }
    } catch {
      setMessage("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h3 style={{ font: "20px var(--font-display)", marginBottom: 20 }}>
        {form.isNew ? "New Post" : "Edit Post"}
      </h3>
      {message && (
        <p
          style={{
            padding: "8px 12px",
            background: message.includes("saved") ? "#e9f7e9" : "#fde",
            fontSize: 12,
            color: message.includes("saved") ? "#2e7d32" : "#b34141",
            marginBottom: 16,
          }}
        >
          {message}
        </p>
      )}
      <div style={{ display: "grid", gap: 14 }}>
        {/* Title & Slug */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              style={inputStyle}
              value={String(form.title || "")}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Slug *</label>
            <input
              style={inputStyle}
              value={String(form.slug || "")}
              onChange={(e) =>
                setForm({
                  ...form,
                  slug: e.target.value
                    .replace(/[^a-z0-9]+/g, "-")
                    .toLowerCase(),
                })
              }
            />
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label style={labelStyle}>Excerpt</label>
          <textarea
            style={{ ...inputStyle, minHeight: 60 }}
            value={String(form.excerpt || "")}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
        </div>

        {/* Content (HTML body) */}
        <div>
          <label style={labelStyle}>Article Content (HTML)</label>
          <textarea
            style={{
              ...inputStyle,
              minHeight: 200,
              fontFamily: "monospace",
              fontSize: 13,
            }}
            value={String(form.body || "")}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
        </div>

        {/* Author & Category */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div>
            <label style={labelStyle}>Author</label>
            <input
              style={inputStyle}
              value={String(form.author || "")}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select
              style={inputStyle}
              value={String(form.category || "")}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            >
              <option value="">Select category</option>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags & Read Time */}
        <div
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}
        >
          <div>
            <label style={labelStyle}>Tags (comma separated)</label>
            <input
              style={inputStyle}
              value={String(form.tags || "")}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="wellness, nutrition, science"
            />
          </div>
          <div>
            <label style={labelStyle}>Read Time</label>
            <input
              style={inputStyle}
              value={String(form.readTime || "")}
              onChange={(e) => setForm({ ...form, readTime: e.target.value })}
              placeholder="5 min read"
            />
          </div>
        </div>

        {/* Featured Image */}
        <div>
          <label style={labelStyle}>Featured Image URL</label>
          <input
            style={inputStyle}
            value={String(form.image || "")}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
        </div>

        {/* Article Images */}
        <div>
          <label style={labelStyle}>
            Article Images (comma separated URLs)
          </label>
          <textarea
            style={{ ...inputStyle, minHeight: 60 }}
            value={String(form.images || "")}
            onChange={(e) => setForm({ ...form, images: e.target.value })}
            placeholder="https://... , https://..."
          />
        </div>

        {/* Video */}
        <div
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}
        >
          <div>
            <label style={labelStyle}>Video URL (YouTube/Vimeo)</label>
            <input
              style={inputStyle}
              value={String(form.videoUrl || "")}
              onChange={(e) =>
                setForm({ ...form, videoUrl: e.target.value })
              }
            />
          </div>
          <div>
            <label style={labelStyle}>Video Title</label>
            <input
              style={inputStyle}
              value={String(form.videoTitle || "")}
              onChange={(e) =>
                setForm({ ...form, videoTitle: e.target.value })
              }
            />
          </div>
        </div>

        {/* SEO */}
        <div
          style={{
            border: "1px solid var(--line)",
            padding: 16,
            background: "#fafafa",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              color: "var(--muted)",
              marginBottom: 12,
            }}
          >
            SEO
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={labelStyle}>SEO Title</label>
              <input
                style={inputStyle}
                value={String(form.seoTitle || "")}
                onChange={(e) =>
                  setForm({ ...form, seoTitle: e.target.value })
                }
              />
            </div>
            <div>
              <label style={labelStyle}>SEO Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: 60 }}
                value={String(form.seoDescription || "")}
                onChange={(e) =>
                  setForm({ ...form, seoDescription: e.target.value })
                }
              />
            </div>
            <div>
              <label style={labelStyle}>OG Image URL</label>
              <input
                style={inputStyle}
                value={String(form.ogImage || "")}
                onChange={(e) =>
                  setForm({ ...form, ogImage: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, auto)",
            gap: 16,
            fontSize: 13,
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={!!form.published}
              onChange={(e) =>
                setForm({ ...form, published: e.target.checked })
              }
            />{" "}
            Published
          </label>
          <label>
            <input
              type="checkbox"
              checked={!!form.featured}
              onChange={(e) =>
                setForm({ ...form, featured: e.target.checked })
              }
            />{" "}
            Featured
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.visible !== false}
              onChange={(e) =>
                setForm({ ...form, visible: e.target.checked })
              }
            />{" "}
            Visible
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "10px 20px",
              background: "var(--purple)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {saving ? "Saving..." : "Save Post"}
          </button>
          {String(form.slug) && (
            <a
              href={"/blog/" + form.slug}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 16px",
                border: "1px solid var(--line)",
                background: "#fff",
                cursor: "pointer",
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              Preview
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
