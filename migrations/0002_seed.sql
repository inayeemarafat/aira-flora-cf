-- Starter catalogue for Aira Flora (matches the product photos in public/images/products).
-- Safe to re-run: every row uses INSERT OR IGNORE.

INSERT OR IGNORE INTO products
  (id, name, slug, description, category, price, compare_price, stock, sizes, colors, image, gallery, is_featured, is_flash_sale, flash_sale_price, flash_ends_at, rating, reviews_count, created_at, updated_at)
VALUES
  ('prd-satin-wrap-dress', 'Satin Wrap Dress', 'satin-wrap-dress',
   'A fluid satin wrap dress with a flattering tie waist and a soft, floor-skimming drape. Made for evenings that deserve a little shine.',
   'Dresses', 4800, 5800, 14, '["S","M","L","XL"]',
   '[{"name":"Rose","hex":"#d99aa8"},{"name":"Black","hex":"#111111"}]',
   '/images/products/satin-wrap-dress.jpg', '["/images/products/satin-wrap-dress.jpg"]',
   1, 1, 3900, '2026-12-31T18:00:00.000Z', 4.9, 2, '2026-10-01T10:00:00.000Z', '2026-10-01T10:00:00.000Z'),

  ('prd-silk-slip-dress', 'Silk Slip Dress', 'silk-slip-dress',
   'Bias-cut slip dress in a silky finish with adjustable straps. Dress it up with heels or down with a knit.',
   'Dresses', 5200, NULL, 10, '["S","M","L"]',
   '[{"name":"Champagne","hex":"#e8d5b7"},{"name":"Rose","hex":"#d99aa8"}]',
   '/images/products/silk-slip-dress.jpg', '["/images/products/silk-slip-dress.jpg"]',
   1, 0, NULL, NULL, 4.8, 1, '2026-10-01T10:01:00.000Z', '2026-10-01T10:01:00.000Z'),

  ('prd-knit-cardigan', 'Cloud Knit Cardigan', 'knit-cardigan',
   'A soft, relaxed cardigan in a cosy rib knit with pearl-finish buttons. Layer it over everything.',
   'Knitwear', 3600, 4200, 18, '["S","M","L","XL","XXL"]',
   '[{"name":"Cream","hex":"#f3ead9"},{"name":"Blush","hex":"#f0c9cf"}]',
   '/images/products/knit-cardigan.jpg', '["/images/products/knit-cardigan.jpg"]',
   1, 0, NULL, NULL, 4.7, 1, '2026-10-01T10:02:00.000Z', '2026-10-01T10:02:00.000Z'),

  ('prd-linen-blazer', 'Linen Blazer', 'linen-blazer',
   'A tailored yet easy blazer in breathable linen with a relaxed shoulder and single-button closure.',
   'Outerwear', 6400, 7200, 8, '["S","M","L","XL"]',
   '[{"name":"Sand","hex":"#d8c7a8"},{"name":"Black","hex":"#111111"}]',
   '/images/products/linen-blazer.jpg', '["/images/products/linen-blazer.jpg"]',
   1, 0, NULL, NULL, 4.9, 1, '2026-10-01T10:03:00.000Z', '2026-10-01T10:03:00.000Z'),

  ('prd-denim-jacket', 'Cropped Denim Jacket', 'denim-jacket',
   'A cropped, washed denim jacket with a boxy fit and soft broken-in feel. A true wardrobe staple.',
   'Outerwear', 4500, NULL, 12, '["S","M","L","XL"]',
   '[{"name":"Indigo","hex":"#3b4f73"}]',
   '/images/products/denim-jacket.jpg', '["/images/products/denim-jacket.jpg"]',
   0, 1, 3600, '2026-12-31T18:00:00.000Z', 4.6, 0, '2026-10-01T10:04:00.000Z', '2026-10-01T10:04:00.000Z'),

  ('prd-ribbed-top', 'Ribbed Fitted Top', 'ribbed-top',
   'A stretchy ribbed top with a scooped neckline. Soft against the skin and easy to style.',
   'Tops', 1800, 2200, 30, '["XS","S","M","L","XL"]',
   '[{"name":"White","hex":"#ffffff"},{"name":"Black","hex":"#111111"},{"name":"Blush","hex":"#f0c9cf"}]',
   '/images/products/ribbed-top.jpg', '["/images/products/ribbed-top.jpg"]',
   0, 0, NULL, NULL, 4.7, 1, '2026-10-01T10:05:00.000Z', '2026-10-01T10:05:00.000Z'),

  ('prd-pleated-skirt', 'Pleated Midi Skirt', 'pleated-skirt',
   'A flowing pleated midi skirt with an elasticated waist that moves beautifully with every step.',
   'Bottoms', 3200, NULL, 16, '["S","M","L","XL"]',
   '[{"name":"Rose","hex":"#d99aa8"},{"name":"Ivory","hex":"#f6f1e7"}]',
   '/images/products/pleated-skirt.jpg', '["/images/products/pleated-skirt.jpg"]',
   1, 0, NULL, NULL, 4.8, 0, '2026-10-01T10:06:00.000Z', '2026-10-01T10:06:00.000Z'),

  ('prd-wide-leg-trousers', 'Wide-Leg Trousers', 'wide-leg-trousers',
   'High-waisted wide-leg trousers with a clean front pleat and a fluid, tailored drape.',
   'Bottoms', 3900, 4500, 20, '["S","M","L","XL","XXL"]',
   '[{"name":"Black","hex":"#111111"},{"name":"Stone","hex":"#cfc7b8"}]',
   '/images/products/wide-leg-trousers.jpg', '["/images/products/wide-leg-trousers.jpg"]',
   0, 0, NULL, NULL, 4.8, 0, '2026-10-01T10:07:00.000Z', '2026-10-01T10:07:00.000Z');

