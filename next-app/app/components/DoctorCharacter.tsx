"use client";

import React, { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   DoctorCharacter — Queens Care AI Doctor
   Premium homepage section with Lottie animation + SVG fallback.
   GSAP scroll-reactive, reduced-motion safe, Admin-editable.
   ═══════════════════════════════════════════════════════════════ */

type DoctorCharacterProps = {
  enabled?: boolean;
  position?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
  animSpeed?: number;
  greeting?: string;
  subtext?: string;
  ctaText?: string;
  ctaLink?: string;
  bgStyle?: "purple" | "gold" | "white" | "gradient" | "transparent";
  mobileVisible?: boolean;
  lottieUrl?: string;
};

/* ── SVG Fallback Illustration ─────────────────────────────── */
function DoctorSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: "100%", height: "100%" }}
      aria-label="Queens Care Doctor character"
    >
      {/* Lab coat body */}
      <ellipse cx="200" cy="430" rx="110" ry="30" fill="rgba(212,175,55,0.08)" />
      <path d="M140 240 C140 200 160 180 200 175 C240 180 260 200 260 240 L270 420 C270 440 250 450 200 450 C150 450 130 440 130 420 Z" fill="#FAFAF8" stroke="#E8E4DC" strokeWidth="1.5" />
      {/* Coat details */}
      <line x1="200" y1="190" x2="200" y2="420" stroke="#E8E4DC" strokeWidth="1" strokeDasharray="4 3" />
      <circle cx="200" cy="230" r="3" fill="#D4AF37" />
      <circle cx="200" cy="270" r="3" fill="#D4AF37" />
      <circle cx="200" cy="310" r="3" fill="#D4AF37" />
      {/* Collar */}
      <path d="M160 195 L200 215 L240 195" fill="none" stroke="#E8E4DC" strokeWidth="1.5" />
      {/* Stethoscope */}
      <path d="M175 210 Q165 250 180 280" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <circle cx="180" cy="282" r="5" fill="#D4AF37" />
      {/* Neck */}
      <rect x="185" y="148" width="30" height="32" rx="10" fill="#E8C9A0" />
      {/* Head */}
      <ellipse cx="200" cy="120" rx="52" ry="58" fill="#E8C9A0" />
      {/* Hair — professional updo */}
      <path d="M148 100 C148 55 170 30 200 28 C230 30 252 55 252 100 C252 80 235 50 200 48 C165 50 148 80 148 100Z" fill="#3D1E0F" />
      <ellipse cx="200" cy="42" rx="28" ry="16" fill="#3D1E0F" />
      {/* Face */}
      <circle cx="183" cy="115" r="3.5" fill="#3D1E0F" /> {/* Left eye */}
      <circle cx="217" cy="115" r="3.5" fill="#3D1E0F" /> {/* Right eye */}
      <circle cx="184" cy="114" r="1" fill="#FFF" /> {/* Eye shine */}
      <circle cx="218" cy="114" r="1" fill="#FFF" />
      {/* Eyebrows */}
      <path d="M174 106 Q183 102 192 106" fill="none" stroke="#3D1E0F" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M208 106 Q217 102 226 106" fill="none" stroke="#3D1E0F" strokeWidth="1.5" strokeLinecap="round" />
      {/* Warm smile */}
      <path d="M188 132 Q200 142 212 132" fill="none" stroke="#C4756A" strokeWidth="2" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="172" cy="128" rx="10" ry="5" fill="rgba(212,130,110,0.2)" />
      <ellipse cx="228" cy="128" rx="10" ry="5" fill="rgba(212,130,110,0.2)" />
      {/* Lab coat name badge */}
      <rect x="210" y="220" width="40" height="24" rx="3" fill="#FAFAF8" stroke="#D4AF37" strokeWidth="1" />
      <line x1="215" y1="228" x2="245" y2="228" stroke="#280D38" strokeWidth="1.5" />
      <line x1="215" y1="234" x2="238" y2="234" stroke="#AAA" strokeWidth="1" />
      {/* Left arm — waving */}
      <path d="M140 250 Q110 230 95 200 Q88 185 100 180" fill="none" stroke="#FAFAF8" strokeWidth="20" strokeLinecap="round" />
      <path d="M140 250 Q110 230 95 200 Q88 185 100 180" fill="none" stroke="#E8E4DC" strokeWidth="1.5" />
      {/* Hand */}
      <ellipse cx="100" cy="178" rx="12" ry="10" fill="#E8C9A0" />
      {/* Right arm */}
      <path d="M260 250 Q285 280 275 330" fill="none" stroke="#FAFAF8" strokeWidth="20" strokeLinecap="round" />
      <path d="M260 250 Q285 280 275 330" fill="none" stroke="#E8E4DC" strokeWidth="1.5" />
      <ellipse cx="275" cy="332" rx="10" ry="8" fill="#E8C9A0" />
      {/* Stethoscope ear tips hint */}
      <path d="M165 170 L160 155" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M235 170 L240 155" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
      {/* Gold accent — Queens Care brand */}
      <path d="M155 420 L200 445 L245 420" fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

