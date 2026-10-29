import { Link } from "@tanstack/react-router";
import { Heart, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useWishlist } from "@/store/wishlist";
import { formatBDT } from "@/lib/shop-constants";

export function WishlistDrawer() {
  const { items, isOpen, close, remove } = useWishlist();
  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <div className="border-b border-border px-6 py-5">
          <SheetTitle className="font-display text-2xl tracking-wide">Your Wishlist</SheetTitle>
          <p className="eyebrow mt-1 text-[0.6rem] text-muted-foreground">{items.length} saved pieces</p>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <Heart className="h-10 w-10 text-rose-deep" />
            <p className="text-sm text-muted-foreground">Tap the heart on any piece to save it here.</p>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-border overflow-y-auto px-6">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 py-4">
                <Link to="/products/$slug" params={{ slug: item.slug }} onClick={close} className="h-24 w-20 shrink-0 overflow-hidden bg-muted">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link to="/products/$slug" params={{ slug: item.slug }} onClick={close} className="text-sm font-medium">
                    {item.name}
                  </Link>
                  <span className="mt-1 text-sm text-rose-deep">{formatBDT(item.price)}</span>
                  <Link
                    to="/products/$slug"
                    params={{ slug: item.slug }}
                    onClick={close}
                    className="eyebrow mt-auto text-[0.62rem] text-foreground underline underline-offset-4"
                  >
                    Choose size & add to bag
                  </Link>
                </div>
                <button onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`} className="self-start p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
