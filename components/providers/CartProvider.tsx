"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/* ── Types ── */

export type CartItem = {
  productId: number;
  slug: string;
  title: string;
  image: string | null;
  weight: string;
  unitPrice: number;
  quantity: number;
};

/** Unique key for deduplication: same product + same weight = same line */
function itemKey(productId: number, weight: string) {
  return `${productId}::${weight}`;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, weight: string) => void;
  updateQty: (productId: number, weight: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "gh:cart";
const MAX_QTY = 10;

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // quota exceeded — silently ignore
  }
}

/* ── Provider ── */

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
  }, []);

  // Persist whenever items change (after hydration)
  useEffect(() => {
    if (hydrated) writeStorage(items);
  }, [items, hydrated]);

  const addItem = useCallback((incoming: CartItem) => {
    setItems((prev) => {
      const key = itemKey(incoming.productId, incoming.weight);
      const idx = prev.findIndex((i) => itemKey(i.productId, i.weight) === key);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: Math.min(MAX_QTY, updated[idx].quantity + incoming.quantity),
        };
        return updated;
      }
      return [...prev, { ...incoming, quantity: Math.min(MAX_QTY, incoming.quantity) }];
    });
  }, []);

  const removeItem = useCallback((productId: number, weight: string) => {
    const key = itemKey(productId, weight);
    setItems((prev) => prev.filter((i) => itemKey(i.productId, i.weight) !== key));
  }, []);

  const updateQty = useCallback((productId: number, weight: string, quantity: number) => {
    if (quantity < 1) return;
    const key = itemKey(productId, weight);
    setItems((prev) =>
      prev.map((i) =>
        itemKey(i.productId, i.weight) === key
          ? { ...i, quantity: Math.min(MAX_QTY, quantity) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, totalItems, subtotal, addItem, removeItem, updateQty, clearCart }),
    [items, totalItems, subtotal, addItem, removeItem, updateQty, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
