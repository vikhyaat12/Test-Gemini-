"use client";

import { useState } from "react";

type GalleryImage = { id: string; url: string; alt?: string };

export default function ProductGallery({
  mainImage,
  productName,
  images,
}: {
  mainImage: string;
  productName: string;
  images: GalleryImage[];
}) {
  const allImages = [{ id: "main", url: mainImage, alt: productName }, ...images];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Main image */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4/5",
          overflow: "hidden",
          border: "1px solid var(--line)",
          cursor: zoom ? "zoom-out" : "zoom-in",
          background: "#f5f3ef",
        }}
        onClick={() => setZoom(!zoom)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoom(false)}
      >
        <img
          src={allImages[active].url}
          alt={allImages[active].alt || productName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: zoom ? "scale(2)" : "scale(1)",
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            transition: zoom ? "transform 0.1s ease" : "transform 0.3s ease",
          }}
        />
        {zoom && (
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: 10,
              padding: "4px 8px",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
            }}
          >
            Click to close zoom
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 8,
            overflowX: "auto",
          }}
        >
          {allImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => { setActive(i); setZoom(false); }}
              style={{
                flexShrink: 0,
                width: 64,
                height: 64,
                padding: 0,
                border: active === i ? "2px solid var(--purple)" : "1px solid var(--line)",
                background: "none",
                cursor: "pointer",
                opacity: active === i ? 1 : 0.6,
                transition: "opacity 0.2s",
              }}
            >
              <img
                src={img.url}
                alt={img.alt || `${productName} ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Image count */}
      {allImages.length > 1 && (
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
          {active + 1} / {allImages.length} images
        </p>
      )}
    </div>
  );
}
