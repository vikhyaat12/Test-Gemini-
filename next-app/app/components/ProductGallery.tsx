"use client";

import { useState } from "react";
import { parseMediaInfo } from "./GlobalMediaUploader";

export type GalleryImage = { id: string; url: string; alt?: string };
export type GalleryVideo = { id?: string; url: string; title?: string; posterUrl?: string };

type GalleryMediaItem = {
  id: string;
  url: string;
  type: "image" | "video" | "youtube" | "vimeo" | "gif";
  title?: string;
  alt?: string;
  posterUrl?: string;
  embedUrl?: string;
};

export default function ProductGallery({
  mainImage,
  productName,
  images = [],
  videos = [],
}: {
  mainImage: string;
  productName: string;
  images?: GalleryImage[];
  videos?: GalleryVideo[];
}) {
  // Combine main image + gallery images + product videos into a unified media list
  const mediaItems: GalleryMediaItem[] = [
    {
      id: "main-img",
      url: mainImage,
      type: parseMediaInfo(mainImage).type,
      alt: productName,
    },
    ...images.map((img, i) => {
      const parsed = parseMediaInfo(img.url);
      return {
        id: img.id || `img-${i}`,
        url: img.url,
        type: parsed.type,
        alt: img.alt || `${productName} photo ${i + 1}`,
      };
    }),
    ...videos.map((vid, i) => {
      const parsed = parseMediaInfo(vid.url);
      return {
        id: vid.id || `vid-${i}`,
        url: vid.url,
        type: parsed.type,
        title: vid.title || `${productName} video ${i + 1}`,
        posterUrl: vid.posterUrl || parsed.posterUrl,
        embedUrl: parsed.embedUrl,
      };
    }),
  ].filter((item) => Boolean(item.url));

  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const current = mediaItems[active] || mediaItems[0] || {
    id: "empty",
    url: mainImage,
    type: "image" as const,
    alt: productName,
  };

  const isCurrentVideo = current.type === "video" || current.type === "youtube" || current.type === "vimeo";
  const parsedCurrent = parseMediaInfo(current.url);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCurrentVideo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Amazon-Style Desktop Layout: Left Thumbnails + Main Viewport */}
      <div style={{ display: "grid", gridTemplateColumns: mediaItems.length > 1 ? "72px 1fr" : "1fr", gap: 12, alignItems: "start" }}>
        {/* Thumbnails Strip (Left Column on Desktop) */}
        {mediaItems.length > 1 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 520,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {mediaItems.map((item, i) => {
              const isItemVid = item.type === "video" || item.type === "youtube" || item.type === "vimeo";
              const itemParsed = parseMediaInfo(item.url);
              const thumbSrc = item.posterUrl || (isItemVid ? itemParsed.posterUrl : item.url) || item.url;

              return (
                <button
                  key={item.id || i}
                  type="button"
                  onClick={() => {
                    setActive(i);
                    setZoom(false);
                  }}
                  style={{
                    position: "relative",
                    width: 68,
                    height: 68,
                    padding: 0,
                    border: active === i ? "2px solid var(--purple)" : "1px solid var(--line)",
                    background: "#f7f5f2",
                    cursor: "pointer",
                    opacity: active === i ? 1 : 0.7,
                    outline: active === i ? "1px solid var(--gold)" : "none",
                    overflow: "hidden",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                  title={item.title || item.alt || `Media ${i + 1}`}
                >
                  {thumbSrc ? (
                    <img
                      src={thumbSrc}
                      alt={item.alt || ""}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      🎬
                    </div>
                  )}

                  {/* Video Badge on thumbnail */}
                  {isItemVid && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        background: "rgba(35, 12, 57, 0.85)",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 4px",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      ▶
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Viewport */}
        <div style={{ position: "relative", width: "100%" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1 / 1",
              maxHeight: 520,
              overflow: "hidden",
              border: "1px solid var(--line)",
              background: "#faf8f5",
              cursor: isCurrentVideo ? "default" : zoom ? "zoom-out" : "zoom-in",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => {
              if (!isCurrentVideo) setZoom(!zoom);
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoom(false)}
          >
            {/* If Video: Render Player */}
            {isCurrentVideo ? (
              current.type === "youtube" || current.type === "vimeo" ? (
                <iframe
                  src={parsedCurrent.embedUrl}
                  style={{ width: "100%", height: "100%", border: 0 }}
                  title={current.title || productName}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={current.url}
                  poster={current.posterUrl || parsedCurrent.posterUrl}
                  controls
                  autoPlay
                  style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
                />
              )
            ) : (
              /* If Image: Render Image with Magnifier Zoom */
              <>
                <img
                  src={current.url}
                  alt={current.alt || productName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transform: zoom ? "scale(2.2)" : "scale(1)",
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transition: zoom ? "transform 0.08s ease-out" : "transform 0.25s ease-in-out",
                  }}
                />
                {zoom && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      fontSize: 11,
                      padding: "4px 10px",
                      background: "rgba(35, 12, 57, 0.8)",
                      color: "#fff",
                      letterSpacing: ".04em",
                    }}
                  >
                    Click to reset zoom
                  </span>
                )}
                {!zoom && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 10,
                      right: 10,
                      fontSize: 10,
                      padding: "3px 8px",
                      background: "rgba(255,255,255,0.85)",
                      color: "var(--purple)",
                      border: "1px solid var(--line)",
                      pointerEvents: "none",
                    }}
                  >
                    🔍 Roll over / click to zoom
                  </span>
                )}
              </>
            )}
          </div>

          {/* Media Counter */}
          {mediaItems.length > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
              <span>
                {current.type === "youtube" || current.type === "vimeo" || current.type === "video" ? "🎬 Video" : "🖼️ Photo"} {active + 1} of {mediaItems.length}
              </span>
              <span>{current.title || current.alt || productName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

