import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatBDT } from "@/lib/shop-constants";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, count } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : closeCart())}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="font-display text-xl tracking-wide">
            Your Bag <span className="text-sm text-muted-foreground">({count})</span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/50" strokeWidth={1} />
            <p className="font-display text-xl">Your bag is empty</p>
            <p className="text-sm text-muted-foreground">
              Discover the new collection and find something you'll love.
            </p>
            <Button asChild onClick={closeCart} className="mt-2 rounded-none bg-primary px-8">
              <Link to="/shop">Shop now</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="space-y-5">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-4">
                    <Link
                      to="/products/$slug"
                      params={{ slug: item.slug }}
                      onClick={closeCart}
                      className="h-24 w-20 shrink-0 overflow-hidden bg-muted"
                    >
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium leading-snug">{item.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Size {item.size}
                            {item.color ? ` · ${item.color}` : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.key)}
                          aria-label={`Remove ${item.name}`}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            className="p-1.5 text-muted-foreground hover:text-foreground"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            className="p-1.5 text-muted-foreground hover:text-foreground"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-medium">{formatBDT(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-muted-foreground">Subtotal</span>
                <span className="font-display text-xl font-semibold">{formatBDT(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Shipping calculated at checkout · Free over ৳2,000 inside Dhaka
              </p>
              <Button asChild onClick={closeCart} className="mt-4 h-12 w-full rounded-none bg-primary text-base tracking-widest">
                <Link to="/checkout">Checkout</Link>
              </Button>
              <Separator className="my-3 opacity-0" />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
