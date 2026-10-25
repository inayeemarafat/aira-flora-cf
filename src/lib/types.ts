export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  compare_price: number | null;
  stock: number;
  sizes: string[];
  colors: ProductColor[];
  image: string;
  gallery: string[];
  is_featured: boolean;
  is_flash_sale: boolean;
  flash_sale_price: number | null;
  flash_ends_at: string | null;
  rating: number;
  reviews_count: number;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  author: string;
  rating: number;
  comment: string;
  created_at: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  address: string;
  shipping_area: string;
  mobile: string;
  email: string | null;
  remarks: string | null;
  total_amount: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  coupon_code: string | null;
  status: OrderStatus;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  image: string | null;
  size: string;
  color: string | null;
  quantity: number;
  price: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order: number;
  active: boolean;
  expires_at: string | null;
  used_count: number;
}

export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size: string;
  color: string | null;
  quantity: number;
  maxStock: number;
}
