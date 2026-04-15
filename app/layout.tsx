import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { DesktopHeader, MobileTabBar } from "@/components/navigation";
import { ReferralCapture } from "@/components/ReferralCapture";
import { ReferralTrackingProvider } from "@/components/providers/ReferralTrackingProvider";
import PageTracker from "@/components/tracking/PageTracker";
import { AgeGate } from "@/components/AgeGate";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.greenhub420.co.uk";
const SITE_NAME = "Green Hub 420";
const SITE_DESC = "Buy weed online UK — premium cannabis delivered to InPost lockers nationwide. Discreet, vacuum-sealed, 24/7 pickup. Fast delivery across the UK including Northern Ireland.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Green Hub 420 — Buy Weed Online UK | InPost Locker Delivery",
    template: "%s | Green Hub 420",
  },
  description: SITE_DESC,
  keywords: [
    "buy weed uk", "buy weed online uk", "weed delivery uk",
    "cannabis delivery uk", "420 delivery uk",
    "buy weed inpost locker", "weed inpost delivery",
    "weed delivery northern ireland", "420 delivery northern ireland",
    "weed delivery belfast", "cannabis belfast",
    "discreet weed delivery uk", "buy cannabis online uk",
    "weed locker pickup uk", "green hub 420",
  ],
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Green Hub 420 — Buy Weed Online UK | InPost Locker Delivery",
    description: SITE_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: "Green Hub 420 — Buy Weed Online UK",
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "p1DI5ySPDI-AcULVN-yl-1y0isT6dq0QLFfzIb5gpUE",
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="text-white" suppressHydrationWarning>
        <AgeGate>
          <AuthProvider>
            <CartProvider>
              <NotificationProvider>
                <Suspense fallback={null}><ReferralCapture /></Suspense>
                <ReferralTrackingProvider>
                <PageTracker />
                <div className="min-h-screen flex flex-col">
                  <DesktopHeader />
                  <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-24 sm:pb-8">{children}</main>
                  <MobileTabBar />
                </div>
                </ReferralTrackingProvider>
              </NotificationProvider>
            </CartProvider>
          </AuthProvider>
        </AgeGate>
      </body>
    </html>
  );
}
