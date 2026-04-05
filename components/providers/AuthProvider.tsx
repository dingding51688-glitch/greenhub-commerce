"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AUTH_EMAIL_KEY,
  AUTH_TOKEN_KEY,
  getStoredEmail,
  getStoredToken,
  setStoredEmail,
  setStoredToken
} from "@/lib/auth-store";
import { getStoredReferralCode } from "@/lib/referral-tracking";
import type { FavoriteProduct, ProductRecord } from "@/lib/types";

type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  telegramHandle?: string;
};

type AuthProfile = {
  id: number;
  email: string;
  username?: string;
  fullName?: string;
  phone?: string;
  telegramHandle?: string;
  documentId?: string;
  walletTransferId?: string;
  customer?: {
    documentId?: string;
  };
};

interface AuthContextValue {
  /** Whether the auth state has been hydrated from storage. Always check before redirecting on missing token. */
  isReady: boolean;
  token: string | null;
  userEmail: string | null;
  profile: AuthProfile | null;
  favorites: FavoriteProduct[];
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
  addFavorite: (product: ProductRecord) => Promise<void>;
  removeFavorite: (productId: number) => Promise<void>;
  isFavorite: (productId: number) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const setAuthCookie = (token: string | null) => {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; sameSite=Lax`;
  } else {
    document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; sameSite=Lax`;
  }
};

function buildFavoriteSnapshot(product: ProductRecord): FavoriteProduct {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    strain: product.strain,
    thc: product.thc ?? null,
    potency: product.potency ?? null,
    priceFrom: product.priceFrom,
    coverImage: product.coverImage ?? null,
    addedAt: new Date().toISOString()
  };
}

async function fetchProfile(jwt: string) {
  const response = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${jwt}`
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Unable to load profile");
  }
  return payload as AuthProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);

  const hydrateFromStorage = useCallback(() => {
    const storedToken = getStoredToken();
    const storedEmail = getStoredEmail();
    setToken(storedToken);
    setUserEmail(storedEmail);
    setIsReady(true);
    if (storedToken) {
      fetchProfile(storedToken)
        .then((data) => {
          setProfile(data);
          if (data?.email) {
            setUserEmail(data.email);
            setStoredEmail(data.email);
          }
        })
        .catch((error) => console.warn("Profile hydrate failed", error));
    }
  }, []);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const refreshFavorites = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      return;
    }
    try {
      const response = await fetch("/api/account/favorites");
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setFavorites(Array.isArray(payload?.favorites) ? payload.favorites : []);
      }
    } catch (error) {
      console.warn("Unable to refresh favorites", error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshFavorites();
    } else {
      setFavorites([]);
    }
  }, [token, refreshFavorites]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchProfile(token);
      setProfile(data);
      if (data?.email) {
        setUserEmail(data.email);
        setStoredEmail(data.email);
      }
    } catch (error) {
      console.warn("Unable to refresh profile", error);
    }
  }, [token]);

  const addFavorite = useCallback(async (product: ProductRecord) => {
    if (!token) throw new Error("Please sign in");
    const previous = favorites;
    const snapshot = buildFavoriteSnapshot(product);
    setFavorites((prev) => [snapshot, ...prev.filter((fav) => fav.productId !== product.id)]);
    try {
      const response = await fetch("/api/account/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: snapshot })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to save favorite");
      }
      if (Array.isArray(payload?.favorites)) {
        setFavorites(payload.favorites);
      }
    } catch (error) {
      setFavorites(previous);
      throw error;
    }
  }, [token, favorites]);

  const removeFavorite = useCallback(async (productId: number) => {
    if (!token) throw new Error("Please sign in");
    const previous = favorites;
    setFavorites((prev) => prev.filter((fav) => fav.productId !== productId));
    try {
      const response = await fetch("/api/account/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to remove favorite");
      }
      if (Array.isArray(payload?.favorites)) {
        setFavorites(payload.favorites);
      }
    } catch (error) {
      setFavorites(previous);
      throw error;
    }
  }, [token, favorites]);

  const isFavorite = useCallback((productId: number) => favorites.some((fav) => fav.productId === productId), [favorites]);

  const handleAuthSuccess = useCallback(
    async (jwt: string, email?: string | null) => {
      setToken(jwt);
      setStoredToken(jwt);
      setAuthCookie(jwt);
      const resolvedEmail = email || getStoredEmail();
      if (resolvedEmail) {
        setUserEmail(resolvedEmail);
        setStoredEmail(resolvedEmail);
      }
      try {
        const data = await fetchProfile(jwt);
        setProfile(data);
        if (data?.email) {
          setUserEmail(data.email);
          setStoredEmail(data.email);
        }
        await refreshFavorites();
      } catch (error) {
        console.warn("Profile fetch after auth failed", error);
      }
    },
    [refreshFavorites]
  );

  const login = useCallback(
    async (identifier: string, password: string) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Authentication failed");
      }
      await handleAuthSuccess(payload.jwt, payload?.user?.email);
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async ({ fullName, email, password, phone, telegramHandle }: RegisterPayload) => {
      const referralCode = getStoredReferralCode();
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, phone, telegramHandle, referralCode })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Registration failed");
      }
      await handleAuthSuccess(payload.jwt, payload?.user?.email || email);
    },
    [handleAuthSuccess]
  );

  const logout = useCallback(() => {
    setToken(null);
    setProfile(null);
    setUserEmail(null);
    setStoredToken(null);
    setStoredEmail(null);
    setAuthCookie(null);
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      token,
      userEmail,
      profile,
      favorites,
      login,
      register,
      logout,
      refreshProfile,
      refreshFavorites,
      addFavorite,
      removeFavorite,
      isFavorite
    }),
    [isReady, token, userEmail, profile, favorites, login, register, logout, refreshProfile, refreshFavorites, addFavorite, removeFavorite, isFavorite]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