/* ── DoctorCharacter Component ─────────────────────────────── */
export default function DoctorCharacter(props: DoctorCharacterProps) {
  const {
    enabled = true,
    position = "center",
    size = "md",
    animSpeed = 1,
    greeting = "Hi, I'm Dr. Queens!",
    subtext = "I help you find the right formulations for your wellness journey.",
    ctaText = "Take the Quiz",
    ctaLink = "/recommendations",
    bgStyle = "gradient",
    mobileVisible = true,
    lottieUrl,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<HTMLDivElement>(null);
  const lottieInstance = useRef<ReturnType<typeof import("lottie-web").default.loadAnimation> | null>(null);
  const [lottieLoaded, setLottieLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  /* ── Reduced motion detection ───────────────────────────── */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* ── Load Lottie ────────────────────────────────────────── */
  useEffect(() => {
    if (!lottieUrl || !lottieRef.current || reducedMotion) return;
    let cancelled = false;

    (async () => {
      try {
        const lottie = (await import("lottie-web")).default;
        if (cancelled || !lottieRef.current) return;
        const anim = lottie.loadAnimation({
          container: lottieRef.current,
          renderer: "svg",
          loop: true,
          autoplay: !reducedMotion,
          path: lottieUrl,
        });
        anim.setSpeed(animSpeed);
        lottieInstance.current = anim;
        setLottieLoaded(true);
      } catch {
        setLottieLoaded(false);
      }
    })();

    return () => {
      cancelled = true;
      lottieInstance.current?.destroy();
      lottieInstance.current = null;
    };
  }, [lottieUrl, animSpeed, reducedMotion]);

  /* ── GSAP Scroll-reactive ───────────────────────────────── */
  useEffect(() => {
    if (reducedMotion || !containerRef.current || !lottieInstance.current) return;

    let kill: (() => void) | null = null;
    (async () => {
      try {
        const gsapModule = await import("gsap");
        const gsap = gsapModule.default;
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        gsap.registerPlugin(ScrollTrigger);

        const anim = lottieInstance.current;
        if (!anim || !containerRef.current) return;
        const totalFrames = anim.totalFrames || 1;

        const st = ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
          onUpdate: (self) => {
            const frame = Math.floor(self.progress * totalFrames);
            anim.goToAndStop(Math.min(frame, totalFrames - 1), true);
          },
        });

        kill = () => st.kill();
      } catch { /* GSAP not available */ }
    })();

    return () => { kill?.(); };
  }, [reducedMotion, lottieLoaded]);

  /* ── CSS classes ────────────────────────────────────────── */
  const isMobileHidden = !mobileVisible;
  const bgMap: Record<string, string> = {
    purple: "linear-gradient(135deg, #280D38 0%, #3e1654 100%)",
    gold: "linear-gradient(135deg, #D4AF37 0%, #F5E6A3 100%)",
    white: "#FAFAF8",
    gradient: "linear-gradient(180deg, rgba(40,13,56,0.03) 0%, rgba(212,175,55,0.06) 100%)",
    transparent: "transparent",
  };
  const isDark = bgStyle === "purple";
  const sizeMap = { sm: 180, md: 240, lg: 320 };
  const charSize = sizeMap[size] || 240;

  const posStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: position === "right" ? "row-reverse" : position === "center" ? "column" : "row",
    alignItems: "center",
    gap: 48,
    textAlign: position === "center" ? "center" : "left",
    maxWidth: 1100,
    margin: "0 auto",
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .qc-doctor-section[data-mobile-hidden="true"] { display: none !important; }
          .qc-doctor-section .qc-doctor-inner { flex-direction: column !important; text-align: center !important; }
          .qc-doctor-section .qc-doctor-character { width: 180px !important; height: 220px !important; }
        }
        @keyframes qc-doctor-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes qc-doctor-blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }
        .qc-doctor-float { animation: qc-doctor-float 4s ease-in-out infinite; }
        .qc-doctor-blink { animation: qc-doctor-blink 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .qc-doctor-float, .qc-doctor-blink { animation: none !important; }
        }
      `}</style>
      <section
        ref={containerRef}
        className="qc-doctor-section"
        data-mobile-hidden={isMobileHidden ? "true" : undefined}
        style={{
          padding: "80px 24px",
          background: bgMap[bgStyle] || bgMap.gradient,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={posStyle} className="qc-doctor-inner">
          {/* Character */}
          <div
            className="qc-doctor-character"
            style={{
              width: charSize,
              height: charSize * 1.25,
              flexShrink: 0,
              position: "relative",
            }}
          >
            {/* Lottie container */}
            {lottieUrl && (
              <div
                ref={lottieRef}
                className={!reducedMotion ? "qc-doctor-float" : ""}
                style={{
                  width: "100%",
                  height: "100%",
                  display: lottieLoaded ? "block" : "none",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
            )}
            {/* SVG Fallback */}
            <div
              className={!reducedMotion && !lottieLoaded ? "qc-doctor-float" : ""}
              style={{
                width: "100%",
                height: "100%",
                display: lottieLoaded ? "none" : "block",
                position: lottieUrl ? "absolute" : "relative",
                top: 0,
                left: 0,
              }}
            >
              <DoctorSVG />
            </div>
          </div>

          {/* Text content */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 12,
              }}
            >
              Queens Care AI Assistant
            </p>
            <h2
              style={{
                font: "clamp(28px, 4vw, 42px)/1.15 var(--font-display)",
                margin: "0 0 16px",
                color: isDark ? "#FAFAF8" : "var(--purple)",
              }}
            >
              {greeting}
            </h2>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.7,
                color: isDark ? "rgba(250,250,248,0.8)" : "#555",
                maxWidth: 480,
                marginBottom: 28,
              }}
            >
              {subtext}
            </p>
            <a
              href={ctaLink}
              className="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: isDark ? "#D4AF37" : "var(--purple)",
                color: isDark ? "#280D38" : "#FFF",
                padding: "14px 28px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              {ctaText} <span>→</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Default content for CMS ───────────────────────────────── */
export const doctorDefaults = {
  type: "doctor",
  label: "AI Doctor Character",
  content: {
    enabled: true,
    position: "center",
    size: "md",
    animSpeed: 1,
    greeting: "Hi, I'm Dr. Queens!",
    subtext: "I help you find the right formulations for your wellness journey.",
    ctaText: "Take the Quiz",
    ctaLink: "/recommendations",
    bgStyle: "gradient",
    mobileVisible: true,
    lottieUrl: "",
  },
};
