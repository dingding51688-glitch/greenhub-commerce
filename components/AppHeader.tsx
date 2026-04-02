"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export function AppHeader() {
  const { token, userEmail, logout } = useAuth();

  return (
    <header className="border-b border-white/5 bg-gradient-to-r from-brand-600/40 to-transparent">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/60">Bloom Vapor</p>
          <h1 className="text-lg font-semibold text-white">Customer Dashboard</h1>
        </div>
        <nav className="flex flex-1 justify-center gap-4 text-sm font-medium">
          <Link className="text-white/80 transition hover:text-white" href="/account">
            Account
          </Link>
          <Link className="text-white/80 transition hover:text-white" href="/orders">
            Orders
          </Link>
          <Link className="text-white/80 transition hover:text-white" href="/notifications">
            Notifications
          </Link>
          <Link className="text-white/80 transition hover:text-white" href="/how-it-works">
            How it works
          </Link>
          <Link className="text-white/80 transition hover:text-white" href="/faq">
            FAQ
          </Link>
          <Link className="text-white/80 transition hover:text-white" href="/contact">
            Contact
          </Link>
          <Link className="text-white/80 transition hover:text-white" href="/checkout">
            Checkout
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {token ? (
            <>
              <span className="text-white/60">{userEmail || "Signed in"}</span>
              <button
                onClick={logout}
                className="rounded-full border border-white/20 px-4 py-1 text-white/80 hover:border-white/50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-4 py-1 text-white/80 hover:border-white/50"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-brand-500 bg-brand-500/20 px-4 py-1 text-white"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