INSERT OR IGNORE INTO coupons (id, code, type, value, min_order, active, expires_at, used_count, created_at)
VALUES
  ('cpn-welcome10', 'WELCOME10', 'percent', 10, 1000, 1, NULL, 0, '2026-10-01T10:00:00.000Z'),
  ('cpn-flat200', 'FLAT200', 'fixed', 200, 2500, 1, NULL, 0, '2026-10-01T10:00:00.000Z');

INSERT OR IGNORE INTO product_reviews (id, product_id, author, rating, comment, created_at)
VALUES
  ('rev-1', 'prd-satin-wrap-dress', 'Nusrat J.', 5, 'The drape is gorgeous and it fits true to size. Got so many compliments at a wedding.', '2026-10-05T09:00:00.000Z'),
  ('rev-2', 'prd-satin-wrap-dress', 'Tasnim A.', 5, 'Beautiful colour and very comfortable. Delivery inside Dhaka was quick.', '2026-10-08T09:00:00.000Z'),
  ('rev-3', 'prd-silk-slip-dress', 'Farhana R.', 5, 'Feels luxurious for the price. Will order again.', '2026-10-10T09:00:00.000Z'),
  ('rev-4', 'prd-knit-cardigan', 'Mim S.', 5, 'So soft and cosy. Perfect for the cooler evenings.', '2026-10-12T09:00:00.000Z'),
  ('rev-5', 'prd-linen-blazer', 'Sadia K.', 5, 'Sharp tailoring and breathable. Looks great with jeans or trousers.', '2026-10-15T09:00:00.000Z'),
  ('rev-6', 'prd-ribbed-top', 'Ishrat N.', 5, 'Great fit and the fabric is thick enough. Bought it in two colours.', '2026-10-18T09:00:00.000Z');

INSERT INTO categories (name, sort_order)
SELECT v.name, v.sort_order
FROM (
  SELECT 'Dresses' AS name, 1 AS sort_order UNION ALL
  SELECT 'Knitwear', 2 UNION ALL
  SELECT 'Outerwear', 3 UNION ALL
  SELECT 'Tops', 4 UNION ALL
  SELECT 'Bottoms', 5
) AS v
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = v.name);
