import type { Metadata } from "next";
import "./globals.css";
import "./premium-animations.css";
import { Fraunces, Inter } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["300", "400", "500", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
import { ReticleDev } from "./reticle-dev";
import Providers from "./providers";
import AnalyticsTracker from "./components/AnalyticsTracker";
import PremiumAnimations from "./components/PremiumAnimations";
import SitePopup from "./components/SitePopup";

export const metadata: Metadata = {
  title: {
    default: "Queens Care Laboratories | Science with Soul",
    template: "%s | Queens Care",
  },
  description:
    "Premium wellness and pharmaceutical care, made with rigorous science and a human touch.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    siteName: "Queens Care Laboratories",
    title: "Queens Care Laboratories",
  },
  robots:
    process.env.NODE_ENV === "production"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <Providers>
          <AnalyticsTracker />
          <PremiumAnimations />
          <SitePopup />
          {children}
        </Providers>
        {process.env.NODE_ENV === "development" ? <ReticleDev /> : null}
      </body>
    </html>
  );
}