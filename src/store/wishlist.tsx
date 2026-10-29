import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
}

interface WishlistValue {
  items: WishlistItem[];
  count: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: (item: WishlistItem) => boolean;
  remove: (id: string) => void;
  has: (id: string) => boolean;
}

const KEY = "aira_flora_wishlist";
const Ctx = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, loaded]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);
  const toggle = useCallback(
    (item: WishlistItem) => {
      const exists = items.some((i) => i.id === item.id);
      setItems((prev) => (exists ? prev.filter((i) => i.id !== item.id) : [...prev, item]));
      return !exists;
    },
    [items],
  );
  const remove = useCallback((id: string) => setItems((p) => p.filter((i) => i.id !== id)), []);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle,
      remove,
      has,
    }),
    [items, isOpen, toggle, remove, has],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
