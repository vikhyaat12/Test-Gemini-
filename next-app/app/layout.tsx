import type { Metadata } from "next";
import "./globals.css";
import { ReticleDev } from "./reticle-dev";
import Providers from "./providers";
import AnalyticsTracker from "./components/AnalyticsTracker";

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
    <html lang="en">
      <body>
        <Providers>
          <AnalyticsTracker />
          {children}
        </Providers>
        {process.env.NODE_ENV === "development" ? <ReticleDev /> : null}
      </body>
    </html>
  );
}