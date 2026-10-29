import type { Coupon, Order, OrderItem, Product, ProductReview } from "./types";

/* ---------------- Minimal Cloudflare binding types ---------------- */

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: { changes?: number; [key: string]: unknown };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

export interface R2ObjectBody {
  body: ReadableStream;
  httpEtag?: string;
}

export interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
}

export interface AppEnv {
  DB: D1Database;
  IMAGES: R2Bucket;
  ADMIN_PASSWORD?: string;
}

/**
 * Returns the Worker bindings (D1 `DB`, R2 `IMAGES`, secret `ADMIN_PASSWORD`).
 * Must be called inside a request handler. The specifier is built at runtime so
 * the bundler leaves the Workers-only `cloudflare:workers` module alone.
 */
export async function getEnv(): Promise<AppEnv> {
  try {
    const specifier = ["cloudflare", "workers"].join(":");
    const mod = (await import(/* @vite-ignore */ specifier)) as { env?: AppEnv };
    if (mod.env) return mod.env;
  } catch {
    // fall through to the global some runtimes expose
  }
  const fallback = (globalThis as { __env__?: AppEnv }).__env__;
  if (fallback) return fallback;
  throw new Error("Cloudflare bindings (DB / IMAGES) are not available in this runtime.");
}

export async function getDb(): Promise<D1Database> {
  const env = await getEnv();
  if (!env.DB) throw new Error("The D1 binding `DB` is missing.");
  return env.DB;
}

export async function getImagesBucket(): Promise<R2Bucket> {
  const env = await getEnv();
  if (!env.IMAGES) throw new Error("The R2 binding `IMAGES` is missing.");
  return env.IMAGES;
}

/* ---------------- Helpers ---------------- */

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}

type Row = Record<string, unknown>;

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function numOrNull(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function strOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

export function mapProduct(r: Row): Product {
  return {
    id: String(r["id"]),
    name: String(r["name"]),
    slug: String(r["slug"]),
    description: String(r["description"] ?? ""),
    category: String(r["category"]),
    price: Number(r["price"]),
    compare_price: numOrNull(r["compare_price"]),
    stock: Number(r["stock"]),
    sizes: parseJson<string[]>(r["sizes"], []),
    colors: parseJson<Product["colors"]>(r["colors"], []),
    image: String(r["image"]),
    gallery: parseJson<string[]>(r["gallery"], []),
    is_featured: Boolean(r["is_featured"]),
    is_flash_sale: Boolean(r["is_flash_sale"]),
    flash_sale_price: numOrNull(r["flash_sale_price"]),
    flash_ends_at: strOrNull(r["flash_ends_at"]),
    rating: Number(r["rating"]),
    reviews_count: Number(r["reviews_count"]),
    created_at: String(r["created_at"]),
  };
}

export function mapReview(r: Row): ProductReview {
  return {
    id: String(r["id"]),
    product_id: String(r["product_id"]),
    author: String(r["author"]),
    rating: Number(r["rating"]),
    comment: String(r["comment"]),
    created_at: String(r["created_at"]),
  };
}

export function mapOrder(r: Row): Order {
  return {
    id: String(r["id"]),
    order_id: String(r["order_id"]),
    customer_name: String(r["customer_name"]),
    address: String(r["address"]),
    shipping_area: String(r["shipping_area"]),
    mobile: String(r["mobile"]),
    email: strOrNull(r["email"]),
    remarks: strOrNull(r["remarks"]),
    total_amount: Number(r["total_amount"]),
    subtotal: Number(r["subtotal"]),
    shipping_cost: Number(r["shipping_cost"]),
    discount_amount: Number(r["discount_amount"]),
    coupon_code: strOrNull(r["coupon_code"]),
    status: String(r["status"]) as Order["status"],
    payment_method: String(r["payment_method"]),
    created_at: String(r["created_at"]),
    updated_at: String(r["updated_at"]),
  };
}

export function mapOrderItem(r: Row): OrderItem {
  return {
    id: String(r["id"]),
    order_id: String(r["order_id"]),
    product_id: strOrNull(r["product_id"]),
    product_name: String(r["product_name"]),
    image: strOrNull(r["image"]),
    size: String(r["size"]),
    color: strOrNull(r["color"]),
    quantity: Number(r["quantity"]),
    price: Number(r["price"]),
  };
}

export function mapCoupon(r: Row): Coupon {
  return {
    id: String(r["id"]),
    code: String(r["code"]),
    type: String(r["type"]) as Coupon["type"],
    value: Number(r["value"]),
    min_order: Number(r["min_order"]),
    active: Boolean(r["active"]),
    expires_at: strOrNull(r["expires_at"]),
    used_count: Number(r["used_count"]),
  };
}

/* ---------------- Coupon validation (was the validate_coupon SQL function) ---------------- */

export interface CouponVerdict {
  valid: boolean;
  discount: number;
  message: string;
}

export async function checkCoupon(
  db: D1Database,
  rawCode: string,
  subtotal: number,
): Promise<CouponVerdict> {
  const code = (rawCode ?? "").trim().toUpperCase();
  if (!code) return { valid: false, discount: 0, message: "Enter a code." };

  const row = await db
    .prepare("SELECT * FROM coupons WHERE code = ? AND active = 1 LIMIT 1")
    .bind(code)
    .first<Row>();
  if (!row) return { valid: false, discount: 0, message: "This code isn't valid." };

  const c = mapCoupon(row);
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) {
    return { valid: false, discount: 0, message: "This code has expired." };
  }
  if (!Number.isFinite(subtotal) || subtotal < c.min_order) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum order for this code is ৳${c.min_order.toLocaleString("en-US")}.`,
    };
  }
  const discount =
    c.type === "percent" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
  return { valid: true, discount, message: "Code applied." };
}
