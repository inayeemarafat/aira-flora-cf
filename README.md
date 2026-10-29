# Aira Flora Fashion Flow

Act as an expert Full-Stack Developer and UI/UX Designer. Build a complete, production-ready, premium e-commerce clothing store web application named "Aira Flora" along with a fully-featured Admin Dashboard using Laravel (Backend) and Tailwind CSS / Blade / Alpine.js (Frontend).

The design must look extremely premium, modern, and high-end (similar to luxury fashion brands with smooth glassmorphism effects, elegant typography, clean whitespace, and responsive mobile-first layouts).

### 1. FRONTEND & CUSTOMER FEATURES (Aira Flora):
- **Homepage:**
  - Hero Section with promotional banner slider, high-end typography, and animated Call-to-Action (CTA) buttons.
  - Category Showcase & Featured Products grid with hover zoom effects.
  - Flash Sale countdown timer and "Stay in the Loop" newsletter subscription footer.
  - Mobile Bottom Navigation Bar (Home, Shop, Flash Sale, Track Order, Account) for app-like mobile experience.
- **Shop & Filtering:**
  - Advanced sidebar filters for Sizes (S, M, L, XL, XXL), Colors, Categories, and Price range.
  - Instant live search functionality.
- **Product Details Page (PDP):**
  - Multi-image gallery with zoom-in capability.
  - Dynamic size and color selector with real-time stock status (e.g., "12 in stock").
  - "Add to Cart" and "Buy Now" buttons.
  - Accordion sections for Description, Size Guide, and Customer Reviews.
  - "You May Also Like" and "People Also Purchased" product recommendation carousels.
- **Cart & Checkout:**
  - Slide-over dynamic cart drawer with instant quantity updates and subtotal calculations.
  - Seamless Checkout Page supporting Cash on Delivery (COD), shipping area selection, customer details, and discount/referral code application.
- **Order Tracking:**
  - Dedicated order tracking page where customers can enter their Mobile Number and Order ID to check real-time delivery status.

### 2. BACKEND & ADMIN PANEL FEATURES:
- **Admin Dashboard:**
  - Analytics overview cards for Total Revenue, Total Orders, Total Visitors, and Net Profit.
  - Visual sales report charts (Monthly/Weekly graphs) and Sales by Category breakdown.
- **Order Management:**
  - Order list table with status badges (New orders, Awaiting acceptance, On way, Delivered, Cancelled).
  - Ability to view order details, customer info, and update order statuses instantly.
- **Product Management:**
  - CRUD operations for products (Add, Edit, Delete, Stock Update, Price, Category, Sizes, Colors, and Image Uploads).
- **Customer & Coupon Management:**
  - Manage registered customers, view order history, and create/manage discount coupons.

### 3. DATABASE SCHEMA & MODELS REQUIRED:
- **Products Table:** id, name, slug, description, price, stock (integer), sizes (json), colors (json), image, gallery (json), is_featured (boolean), timestamps.
- **Orders Table:** id, order_id (unique string like AF-XXXXXX), customer_name, address, shipping_area, mobile, email, remarks, total_amount, status (enum: pending, processing, on_the_way, delivered, cancelled), payment_method, timestamps.
- **Order Items Table:** id, order_id, product_id, size, quantity, price, timestamps.

### 4. TECHNICAL & DESIGN REQUIREMENTS:
- Write clean, modular, and secure Laravel Controller logic, Eloquent relationships, and Migration files.
- Use Tailwind CSS for styling with a sophisticated color palette (Deep blacks, soft pink accents, clean whites, and subtle grey borders).
- Ensure fully responsive design across mobile phones, tablets, and desktops.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://aira-flora-fashion-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/60a4ae33-45a3-487a-832f-81e8bce4c8bc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
