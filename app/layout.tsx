import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { DesktopHeader } from "@/components/navigation";
import { ReferralCapture } from "@/components/ReferralCapture";
import PageTracker from "@/components/tracking/PageTracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Green Hub 420 — Order Online & Collect at InPost Lockers",
  description: "Premium products delivered to your nearest InPost locker. Secure, anonymous, 24/7 pickup across Northern Ireland.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-white">
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <Suspense fallback={null}><ReferralCapture /></Suspense>
              <PageTracker />
              <div className="min-h-screen flex flex-col">
                <DesktopHeader />
                <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
              </div>
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
