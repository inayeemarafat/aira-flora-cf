import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { ProductCard } from "@/components/site/product-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoriesQueryOptions, productsQueryOptions } from "@/lib/queries";
import { cn } from "@/lib/utils";

const shopSearch = z.object({
  category: z.string().optional(),
  sort: z.string().optional(),
});

export const Route = createFileRoute("/_site/shop")({
  validateSearch: (search) => shopSearch.parse(search),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQueryOptions),
      context.queryClient.ensureQueryData(categoriesQueryOptions),
    ]),
  component: ShopPage,
});

function ShopPage() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions);
  const { category, sort } = Route.useSearch();
  const navigate = Route.useNavigate();

  const visible = useMemo(() => {
    let list = category ? products.filter((p) => p.category === category) : [...products];
    if (sort === "sale") {
      list = list.filter(
        (p) =>
          p.is_flash_sale &&
          p.flash_sale_price != null &&
          p.flash_ends_at != null &&
          new Date(p.flash_ends_at).getTime() > Date.now(),
      );
    } else if (sort === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, category, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="text-center">
        <p className="eyebrow text-rose-deep">{category ?? "Everything"}</p>
        <h1 className="mt-2 font-display text-4xl font-medium text-foreground md:text-5xl">The Collection</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {visible.length} {visible.length === 1 ? "piece" : "pieces"}
          {sort === "sale" ? " on flash sale" : ""}
        </p>
      </header>

      <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => navigate({ search: {} })}
            className={cn(
              "rounded-full border border-border px-4 py-1.5 text-[0.68rem] uppercase tracking-[0.16em] transition-colors hover:border-rose-deep hover:text-rose-deep",
              !category && "border-foreground bg-foreground text-background hover:border-foreground hover:text-background",
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => navigate({ search: { category: c } })}
              className={cn(
                "rounded-full border border-border px-4 py-1.5 text-[0.68rem] uppercase tracking-[0.16em] transition-colors hover:border-rose-deep hover:text-rose-deep",
                category === c && "border-foreground bg-foreground text-background hover:border-foreground hover:text-background",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <Select
          value={sort ?? "new"}
          onValueChange={(value) => navigate({ search: value === "new" ? { category } : { category, sort: value } })}
        >
          <SelectTrigger className="w-44 rounded-none border-border bg-card text-xs uppercase tracking-[0.14em]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <p className="mt-20 text-center font-display text-2xl text-muted-foreground">
          Nothing here yet — check back soon.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
