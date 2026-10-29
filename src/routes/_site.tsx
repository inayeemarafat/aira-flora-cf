import { Outlet, createFileRoute } from "@tanstack/react-router";
import { CartProvider } from "@/store/cart";
import { WishlistProvider } from "@/store/wishlist";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CartDrawer } from "@/components/site/cart-drawer";
import { WishlistDrawer } from "@/components/site/wishlist-drawer";
import { MobileBottomNav } from "@/components/site/mobile-bottom-nav";
import { ScrollToTop } from "@/components/site/scroll-to-top";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  return (
    <CartProvider>
      <WishlistProvider>
        <div className="flex min-h-screen flex-col bg-background pb-16 md:pb-0">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
          <CartDrawer />
          <WishlistDrawer />
          <MobileBottomNav />
          <ScrollToTop />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
