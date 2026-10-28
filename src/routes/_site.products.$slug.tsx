import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Star, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/site/product-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { productDetailQueryOptions } from "@/lib/queries";
import { formatBDT } from "@/lib/shop-constants";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";

export const Route = createFileRoute("/_site/products/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(productDetailQueryOptions(params.slug));
    if (!data) throw notFound();
    return data;
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product, reviews, related } = Route.useLoaderData();
  const { addItem, openCart } = useCart();
  const navigate = useNavigate();

  const gallery = product.gallery.length ? product.gallery : [product.image];
  const [image, setImage] = useState(gallery[0]);
  const [size, setSize] = useState(product.sizes[0] ?? "M");
  const [color, setColor] = useState<string | null>(product.colors[0]?.name ?? null);
  const [qty, setQty] = useState(1);

  const flashActive =
    product.is_flash_sale &&
    product.flash_sale_price != null &&
    product.flash_ends_at != null &&
    new Date(product.flash_ends_at).getTime() > Date.now();
  const price = flashActive ? product.flash_sale_price! : product.price;
  const soldOut = product.stock === 0;

  function add() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price,
      size,
      color,
      quantity: qty,
      maxStock: product.stock,
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="hover-zoom relative aspect-[3/4] overflow-hidden bg-muted">
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
            {flashActive ? (
              <span className="absolute left-3 top-3 bg-rose-deep px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white">
                Flash Sale
              </span>
            ) : null}
          </div>
          {gallery.length > 1 ? (
            <div className="mt-3 flex gap-3">
              {gallery.map((g) => (
                <button
                  key={g}
                  onClick={() => setImage(g)}
                  aria-label="View image"
                  className={cn(
                    "h-20 w-16 overflow-hidden border bg-muted",
                    image === g ? "border-foreground" : "border-border opacity-70 hover:opacity-100",
                  )}
                >
                  <img src={g} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Info */}
        <div className="lg:pt-4">
          <p className="eyebrow text-rose-deep">{product.category}</p>
          <h1 className="mt-2 font-display text-4xl font-medium leading-tight text-foreground md:text-5xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-0.5 text-rose-deep">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5" fill={i < Math.round(product.rating) ? "currentColor" : "none"} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {product.rating.toFixed(1)} · {product.reviews_count} reviews
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className={cn("font-display text-3xl font-semibold", flashActive && "text-rose-deep")}>
              {formatBDT(price)}
            </span>
            {product.compare_price && product.compare_price > price ? (
              <span className="text-lg text-muted-foreground line-through">{formatBDT(product.compare_price)}</span>
            ) : null}
          </div>

          {soldOut ? (
            <p className="mt-3 text-sm font-medium text-destructive">Currently sold out</p>
          ) : product.stock <= 5 ? (
            <p className="mt-3 text-sm font-medium text-rose-deep">Only {product.stock} left in stock</p>
          ) : null}

          {/* Size */}
          <div className="mt-8">
            <p className="eyebrow text-foreground/70">Size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={cn(
                    "h-10 min-w-11 border px-3 text-sm transition-colors",
                    size === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          {product.colors.length > 0 ? (
            <div className="mt-6">
              <p className="eyebrow text-foreground/70">Color — {color}</p>
              <div className="mt-3 flex gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    aria-label={c.name}
                    style={{ backgroundColor: c.hex }}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform",
                      color === c.name ? "scale-110 border-foreground" : "border-border hover:scale-105",
                    )}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Qty + actions */}
          <div className="mt-8 flex items-stretch gap-3">
            <div className="flex items-center border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 text-muted-foreground hover:text-foreground"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="px-3 text-muted-foreground hover:text-foreground"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              disabled={soldOut}
              onClick={() => {
                add();
                openCart();
              }}
              variant="outline"
              className="flex-1 rounded-none border-foreground uppercase tracking-[0.18em] hover:bg-accent"
            >
              <ShoppingBag className="mr-2 h-4 w-4" /> Add to bag
            </Button>
            <Button
              disabled={soldOut}
              onClick={() => {
                add();
                navigate({ to: "/checkout" });
              }}
              className="flex-1 rounded-none bg-primary uppercase tracking-[0.18em]"
            >
              Buy now
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
            <Truck className="h-4 w-4 text-rose-deep" strokeWidth={1.5} />
            Cash on delivery · Free shipping on orders over ৳2,000
          </div>

          <Accordion type="single" collapsible className="mt-8">
            <AccordionItem value="details">
              <AccordionTrigger className="eyebrow text-foreground/80">Description</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-ink-soft">
                {product.description}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 ? (
        <section className="mt-20 border-t border-border pt-14">
          <h2 className="font-display text-3xl font-medium text-foreground">Customer Reviews</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="glass-card p-6">
                <div className="flex items-center gap-1 text-rose-deep">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3" fill={i < r.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed text-ink-soft">“{r.comment}”</blockquote>
                <figcaption className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-foreground/70">
                  {r.author}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* Related */}
      {related.length > 0 ? (
        <section className="mt-20 border-t border-border pt-14">
          <h2 className="text-center font-display text-3xl font-medium text-foreground">You may also like</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
