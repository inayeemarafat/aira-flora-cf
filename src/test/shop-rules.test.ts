import { describe, expect, it } from "vitest";

import { orderShipping, shippingCost, statusLabel } from "@/lib/shop-constants";

// Business rules for Aira Flora shipping and order statuses.
describe("Shipping rules", () => {
  it("charges the area rate below the free-shipping threshold", () => {
    expect(shippingCost("dhaka_city")).toBe(60);
    expect(shippingCost("dhaka_suburban")).toBe(100);
    expect(shippingCost("outside")).toBe(130);
    expect(orderShipping(1500, "dhaka_city")).toBe(60);
    expect(orderShipping(1500, "outside")).toBe(130);
  });

  it("makes shipping free once the subtotal reaches ৳2,000, everywhere", () => {
    expect(orderShipping(2000, "dhaka_city")).toBe(0);
    expect(orderShipping(5000, "outside")).toBe(0);
  });
});

describe("Order status labels", () => {
  it("labels every admin-facing status", () => {
    expect(statusLabel("pending")).toBe("New Order");
    expect(statusLabel("on_the_way")).toBe("On the Way");
    expect(statusLabel("delivered")).toBe("Delivered");
    expect(statusLabel("cancelled")).toBe("Cancelled");
  });
});
