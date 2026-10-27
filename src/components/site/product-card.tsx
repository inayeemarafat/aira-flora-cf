import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatBDT } from "@/lib/shop-constants";

export function ProductCard({ product }: { product: Product }) {
  const flashActive =
    product.is_flash_sale &&
    product.flash_sale_price != null &&
    product.flash_ends_at != null &&
    new Date(product.flash_ends_at).getTime() > Date.now();

  const price = flashActive ? product.flash_sale_price! : product.price;

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group block"
      preload="intent"
    >
      <div className="hover-zoom relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {flashActive ? (
          <span className="absolute left-3 top-3 bg-rose-deep px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white">
            Flash Sale
          </span>
        ) : product.compare_price && product.compare_price > product.price ? (
          <span className="absolute left-3 top-3 bg-primary px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
            Save {formatBDT(product.compare_price - product.price)}
          </span>
        ) : product.stock === 0 ? (
          <span className="absolute left-3 top-3 bg-muted px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-foreground">
            Sold out
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-background/90 py-3 text-center text-[0.7rem] font-medium uppercase tracking-[0.2em] text-foreground backdrop-blur transition-transform duration-300 group-hover:translate-y-0">
          View Details
        </div>
      </div>
      <div className="pt-4 text-center">
        <div className="flex items-center justify-center gap-1 text-rose-deep">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="h-3 w-3"
              fill={i < Math.round(product.rating) ? "currentColor" : "none"}
            />
          ))}
          <span className="ml-1 text-[0.68rem] text-muted-foreground">({product.reviews_count})</span>
        </div>
        <h3 className="mt-1.5 text-sm font-medium tracking-wide text-foreground">{product.name}</h3>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className={flashActive ? "text-rose-deep" : "text-foreground"}>{formatBDT(price)}</span>
          {product.compare_price && product.compare_price > price ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatBDT(product.compare_price)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
