import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Quote, RefreshCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { useEffect } from "react";
import { FlashCountdown } from "@/components/site/flash-countdown";
import { HeroSlider } from "@/components/site/hero-slider";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";
import { latestReviewsQueryOptions, productsQueryOptions } from "@/lib/queries";
import { trackVisit } from "@/lib/shop.functions";
import { CATEGORIES } from "@/lib/shop-constants";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/_site/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQueryOptions),
      context.queryClient.ensureQueryData(latestReviewsQueryOptions),
    ]),
  component: Home,
});

function isFlashActive(p: { is_flash_sale: boolean; flash_sale_price: number | null; flash_ends_at: string | null }) {
  return (
    p.is_flash_sale &&
    p.flash_sale_price != null &&
    p.flash_ends_at != null &&
    new Date(p.flash_ends_at).getTime() > Date.now()
  );
}

function Home() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const { data: reviews } = useSuspenseQuery(latestReviewsQueryOptions);

  useEffect(() => {
    trackVisit().catch(() => {});
  }, []);

  const flashItems = products.filter((p) => isFlashActive(p));
  const flashEndsAt =
    flashItems.length > 0
      ? flashItems
          .map((p) => new Date(p.flash_ends_at!).getTime())
          .reduce((a, b) => Math.min(a, b))
          .toString()
      : null;

  return (
    <>
      <HeroSlider />

      {/* Value strip */}
      <section className="border-b border-border bg-cream">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Truck, title: "Cash on Delivery", copy: "Pay only when your order arrives — nationwide." },
            { icon: RefreshCcw, title: "7-Day Exchange", copy: "Changed your mind? Easy, no-questions exchange." },
            { icon: ShieldCheck, title: "Quality Assured", copy: "Every piece is checked before it ships." },
          ].map((v) => (
            <div key={v.title} className="flex items-start gap-4">
              <v.icon className="mt-0.5 h-5 w-5 shrink-0 text-rose-deep" strokeWidth={1.5} />
              <div>
                <p className="eyebrow text-foreground">{v.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{v.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flash sale */}
      {flashItems.length > 0 && flashEndsAt ? (
        <section className="bg-primary py-14 text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6 text-center">
              <p className="eyebrow text-primary-foreground/70">Limited time only</p>
              <h2 className="font-display text-4xl font-medium md:text-5xl">Flash Sale</h2>
              <FlashCountdown endsAt={flashEndsAt} />
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {flashItems.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* New in */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="eyebrow text-rose-deep">Just arrived</p>
            <h2 className="mt-2 font-display text-4xl font-medium text-foreground md:text-5xl">New Collection</h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild className="h-12 rounded-none bg-primary px-10 text-[0.72rem] uppercase tracking-[0.22em]">
              <Link to="/shop">View all pieces</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-border bg-cream py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="eyebrow text-rose-deep">Curated for you</p>
            <h2 className="mt-2 font-display text-4xl font-medium text-foreground">Shop by Category</h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                to="/shop"
                search={{ category: c }}
                className="glass-card group flex h-28 items-center justify-center transition-colors hover:bg-card"
              >
                <span className="font-display text-xl font-medium tracking-wide text-foreground group-hover:text-rose-deep">
                  {c}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 ? (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="eyebrow text-rose-deep">Loved by our customers</p>
              <h2 className="mt-2 font-display text-4xl font-medium text-foreground">Kind Words</h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="glass-card p-8 text-center">
                  <Quote className="mx-auto h-6 w-6 text-rose-deep" strokeWidth={1.5} />
                  <blockquote className="mt-4 text-sm leading-relaxed text-ink-soft">“{r.comment}”</blockquote>
                  <figcaption className="mt-5">
                    <div className="flex items-center justify-center gap-1 text-rose-deep">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3 w-3" fill={i < r.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <p className="mt-2 text-sm font-medium tracking-wide text-foreground">{r.author}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
