import { createServerFn } from "@tanstack/react-start";
import type { Coupon, Order, OrderItem, Product, ProductReview } from "./types";
import { createPublicSupabase, getAdmin } from "./supabase-public";
import { shippingCost } from "./shop-constants";

/* ---------------- Public catalogue reads ---------------- */

export const listProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Product[];
  },
);

export const listLatestReviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductReview[]> => {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ProductReview[];
  },
);

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }): Promise<{
    product: Product;
    reviews: ProductReview[];
    related: Product[];
  } | null> => {
    const supabase = createPublicSupabase();
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;

    const [reviewsRes, relatedRes] = await Promise.all([
      supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", (product as unknown as Product).id)
        .order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select("*")
        .eq("category", (product as unknown as Product).category)
        .neq("id", (product as unknown as Product).id)
        .limit(4),
    ]);

    return {
      product: product as unknown as Product,
      reviews: (reviewsRes.data ?? []) as unknown as ProductReview[],
      related: (relatedRes.data ?? []) as unknown as Product[],
    };
  });

/* ---------------- Orders ---------------- */

export interface CheckoutItemInput {
  productId: string;
  size: string;
  color?: string | null;
  quantity: number;
}

export interface CheckoutInput {
  name: string;
  mobile: string;
  email?: string;
  address: string;
  area: string;
  remarks?: string;
  couponCode?: string;
  items: CheckoutItemInput[];
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: CheckoutInput) => input)
  .handler(async ({ data }) => {
    const supabase = createPublicSupabase();
    const admin = await getAdmin();

    if (!data.items.length) throw new Error("Your cart is empty.");
    if (!data.name?.trim() || !data.mobile?.trim() || !data.address?.trim()) {
      throw new Error("Please fill in all required fields.");
    }
    if (!/^01[3-9]\d{8}$/.test(data.mobile.replace(/[\s-]/g, ""))) {
      throw new Error("Please enter a valid Bangladeshi mobile number.");
    }

    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, stock, image, is_flash_sale, flash_sale_price, flash_ends_at, sizes")
      .in("id", ids);
    if (prodErr) throw new Error(prodErr.message);
    const byId = new Map((products ?? []).map((p) => [p.id, p]));
    const now = Date.now();

    const lines: {
      product_id: string;
      product_name: string;
      image: string | null;
      size: string;
      color: string | null;
      quantity: number;
      price: number;
      stock: number;
    }[] = [];

    for (const item of data.items) {
      const p = byId.get(item.productId);
      if (!p) throw new Error("One of the products is no longer available.");
      const flashActive =
        p.is_flash_sale &&
        p.flash_sale_price != null &&
        p.flash_ends_at != null &&
        new Date(p.flash_ends_at).getTime() > now;
      const unitPrice = flashActive ? p.flash_sale_price! : p.price;
      const qty = Math.max(1, Math.floor(item.quantity));
      if (qty > p.stock) {
        throw new Error(`Only ${p.stock} left in stock for ${p.name}.`);
      }
      lines.push({
        product_id: p.id,
        product_name: p.name,
        image: p.image,
        size: item.size,
        color: item.color ?? null,
        quantity: qty,
        price: unitPrice,
        stock: p.stock,
      });
    }

    const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
    const ship = subtotal >= 2000 ? 0 : shippingCost(data.area);

    let discount = 0;
    let couponCode: string | null = null;
    if (data.couponCode) {
      const code = data.couponCode.trim().toUpperCase();
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("active", true)
        .maybeSingle();
      const c = coupon as Coupon | null;
      if (
        c &&
        subtotal >= c.min_order &&
        (!c.expires_at || new Date(c.expires_at).getTime() > now)
      ) {
        discount =
          c.type === "percent"
            ? Math.round((subtotal * c.value) / 100)
            : Math.min(c.value, subtotal);
        couponCode = c.code;
      }
    }

    const total = subtotal - discount + ship;
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const orderCode = `AF-${suffix}`;

    const mobile = data.mobile.replace(/[\s-]/g, "");
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        order_id: orderCode,
        customer_name: data.name.trim(),
        address: data.address.trim(),
        shipping_area: data.area,
        mobile,
        email: data.email?.trim() || null,
        remarks: data.remarks?.trim() || null,
        total_amount: total,
        subtotal,
        shipping_cost: ship,
        discount_amount: discount,
        coupon_code: couponCode,
        payment_method: "cod",
      })
      .select("id, order_id")
      .single();
    if (orderErr) throw new Error(orderErr.message);

    const { error: itemsErr } = await admin.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.product_id,
        product_name: l.product_name,
        image: l.image,
        size: l.size,
        color: l.color,
        quantity: l.quantity,
        price: l.price,
      })),
    );
    if (itemsErr) throw new Error(itemsErr.message);

    // Decrement stock
    for (const l of lines) {
      await admin
        .from("products")
        .update({ stock: l.stock - l.quantity })
        .eq("id", l.product_id);
    }

    if (couponCode) {
      const res = await admin.rpc("increment_coupon_usage", { _code: couponCode });
      if (res.error) throw new Error(res.error.message);
    }

    return { orderId: order.order_id, total, mobile };
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string; mobile: string }) => input)
  .handler(async ({ data }): Promise<{ order: Order; items: OrderItem[] } | null> => {
    const admin = await getAdmin();
    const orderId = data.orderId.trim().toUpperCase();
    const mobile = data.mobile.replace(/[\s-]/g, "");
    if (!orderId || !mobile) return null;

    const { data: order, error } = await admin
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .eq("mobile", mobile)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;

    const { data: items, error: itemsErr } = await admin
      .from("order_items")
      .select("*")
      .eq("order_id", (order as Order).id);
    if (itemsErr) throw new Error(itemsErr.message);

    return { order: order as Order, items: (items ?? []) as OrderItem[] };
  });

/* ---------------- Coupons, newsletter, visits ---------------- */

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; subtotal: number }) => input)
  .handler(async ({ data }): Promise<{ valid: boolean; discount: number; message: string }> => {
    const supabase = createPublicSupabase();
    const code = data.code.trim().toUpperCase();
    if (!code) return { valid: false, discount: 0, message: "Enter a code." };
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const c = coupon as Coupon | null;
    if (!c) return { valid: false, discount: 0, message: "This code isn't valid." };
    if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) {
      return { valid: false, discount: 0, message: "This code has expired." };
    }
    if (data.subtotal < c.min_order) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum order for this code is ৳${c.min_order.toLocaleString()}.`,
      };
    }
    const discount =
      c.type === "percent"
        ? Math.round((data.subtotal * c.value) / 100)
        : Math.min(c.value, data.subtotal);
    return { valid: true, discount, message: "Code applied." };
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    const admin = await getAdmin();
    const { error } = await admin
      .from("newsletter_subscribers")
      .upsert({ email }, { onConflict: "email" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const trackVisit = createServerFn({ method: "POST" }).handler(async () => {
  const admin = await getAdmin();
  const { error } = await admin.rpc("increment_visits");
  if (error) throw new Error(error.message);
  return { ok: true };
});
