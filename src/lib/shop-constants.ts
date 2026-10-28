export const CURRENCY = "৳";

export function formatBDT(amount: number): string {
  return `${CURRENCY}${amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

export const SHIPPING_AREAS = [
  { id: "dhaka_city", label: "Inside Dhaka", cost: 60 },
  { id: "dhaka_suburban", label: "Dhaka Sub-urban", cost: 100 },
  { id: "outside", label: "Outside Dhaka", cost: 130 },
] as const;

export const FREE_SHIPPING_THRESHOLD = 2000;

export function shippingCost(areaId: string): number {
  return SHIPPING_AREAS.find((a) => a.id === areaId)?.cost ?? 0;
}

/** Single source of truth for checkout shipping: free over the threshold, else the area rate. */
export function orderShipping(subtotal: number, areaId: string): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : shippingCost(areaId);
}

export const ORDER_STATUSES: { value: string; label: string }[] = [
  { value: "pending", label: "New Order" },
  { value: "processing", label: "Awaiting Acceptance" },
  { value: "on_the_way", label: "On the Way" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function statusLabel(status: string): string {
  return ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export const CATEGORIES = [
  "Dresses",
  "Knitwear",
  "Outerwear",
  "Tops",
  "Bottoms",
];
