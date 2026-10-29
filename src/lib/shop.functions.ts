import { createServerFn } from "@tanstack/react-start";
import type { Order, OrderItem, Product, ProductReview } from "./types";
import {
  checkCoupon,
  getDb,
  mapOrder,
  mapOrderItem,
  mapProduct,
  mapReview,
  newId,
  nowIso,
} from "./db";
import { orderShipping } from "./shop-constants";

/* ---------------- Public catalogue reads ---------------- */

export const listProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    const db = await getDb();
    const { results } = await db
      .prepare("SELECT * FROM products ORDER BY created_at ASC, rowid ASC")
      .all();
    return results.map(mapProduct);
  },
);

export const listLatestReviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductReview[]> => {
    const db = await getDb();
    const { results } = await db
      .prepare("SELECT * FROM product_reviews ORDER BY created_at DESC LIMIT 6")
      .all();
    return results.map(mapReview);
  },
);

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }): Promise<{
    product: Product;
    reviews: ProductReview[];
    related: Product[];
  } | null> => {
    const db = await getDb();
    const row = await db
      .prepare("SELECT * FROM products WHERE slug = ? LIMIT 1")
      .bind(data.slug)
      .first();
    if (!row) return null;
    const product = mapProduct(row);

    const [reviewsRes, relatedRes] = await Promise.all([
      db
        .prepare("SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC")
        .bind(product.id)
        .all(),
      db
        .prepare("SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4")
        .bind(product.category, product.id)
        .all(),
    ]);

    return {
      product,
      reviews: reviewsRes.results.map(mapReview),
      related: relatedRes.results.map(mapProduct),
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
  email?: string | undefined;
  address: string;
  area: string;
  remarks?: string | undefined;
  couponCode?: string | undefined;
  items: CheckoutItemInput[];
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: CheckoutInput) => input)
  .handler(async ({ data }) => {
    const db = await getDb();

    if (!data.items.length) throw new Error("Your cart is empty.");
    if (!data.name?.trim() || !data.mobile?.trim() || !data.address?.trim()) {
      throw new Error("Please fill in all required fields.");
    }
    if (!/^01[3-9]\d{8}$/.test(data.mobile.replace(/[\s-]/g, ""))) {
      throw new Error("Please enter a valid Bangladeshi mobile number.");
    }

    const ids = [...new Set(data.items.map((i) => i.productId))];
    const placeholders = ids.map(() => "?").join(",");
    const { results: productRows } = await db
      .prepare(
        `SELECT id, name, price, stock, image, is_flash_sale, flash_sale_price, flash_ends_at
         FROM products WHERE id IN (${placeholders})`,
      )
      .bind(...ids)
      .all<Record<string, unknown>>();
    const byId = new Map(productRows.map((p) => [String(p["id"]), p]));
    const now = Date.now();

    const lines: {
      product_id: string;
      product_name: string;
      image: string | null;
      size: string;
      color: string | null;
      quantity: number;
      price: number;
    }[] = [];

    // Total requested per product, so one product split over several sizes can't exceed stock.
    const requested = new Map<string, number>();

    for (const item of data.items) {
      const p = byId.get(item.productId);
      if (!p) throw new Error("One of the products is no longer available.");
      const name = String(p["name"]);
      const stock = Number(p["stock"]);
      const flashPrice = p["flash_sale_price"] == null ? null : Number(p["flash_sale_price"]);
      const flashEnds = p["flash_ends_at"] == null ? null : String(p["flash_ends_at"]);
      const flashActive =
        Boolean(p["is_flash_sale"]) &&
        flashPrice != null &&
        flashEnds != null &&
        new Date(flashEnds).getTime() > now;
      const unitPrice = flashActive ? flashPrice! : Number(p["price"]);
      const qty = Math.max(1, Math.floor(item.quantity));
      const total = (requested.get(item.productId) ?? 0) + qty;
      if (total > stock) {
        throw new Error(`Only ${stock} left in stock for ${name}.`);
      }
      requested.set(item.productId, total);
      lines.push({
        product_id: item.productId,
        product_name: name,
        image: p["image"] == null ? null : String(p["image"]),
        size: item.size,
        color: item.color ?? null,
        quantity: qty,
        price: unitPrice,
      });
    }

    const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
    const ship = orderShipping(subtotal, data.area);

    let discount = 0;
    let couponCode: string | null = null;
    if (data.couponCode) {
      const code = data.couponCode.trim().toUpperCase();
      const verdict = await checkCoupon(db, code, subtotal);
      if (verdict.valid) {
        discount = verdict.discount;
        couponCode = code;
      }
    }

    const total = subtotal - discount + ship;
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const random = crypto.getRandomValues(new Uint8Array(6));
    let suffix = "";
    for (const b of random) suffix += alphabet[b % alphabet.length];
    const orderCode = `AF-${suffix}`;

    const mobile = data.mobile.replace(/[\s-]/g, "");
    const orderUuid = newId();
    const stamp = nowIso();

    const statements = [
      db
        .prepare(
          `INSERT INTO orders
            (id, order_id, customer_name, address, shipping_area, mobile, email, remarks,
             total_amount, subtotal, shipping_cost, discount_amount, coupon_code,
             payment_method, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cod', ?, ?)`,
        )
        .bind(
          orderUuid,
          orderCode,
          data.name.trim(),
          data.address.trim(),
          data.area,
          mobile,
          data.email?.trim() || null,
          data.remarks?.trim() || null,
          total,
          subtotal,
          ship,
          discount,
          couponCode,
          stamp,
          stamp,
        ),
      ...lines.map((l) =>
        db
          .prepare(
            `INSERT INTO order_items
              (id, order_id, product_id, product_name, image, size, color, quantity, price)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            orderUuid,
            l.product_id,
            l.product_name,
            l.image,
            l.size,
            l.color,
            l.quantity,
            l.price,
          ),
      ),
      // products.stock has CHECK (stock >= 0): if anyone bought the last items in the
      // meantime this fails and the whole batch (order included) rolls back.
      ...[...requested.entries()].map(([productId, qty]) =>
        db
          .prepare("UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?")
          .bind(qty, stamp, productId),
      ),
    ];
    if (couponCode) {
      statements.push(
        db
          .prepare("UPDATE coupons SET used_count = used_count + 1 WHERE code = ?")
          .bind(couponCode),
      );
    }

    try {
      await db.batch(statements);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/CHECK constraint failed/i.test(message)) {
        throw new Error("Some items just sold out. Please review your bag and try again.");
      }
      throw err;
    }

    return { orderId: orderCode, total, mobile };
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string; mobile: string }) => input)
  .handler(async ({ data }): Promise<{ order: Order; items: OrderItem[] } | null> => {
    const db = await getDb();
    const orderId = data.orderId.trim().toUpperCase();
    const mobile = data.mobile.replace(/[\s-]/g, "");
    if (!orderId || !mobile) return null;

    const row = await db
      .prepare("SELECT * FROM orders WHERE order_id = ? AND mobile = ? LIMIT 1")
      .bind(orderId, mobile)
      .first();
    if (!row) return null;
    const order = mapOrder(row);

    const { results } = await db
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .bind(order.id)
      .all();

    return { order, items: results.map(mapOrderItem) };
  });

/* ---------------- Coupons, newsletter, visits ---------------- */

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; subtotal: number }) => input)
  .handler(async ({ data }): Promise<{ valid: boolean; discount: number; message: string }> => {
    const db = await getDb();
    return checkCoupon(db, data.code, data.subtotal);
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    const db = await getDb();
    await db
      .prepare(
        "INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING",
      )
      .bind(newId(), email, nowIso())
      .run();
    return { ok: true };
  });

export const trackVisit = createServerFn({ method: "POST" }).handler(async () => {
  const db = await getDb();
  await db
    .prepare(
      "INSERT INTO visits (day, count) VALUES (date('now'), 1) ON CONFLICT(day) DO UPDATE SET count = count + 1",
    )
    .run();
  return { ok: true };
});
