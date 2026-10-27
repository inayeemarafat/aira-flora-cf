import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

function Brand() {
  return (
    <Link to="/" className="flex flex-col items-center leading-none">
      <span className="font-display text-2xl font-semibold tracking-[0.12em] text-foreground sm:text-[1.7rem]">
        AIRA FLORA
      </span>
      <span className="eyebrow mt-1 text-[0.5rem] text-rose-deep">Premium Modest Fashion</span>
    </Link>
  );
}

const NAV = [
  { label: "Home", to: "/" as const, search: undefined },
  { label: "Shop", to: "/shop" as const, search: undefined },
  { label: "Flash Sale", to: "/shop" as const, search: { sort: "sale" } },
  { label: "Track Order", to: "/track" as const, search: undefined },
];

export function Header() {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Announcement marquee */}
      <div className="overflow-hidden bg-primary py-2 text-primary-foreground">
        <div className="flex w-max animate-marquee gap-16 whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-16">
              <span className="eyebrow text-[0.6rem]">Cash on Delivery nationwide</span>
              <span className="eyebrow text-[0.6rem]">Free shipping on orders over ৳2,000</span>
              <span className="eyebrow text-[0.6rem]">New Spring Collection — now live</span>
              <span className="eyebrow text-[0.6rem]">Easy 7-day exchange</span>
            </div>
          ))}
        </div>
      </div>

      <header className="glass sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile menu */}
          <div className="flex flex-1 items-center lg:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-6">
                <SheetTitle className="font-display text-xl tracking-widest">Aira Flora</SheetTitle>
                <nav className="mt-8 flex flex-col gap-2">
                  {NAV.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => {
                        setMenuOpen(false);
                        if (link.to === "/shop" && link.search) {
                          navigate({ to: "/shop", search: link.search });
                        } else if (link.to === "/shop") {
                          navigate({ to: "/shop" });
                        } else if (link.to === "/track") {
                          navigate({ to: "/track" });
                        } else {
                          navigate({ to: "/" });
                        }
                      }}
                      className="rounded-md px-3 py-3 text-left text-sm font-medium tracking-wide text-foreground transition-colors hover:bg-accent"
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center gap-8 lg:flex">
            <Link
              to="/"
              className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:text-rose-deep [&.active]:text-rose-deep"
              activeProps={{ className: "active" }}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:text-rose-deep [&.active]:text-rose-deep"
              activeProps={{ className: "active" }}
            >
              Shop
            </Link>
            <Link
              to="/shop"
              search={{ sort: "sale" }}
              className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-rose-deep transition-colors hover:text-foreground"
            >
              Flash Sale
            </Link>
            <Link
              to="/track"
              className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:text-rose-deep [&.active]:text-rose-deep"
              activeProps={{ className: "active" }}
            >
              Track Order
            </Link>
          </nav>

          <Brand />

          <div className="flex flex-1 items-center justify-end gap-1">
            <Link
              to="/track"
              className="hidden rounded-full p-2 text-foreground/80 transition-colors hover:text-rose-deep sm:inline-flex"
              aria-label="Track your order"
            >
              <Menu className="h-5 w-5 opacity-0" aria-hidden />
              <ShoppingBag className="hidden" aria-hidden />
            </Link>
            <button
              onClick={openCart}
              className="relative rounded-full p-2 text-foreground transition-colors hover:text-rose-deep"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-deep px-1 text-[0.65rem] font-semibold text-background">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
