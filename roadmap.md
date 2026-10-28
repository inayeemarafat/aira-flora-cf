# Aira Flora — remaining work

## Done
- Schema migration + RPC functions (products, orders, order_items, coupons, product_reviews, newsletter, visits)
- Seeded catalog: 8 products, 2 coupons, 5 demo orders, 6 reviews, 45 visits
- Server layer: shop.functions.ts, admin.functions.ts, types, constants, public/admin Supabase clients
- Design system in src/styles.css (Cormorant Garamond + Jost, black/rose/cream palette)
- ADMIN_PASSWORD secret saved
- Site layout: __root head/fonts, _site layout (announcement, header, footer, cart drawer, CartProvider)
- Store components: header, footer, cart drawer, hero slider, product card, flash countdown
- Pages: home (_site.index), shop, product detail, checkout, track order — rebuilt after route files were lost in a rollback (index.tsx vs _site.tsx "/" conflict fixed by moving home under _site)
- Admin: login gate, dashboard charts, orders, products, coupons, customers — rebuilt after same rollback
- Free shipping over ৳2,000 via shared orderShipping() helper (server + checkout + tested)
- Build OK, vitest 4/4 passing, browser-verified: browse → add to bag → COD order placed (AF-QQLPSU) → tracked, and all five admin pages render with live data
