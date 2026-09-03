"use client";

import { useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   MARQUEE — seamless scrolling text ticker
   Renders items in a continuous horizontal loop using GSAP.
   ═══════════════════════════════════════════════════════════════ */

interface MarqueeProps {
  items: string[];
  separator?: string;
  speed?: number;
  className?: string;
}

export default function Marquee({
  items,
  separator = "✦",
  speed = 24,
  className = "",
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !trackRef.current) return;
    initialized.current = true;

    const init = async () => {
      const gsapModule = await import("gsap");
      const gsap = gsapModule.default;

      const track = trackRef.current;
      if (!track) return;

      // Duplicate content for seamless loop
      track.innerHTML += track.innerHTML;

      gsap.to(track, {
        xPercent: -50,
        duration: speed,
        ease: "none",
        repeat: -1,
      });
    };

    init();
  }, [speed]);

  return (
    <div
      className={`premium-marquee ${className}`}
      aria-hidden="true"
    >
      <div ref={trackRef} className="premium-marquee__track">
        {items.map((item, i) => (
          <span key={i}>
            {item}
            <i>{separator}</i>
          </span>
        ))}
      </div>
    </div>
  );
}
