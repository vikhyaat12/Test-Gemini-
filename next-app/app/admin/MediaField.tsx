"use client";

import { useState, useRef } from "react";

type UploadResult = {
  url: string; name: string; size: number;
  type: string; width?: number; height?: number;
  isAnimated?: boolean; error?: string;
};

type MediaFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  /** Recommended dimensions text, e.g. "1500 × 1500 px" */
  recommended?: string;
  /** Recommended aspect ratio, e.g. "1:1" */
  ratio?: string;
  /** Supported format list, e.g. "JPG, PNG, WEBP, GIF" */
  formats?: string;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Whether this is a video field */
  isVideo?: boolean;
  /** Whether to allow multiple files */
  multiple?: boolean;
  /** Layout hint for dimensions */
  layout?: "square" | "wide" | "tall" | "free";
  /** Compact mode for inline display */
  compact?: boolean;
};

export default function MediaField({
  label, value, onChange, folder = "general",
  accept, recommended, ratio, formats, maxSizeMB = 10,
  isVideo = false, multiple = false, layout = "free", compact = false,
}: MediaFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptTypes = accept || (isVideo ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif");
  const formatList = formats || (isVideo ? "MP4, WEBP" : "JPG, PNG, WEBP, GIF");
  const maxMB = maxSizeMB;

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("files", f));
    formData.append("folder", folder);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.files?.length) {
        const f: UploadResult = data.files[0];
        if (f.error) {
          setError(f.error);
        } else {
          onChange(f.url);
          setError("");
        }
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Network error during upload");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const isVideoFile = (url: string) => url.match(/\.(mp4|webm)$/i) || url.includes("/uploads/") && (url.includes(".mp4") || url.includes(".webm"));
  const isGifFile = (url: string) => url.match(/\.gif$/i);

  return (
    <div style={{ marginBottom: compact ? 8 : 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>
        {label}
      </label>

      {/* Recommended dimensions */}
      {(recommended || ratio || formatList) && (
        <p style={{ fontSize: 10, color: "var(--muted)", margin: "0 0 6px", lineHeight: 1.4 }}>
          {recommended && <span>Recommended: <strong>{recommended}</strong></span>}
          {ratio && <span> · Ratio: <strong>{ratio}</strong></span>}
          {formatList && <span> · Formats: {formatList}</span>}
          {maxMB && <span> · Max: {maxMB}MB</span>}
        </p>
      )}

      {/* Current media preview */}
      {value && (
        <div style={{
          marginBottom: 8, padding: 8, background: "#f5f0eb", border: "1px solid var(--line)",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <div style={{ width: compact ? 60 : 100, height: compact ? 60 : 100, flexShrink: 0, background: "#fff", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {isVideoFile(value) ? (
              <video src={value} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
            ) : (
              <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: "var(--muted)", margin: "0 0 4px", wordBreak: "break-all" }}>
              {value.split("/").pop()}
            </p>
            {isGifFile(value) && <span style={{ fontSize: 9, padding: "1px 6px", background: "#e3f2fd", color: "#1565c0", borderRadius: 3 }}>GIF</span>}
            {isVideoFile(value) && <span style={{ fontSize: 9, padding: "1px 6px", background: "#f3e5f5", color: "var(--purple)", borderRadius: 3 }}>VIDEO</span>}
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ padding: "4px 10px", fontSize: 10, background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                {uploading ? "Uploading…" : "Replace"}
              </button>
              <button
                onClick={() => { onChange(""); setError(""); }}
                style={{ padding: "4px 10px", fontSize: 10, background: "#fff", color: "#b34141", border: "1px solid #e2c3c3", cursor: "pointer" }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload + URL input */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <label
          style={{
            padding: compact ? "6px 12px" : "8px 16px",
            background: "var(--gold, #b8860b)", color: "#fff", border: "none",
            cursor: uploading ? "wait" : "pointer", fontSize: 11, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 4,
            opacity: uploading ? 0.7 : 1,
            ...(dragOver ? { outline: "2px solid var(--purple)", outlineOffset: 2 } : {}),
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          📤 {uploading ? "Uploading…" : "Upload"}
          <input
            ref={fileRef}
            type="file"
            accept={acceptTypes}
            multiple={multiple}
            hidden
            onChange={e => handleUpload(e.target.files)}
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={isVideo ? "Video URL (YouTube/Vimeo/file path)" : "Image URL (https://...)"}
          style={{ flex: 1, minWidth: 150, padding: compact ? "6px 10px" : "8px 12px", border: "1px solid var(--line)", fontSize: 12 }}
        />
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 10, color: "#b34141", marginTop: 4, padding: "4px 8px", background: "#fde8e8", border: "1px solid #f8b4b4" }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
