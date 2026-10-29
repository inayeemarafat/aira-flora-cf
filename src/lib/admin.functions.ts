import { createServerFn } from "@tanstack/react-start";
import type { Coupon, Order, OrderItem, Product } from "./types";
import {
  getDb,
  getEnv,
  getImagesBucket,
  mapCoupon,
  mapOrder,
  mapOrderItem,
  mapProduct,
  newId,
  nowIso,
} from "./db";

/* ---------------- Admin access ---------------- */

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

async function assertAdmin(password: unknown): Promise<void> {
  const env = await getEnv();
  const expected = env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string") {
    throw new Error("Unauthorized. Please sign in again.");
  }
  // Hash both sides to equal-length digests, then compare without early exit.
  const [a, b] = await Promise.all([sha256(password), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  if (diff !== 0) {
    throw new Error("Unauthorized. Please sign in again.");
  }
}

const P = (input: { adminPassword: string }) => input;

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator(P)
  .handler(async ({ data }) => {
    await assertAdmin(data.adminPassword);
    return { ok: true };
  });

/* ---------------- Dashboard analytics ---------------- */

export interface AdminOverview {
  revenue: number;
  ordersCount: number;
  visitors: number;
  netProfit: number;
  statusCounts: Record<string, number>;
  monthly: { label: string; revenue: number }[];
  weekly: { label: string; revenue: number }[];
  byCategory: { category: string; revenue: number }[];
  pendingCount: number;
}

export const adminOverview = createServerFn({ method: "POST" })
  .inputValidator(P)
  .handler(async ({ data }): Promise<AdminOverview> => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();

    const [ordersRes, itemsRes, productsRes, visitsRes] = await Promise.all([
      db
        .prepare(
          "SELECT order_id, total_amount, shipping_cost, status, created_at, mobile, customer_name FROM orders",
        )
        .all(),
      db.prepare("SELECT price, quantity, product_id FROM order_items").all(),
      db.prepare("SELECT id, category FROM products").all(),
      db.prepare("SELECT count FROM visits").all(),
    ]);

    type O = Pick<
      Order,
      "order_id" | "total_amount" | "shipping_cost" | "status" | "created_at" | "mobile" | "customer_name"
    >;
    const orders = ordersRes.results.map((r) => ({
      order_id: String(r["order_id"]),
      total_amount: Number(r["total_amount"]),
      shipping_cost: Number(r["shipping_cost"]),
      status: String(r["status"]) as Order["status"],
      created_at: String(r["created_at"]),
      mobile: String(r["mobile"]),
      customer_name: String(r["customer_name"]),
    })) as O[];
    const items = itemsRes.results.map((r) => ({
      price: Number(r["price"]),
      quantity: Number(r["quantity"]),
      product_id: r["product_id"] == null ? null : String(r["product_id"]),
    })) as Pick<OrderItem, "price" | "quantity" | "product_id">[];
    const products = productsRes.results.map((r) => ({
      id: String(r["id"]),
      category: String(r["category"]),
    })) as Pick<Product, "id" | "category">[];

    const valid = orders.filter((o) => o.status !== "cancelled");
    const revenue = valid.reduce((n, o) => n + o.total_amount, 0);
    const netProfit = valid.reduce((n, o) => n + (o.total_amount - o.shipping_cost), 0);
    const visitors = visitsRes.results.reduce((n, v) => n + Number(v["count"] ?? 0), 0);

    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      on_the_way: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;

    const now = new Date();
    const monthly: { label: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("en-US", { month: "short" });
      const rev = valid
        .filter((o) => {
          const od = new Date(o.created_at);
          return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
        })
        .reduce((n, o) => n + o.total_amount, 0);
      monthly.push({ label, revenue: rev });
    }

    const weekly: { label: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const rev = valid
        .filter((o) => {
          const od = new Date(o.created_at);
          return (
            od.getFullYear() === d.getFullYear() &&
            od.getMonth() === d.getMonth() &&
            od.getDate() === d.getDate()
          );
        })
        .reduce((n, o) => n + o.total_amount, 0);
      weekly.push({ label, revenue: rev });
    }

    const catMap = new Map(products.map((p) => [p.id, p.category]));
    const catRevenue = new Map<string, number>();
    for (const it of items) {
      const cat = it.product_id ? catMap.get(it.product_id) : null;
      if (!cat) continue;
      catRevenue.set(cat, (catRevenue.get(cat) ?? 0) + it.price * it.quantity);
    }
    const byCategory = [...catRevenue.entries()]
      .map(([category, r]) => ({ category, revenue: r }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      revenue,
      ordersCount: orders.length,
      visitors,
      netProfit,
      statusCounts,
      monthly,
      weekly,
      byCategory,
      pendingCount: statusCounts["pending"] ?? 0,
    };
  });

/* ---------------- Orders ---------------- */

export interface AdminOrderWithItems extends Order {
  items: OrderItem[];
}

const ORDER_STATUS_VALUES = ["pending", "processing", "on_the_way", "delivered", "cancelled"];

export const adminListOrders = createServerFn({ method: "POST" })
  .inputValidator((input: { adminPassword: string; status?: string | undefined }) => input)
  .handler(async ({ data }): Promise<AdminOrderWithItems[]> => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();
    const status = data.status || null;

    const ordersStmt = status
      ? db.prepare("SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC").bind(status)
      : db.prepare("SELECT * FROM orders ORDER BY created_at DESC");
    const itemsStmt = status
      ? db
          .prepare(
            "SELECT oi.* FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status = ?",
          )
          .bind(status)
      : db.prepare("SELECT * FROM order_items");

    const [ordersRes, itemsRes] = await Promise.all([ordersStmt.all(), itemsStmt.all()]);
    const list = ordersRes.results.map(mapOrder);
    if (!list.length) return [];
    const all = itemsRes.results.map(mapOrderItem);
    return list.map((o) => ({ ...o, items: all.filter((i) => i.order_id === o.id) }));
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { adminPassword: string; id: string; status: string }) => input)
  .handler(async ({ data }) => {
    await assertAdmin(data.adminPassword);
    if (!ORDER_STATUS_VALUES.includes(data.status)) {
      throw new Error("Unknown order status.");
    }
    const db = await getDb();
    await db
      .prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?")
      .bind(data.status, nowIso(), data.id)
      .run();
    return { ok: true };
  });

