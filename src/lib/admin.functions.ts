import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Coupon, Order, OrderItem, Product } from "./types";
import { createPublicSupabase, getAdmin } from "./supabase-public";

/* ---------------- Admin access ---------------- */

function assertAdmin(password: unknown): void {
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected || typeof password !== "string") {
    throw new Error("Unauthorized. Please sign in again.");
  }
  // Hash both sides to equal-length digests before timingSafeEqual.
  const a = createHash("sha256").update(password, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  if (!timingSafeEqual(a, b)) {
    throw new Error("Unauthorized. Please sign in again.");
  }
}

const P = (input: { adminPassword: string }) => input;

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator(P)
  .handler(async ({ data }) => {
    assertAdmin(data.adminPassword);
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
    assertAdmin(data.adminPassword);
    const admin = await getAdmin();

    const [ordersRes, itemsRes, productsRes, visitsRes] = await Promise.all([
      admin.from("orders").select("order_id,total_amount,shipping_cost,status,created_at,mobile,customer_name"),
      admin.from("order_items").select("price,quantity,product_id"),
      createPublicSupabase().from("products").select("id,category"),
      admin.from("visits").select("count"),
    ]);
    if (ordersRes.error) throw new Error(ordersRes.error.message);

    type O = Pick<Order, "order_id" | "total_amount" | "shipping_cost" | "status" | "created_at" | "mobile" | "customer_name">;
    const orders = (ordersRes.data ?? []) as O[];
    const items = (itemsRes.data ?? []) as Pick<OrderItem, "price" | "quantity" | "product_id">[];
    const products = (productsRes.data ?? []) as Pick<Product, "id" | "category">[];

    const valid = orders.filter((o) => o.status !== "cancelled");
    const revenue = valid.reduce((n, o) => n + o.total_amount, 0);
    const netProfit = valid.reduce((n, o) => n + (o.total_amount - o.shipping_cost), 0);
    const visitors = (visitsRes.data ?? []).reduce((n, v) => n + (v.count ?? 0), 0);

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

export const adminListOrders = createServerFn({ method: "POST" })
  .inputValidator((input: { adminPassword: string; status?: string }) => input)
  .handler(async ({ data }): Promise<AdminOrderWithItems[]> => {
    assertAdmin(data.adminPassword);
    const admin = await getAdmin();
    let q = admin.from("orders").select("*").order("created_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);
    const list = (orders ?? []) as Order[];
    if (!list.length) return [];
    const { data: items, error: itemsErr } = await admin
      .from("order_items")
      .select("*")
      .in("order_id", list.map((o) => o.id));
    if (itemsErr) throw new Error(itemsErr.message);
    const all = (items ?? []) as OrderItem[];
    return list.map((o) => ({ ...o, items: all.filter((i) => i.order_id === o.id) }));
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { adminPassword: string; id: string; status: string }) => input)
  .handler(async ({ data }) => {
    assertAdmin(data.adminPassword);
    const admin = await getAdmin();
    const { error } = await admin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
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
    assertAdmin(data.adminPassword);
    const admin = await getAdmin();
    const p = data.product;
    const values = {
      name: p.name.trim(),
      slug: (p.slug.trim() || slugify(p.name)).toLowerCase(),
      description: p.description,
      category: p.category,
      price: Math.round(p.price),
      compare_price: p.compare_price ? Math.round(p.compare_price) : null,
      stock: Math.max(0, Math.round(p.stock)),
      sizes: p.sizes,
      colors: p.colors,
      image: p.image,
      gallery: p.gallery.length ? p.gallery : [p.image],
      is_featured: p.is_featured,
      is_flash_sale: p.is_flash_sale,
      flash_sale_price: p.is_flash_sale && p.flash_sale_price ? Math.round(p.flash_sale_price) : null,
      flash_ends_at: p.is_flash_sale ? p.flash_ends_at : null,
    };
    if (p.id) {
      const { error } = await admin.from("products").update(values).eq("id", p.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await admin.from("products").insert(values);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminProductsList = createServerFn({ method: "POST" })
  .inputValidator(P)
  .handler(async ({ data }): Promise<Product[]> => {
    assertAdmin(data.adminPassword);
    const admin = await getAdmin();
    const { data: products, error } = await admin
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (products ?? []) as unknown as Product[];
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input: { adminPassword: string; id: string }) => input)
  .handler(async ({ data }) => {
    assertAdmin(data.adminPassword);
    const admin = await getAdmin();
    const { error } = await admin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
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
    assertAdmin(data.adminPassword);
    const admin = await getAdmin();
    const { data: orders, error } = await admin
      .from("orders")
      .select("mobile, customer_name, total_amount, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const list = (orders ?? []) as Pick<Order, "mobile" | "customer_name" | "total_amount" | "status" | "created_at">[];
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
    assertAdmin(data.adminPassword);
    const admin = await getAdmin();
    const { data: coupons, error } = await admin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (coupons ?? []) as Coupon[];
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
    assertAdmin(data.adminPassword);
    const admin = await getAdmin();
    const c = data.coupon;
    const values = {
      code: c.code.trim().toUpperCase(),
      type: c.type,
      value: Math.round(c.value),
      min_order: Math.max(0, Math.round(c.min_order)),
      active: c.active,
      expires_at: c.expires_at || null,
    };
    const { error } = await admin
      .from("coupons")
      .upsert(values, { onConflict: "code" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .inputValidator((input: { adminPassword: string; id: string }) => input)
  .handler(async ({ data }) => {
    assertAdmin(data.adminPassword);
    const admin = await getAdmin();
    const { error } = await admin.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
