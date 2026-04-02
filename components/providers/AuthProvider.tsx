"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_EMAIL_KEY, AUTH_TOKEN_KEY, getStoredEmail, getStoredToken, setStoredEmail, setStoredToken } from "@/lib/auth-store";

interface AuthContextValue {
  token: string | null;
  userEmail: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function postAuth(path: string, body: Record<string, unknown>) {
  if (!AUTH_BASE) {
    throw new Error("NEXT_PUBLIC_AUTH_BASE_URL is not configured");
  }
  const response = await fetch(`${AUTH_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Authentication failed");
  }
  return payload;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setToken(getStoredToken());
    setUserEmail(getStoredEmail());
  }, []);

  const login = async (identifier: string, password: string) => {
    const payload = await postAuth("/api/auth/local", { identifier, password });
    setToken(payload.jwt);
    setStoredToken(payload.jwt);
    const email = payload?.user?.email || null;
    setUserEmail(email);
    setStoredEmail(email);
  };

  const register = async (username: string, email: string, password: string) => {
    const payload = await postAuth("/api/auth/local/register", { username, email, password });
    setToken(payload.jwt);
    setStoredToken(payload.jwt);
    const storedEmail = payload?.user?.email || email;
    setUserEmail(storedEmail);
    setStoredEmail(storedEmail);
  };

  const logout = () => {
    setToken(null);
    setUserEmail(null);
    setStoredToken(null);
    setStoredEmail(null);
  };

  const value = useMemo(() => ({ token, userEmail, login, register, logout }), [token, userEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