/* ---------------- Products ---------------- */

export interface AdminProductInput {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  compare_price: number | null;
  stock: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  image: string;
  gallery: string[];
  is_featured: boolean;
  is_flash_sale: boolean;
  flash_sale_price: number | null;
  flash_ends_at: string | null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const adminSaveProduct = createServerFn({ method: "POST" })
  .inputValidator((input: { adminPassword: string; product: AdminProductInput }) => input)
  .handler(async ({ data }) => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();
    const p = data.product;
    const values = {
      name: p.name.trim(),
      slug: (p.slug.trim() || slugify(p.name)).toLowerCase(),
      description: p.description,
      category: p.category,
      price: Math.round(p.price),
      compare_price: p.compare_price ? Math.round(p.compare_price) : null,
      stock: Math.max(0, Math.round(p.stock)),
      sizes: JSON.stringify(p.sizes),
      colors: JSON.stringify(p.colors),
      image: p.image,
      gallery: JSON.stringify(p.gallery.length ? p.gallery : [p.image]),
      is_featured: p.is_featured ? 1 : 0,
      is_flash_sale: p.is_flash_sale ? 1 : 0,
      flash_sale_price:
        p.is_flash_sale && p.flash_sale_price ? Math.round(p.flash_sale_price) : null,
      flash_ends_at: p.is_flash_sale ? p.flash_ends_at : null,
    };

    try {
      if (p.id) {
        await db
          .prepare(
            `UPDATE products SET
               name = ?, slug = ?, description = ?, category = ?, price = ?, compare_price = ?,
               stock = ?, sizes = ?, colors = ?, image = ?, gallery = ?, is_featured = ?,
               is_flash_sale = ?, flash_sale_price = ?, flash_ends_at = ?, updated_at = ?
             WHERE id = ?`,
          )
          .bind(
            values.name,
            values.slug,
            values.description,
            values.category,
            values.price,
            values.compare_price,
            values.stock,
            values.sizes,
            values.colors,
            values.image,
            values.gallery,
            values.is_featured,
            values.is_flash_sale,
            values.flash_sale_price,
            values.flash_ends_at,
            nowIso(),
            p.id,
          )
          .run();
        return { ok: true };
      }
      const stamp = nowIso();
      await db
        .prepare(
          `INSERT INTO products
             (id, name, slug, description, category, price, compare_price, stock, sizes, colors,
              image, gallery, is_featured, is_flash_sale, flash_sale_price, flash_ends_at,
              created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          newId(),
          values.name,
          values.slug,
          values.description,
          values.category,
          values.price,
          values.compare_price,
          values.stock,
          values.sizes,
          values.colors,
          values.image,
          values.gallery,
          values.is_featured,
          values.is_flash_sale,
          values.flash_sale_price,
          values.flash_ends_at,
          stamp,
          stamp,
        )
        .run();
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/UNIQUE constraint failed: products\.slug/i.test(message)) {
        throw new Error("Another product already uses that slug.");
      }
      throw err;
    }
  });

export const adminProductsList = createServerFn({ method: "POST" })
  .inputValidator(P)
  .handler(async ({ data }): Promise<Product[]> => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();
    const { results } = await db
      .prepare("SELECT * FROM products ORDER BY created_at ASC, rowid ASC")
      .all();
    return results.map(mapProduct);
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input: { adminPassword: string; id: string }) => input)
  .handler(async ({ data }) => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();
    await db.prepare("DELETE FROM products WHERE id = ?").bind(data.id).run();
    return { ok: true };
  });

/* ---------------- Categories ---------------- */

export interface AdminCategory {
  id: string;
  name: string;
  productCount: number;
}

export const adminListCategories = createServerFn({ method: "POST" })
  .inputValidator(P)
  .handler(async ({ data }): Promise<AdminCategory[]> => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();
    const { results } = await db
      .prepare(
        `SELECT c.id, c.name,
                (SELECT COUNT(*) FROM products p WHERE p.category = c.name) AS product_count
         FROM categories c
         ORDER BY c.sort_order ASC, c.name ASC`,
      )
      .all();
    return results.map((r) => ({
      id: String(r["id"]),
      name: String(r["name"]),
      productCount: Number(r["product_count"]),
    }));
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .inputValidator((input: { adminPassword: string; id?: string | undefined; name: string }) => input)
  .handler(async ({ data }) => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();
    const name = data.name.trim().replace(/\s+/g, " ");
    if (!name) throw new Error("Enter a category name.");
    if (name.length > 40) throw new Error("Category names can be at most 40 characters.");

    const clash = await db
      .prepare("SELECT id FROM categories WHERE lower(name) = lower(?) AND id != ? LIMIT 1")
      .bind(name, data.id ?? "")
      .first();
    if (clash) throw new Error("That category already exists.");

    if (data.id) {
      const current = await db
        .prepare("SELECT name FROM categories WHERE id = ?")
        .bind(data.id)
        .first<Record<string, unknown>>();
      if (!current) throw new Error("Category not found.");
      const oldName = String(current["name"]);
      await db.batch([
        db.prepare("UPDATE categories SET name = ? WHERE id = ?").bind(name, data.id),
        // Products reference the category by name, so keep them in sync.
        db
          .prepare("UPDATE products SET category = ?, updated_at = ? WHERE category = ?")
          .bind(name, nowIso(), oldName),
      ]);
      return { ok: true };
    }

    const maxRow = await db
      .prepare("SELECT COALESCE(MAX(sort_order), 0) AS m FROM categories")
      .first<Record<string, unknown>>();
    await db
      .prepare("INSERT INTO categories (id, name, sort_order, created_at) VALUES (?, ?, ?, ?)")
      .bind(newId(), name, Number(maxRow?.["m"] ?? 0) + 1, nowIso())
      .run();
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .inputValidator((input: { adminPassword: string; id: string }) => input)
  .handler(async ({ data }) => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();
    const current = await db
      .prepare("SELECT name FROM categories WHERE id = ?")
      .bind(data.id)
      .first<Record<string, unknown>>();
    if (!current) return { ok: true };
    const countRow = await db
      .prepare("SELECT COUNT(*) AS n FROM products WHERE category = ?")
      .bind(String(current["name"]))
      .first<Record<string, unknown>>();
    const n = Number(countRow?.["n"] ?? 0);
    if (n > 0) {
      throw new Error(
        `${n} product${n === 1 ? " is" : "s are"} still in this category. Move or delete them first.`,
      );
    }
    await db.prepare("DELETE FROM categories WHERE id = ?").bind(data.id).run();
    return { ok: true };
  });

/* ---------------- Customers ---------------- */

export interface AdminCustomer {
  mobile: string;
  name: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export const adminListCustomers = createServerFn({ method: "POST" })
  .inputValidator(P)
  .handler(async ({ data }): Promise<AdminCustomer[]> => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();
    const { results } = await db
      .prepare(
        "SELECT mobile, customer_name, total_amount, status, created_at FROM orders ORDER BY created_at DESC",
      )
      .all();
    const list = results.map((r) => ({
      mobile: String(r["mobile"]),
      customer_name: String(r["customer_name"]),
      total_amount: Number(r["total_amount"]),
      status: String(r["status"]),
      created_at: String(r["created_at"]),
    }));
    const map = new Map<string, AdminCustomer>();
    for (const o of list) {
      const existing = map.get(o.mobile);
      const isActive = o.status !== "cancelled";
      if (existing) {
        if (isActive) {
          existing.ordersCount += 1;
          existing.totalSpent += o.total_amount;
        }
      } else {
        map.set(o.mobile, {
          mobile: o.mobile,
          name: o.customer_name,
          ordersCount: isActive ? 1 : 0,
          totalSpent: isActive ? o.total_amount : 0,
          lastOrderAt: o.created_at,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.totalSpent - a.totalSpent);
  });

/* ---------------- Coupons ---------------- */

export const adminListCoupons = createServerFn({ method: "POST" })
  .inputValidator(P)
  .handler(async ({ data }): Promise<Coupon[]> => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM coupons ORDER BY created_at DESC").all();
    return results.map(mapCoupon);
  });

export const adminSaveCoupon = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      adminPassword: string;
      coupon: {
        id?: string;
        code: string;
        type: "percent" | "fixed";
        value: number;
        min_order: number;
        active: boolean;
        expires_at: string | null;
      };
    }) => input,
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();
    const c = data.coupon;
    await db
      .prepare(
        `INSERT INTO coupons (id, code, type, value, min_order, active, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(code) DO UPDATE SET
           type = excluded.type,
           value = excluded.value,
           min_order = excluded.min_order,
           active = excluded.active,
           expires_at = excluded.expires_at`,
      )
      .bind(
        newId(),
        c.code.trim().toUpperCase(),
        c.type,
        Math.round(c.value),
        Math.max(0, Math.round(c.min_order)),
        c.active ? 1 : 0,
        c.expires_at || null,
        nowIso(),
      )
      .run();
    return { ok: true };
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .inputValidator((input: { adminPassword: string; id: string }) => input)
  .handler(async ({ data }) => {
    await assertAdmin(data.adminPassword);
    const db = await getDb();
    await db.prepare("DELETE FROM coupons WHERE id = ?").bind(data.id).run();
    return { ok: true };
  });

/* ---------------- Image uploads (Cloudflare R2) ---------------- */

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const adminUploadImage = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      adminPassword: string;
      fileName: string;
      contentType: string;
      dataBase64: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminPassword);
    const ext = IMAGE_EXTENSIONS[data.contentType];
    if (!ext) {
      throw new Error("Unsupported image type. Use JPG, PNG, WebP, GIF or AVIF.");
    }
    const bytes = base64ToBytes(data.dataBase64);
    if (!bytes.length) throw new Error("The selected file is empty.");
    if (bytes.length > MAX_IMAGE_BYTES) {
      throw new Error("That image is too large. The maximum size is 10 MB.");
    }
    // Random server-side name — never trust the client's filename.
    const path = `${crypto.randomUUID()}.${ext}`;
    const bucket = await getImagesBucket();
    await bucket.put(path, bytes, {
      httpMetadata: { contentType: data.contentType, cacheControl: "public, max-age=31536000, immutable" },
    });
    return { path, url: `/api/public/product-images/${path}` };
  });
