import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "aira-flora-cart-v1";

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "key">) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function itemKey(productId: string, size: string, color: string | null) {
  return `${productId}::${size}::${color ?? "-"}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "key">) => {
    const key = itemKey(item.productId, item.size, item.color);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key
            ? {
                ...i,
                quantity: Math.min(i.quantity + item.quantity, i.maxStock),
              }
            : i,
        );
      }
      return [...prev, { ...item, key }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.key !== key) return [i];
        const clamped = Math.max(1, Math.min(quantity, i.maxStock));
        return clamped > 0 ? [{ ...i, quantity: clamped }] : [];
      }),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    [items, isOpen, openCart, closeCart, addItem, removeItem, updateQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
