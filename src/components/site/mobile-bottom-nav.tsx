import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Home, LayoutGrid, ShoppingBag, Truck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { CATEGORIES } from "@/lib/shop-constants";
import { productsQueryOptions } from "@/lib/queries";

function Item({
  label,
  icon,
  active,
  badge,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
        active ? "text-rose-deep" : "text-foreground/70"
      }`}
    >
      <span className="relative">
        {icon}
        {badge ? (
          <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-deep px-1 text-[0.55rem] font-semibold text-background">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="text-[0.6rem] font-medium uppercase tracking-[0.12em]">{label}</span>
      {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-rose-deep" />}
    </button>
  );
}

export function MobileBottomNav() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { count, openCart } = useCart();
  const wishlist = useWishlist();
  const [catOpen, setCatOpen] = useState(false);
  const { data: products = [] } = useQuery({ ...productsQueryOptions, enabled: catOpen });

  const cats = CATEGORIES.map((c) => {
    const list = products.filter((p) => p.category === c);
    return { name: c, count: list.length, image: list[0]?.image };
  });

  const ic = "h-5 w-5";
  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden">
        <div className="flex">
          <Item label="Home" icon={<Home className={ic} />} active={path === "/"} onClick={() => navigate({ to: "/" })} />
          <Item label="Categories" icon={<LayoutGrid className={ic} />} active={catOpen || path === "/shop"} onClick={() => setCatOpen(true)} />
          <Item label="Track" icon={<Truck className={ic} />} active={path === "/track"} onClick={() => navigate({ to: "/track" })} />
          <Item label="Wishlist" icon={<Heart className={ic} />} active={wishlist.isOpen} badge={wishlist.count} onClick={wishlist.open} />
          <Item label="Cart" icon={<ShoppingBag className={ic} />} badge={count} onClick={openCart} />
        </div>
      </nav>

      <Sheet open={catOpen} onOpenChange={setCatOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-3xl px-5 pb-8 pt-6">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
          <SheetTitle className="font-display text-2xl tracking-wide">Shop by Category</SheetTitle>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link to="/shop" onClick={() => setCatOpen(false)} className="col-span-2 flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
              <span className="eyebrow text-[0.65rem]">All pieces</span>
              <span className="text-xs">{products.length || ""}</span>
            </Link>
            {cats.map((c) => (
              <Link
                key={c.name}
                to="/shop"
                search={{ category: c.name }}
                onClick={() => setCatOpen(false)}
                className="group flex items-center gap-3 border border-border p-2"
              >
                <div className="h-14 w-12 shrink-0 overflow-hidden bg-muted">
                  {c.image && <img src={c.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-[0.65rem] text-muted-foreground">{c.count} items</p>
                </div>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
