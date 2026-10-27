import { queryOptions } from "@tanstack/react-query";
import { getProductBySlug, listLatestReviews, listProducts } from "./shop.functions";

export const productsQueryOptions = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const latestReviewsQueryOptions = queryOptions({
  queryKey: ["reviews", "latest"],
  queryFn: () => listLatestReviews(),
});

export const productDetailQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });
