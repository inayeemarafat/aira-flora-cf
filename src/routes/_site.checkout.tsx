import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { createOrder, validateCoupon } from "@/lib/shop.functions";
import { formatBDT, SHIPPING_AREAS } from "@/lib/shop-constants";
import { useCart } from "@/store/cart";

export const Route = createFileRoute("/_site/checkout")({
  component: CheckoutPage,
});

interface Placed {
  orderId: string;
  total: number;
  name: string;
}

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState<string>(SHIPPING_AREAS[0].id);
  const [remarks, setRemarks] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);

  const shipping = subtotal >= 2000 ? 0 : (SHIPPING_AREAS.find((a) => a.id === area)?.cost ?? 0);
  const total = Math.max(0, subtotal - discount) + shipping;

  async function applyCoupon() {
    if (!coupon.trim()) return;
    try {
      const res = await validateCoupon({ data: { code: coupon, subtotal } });
      if (res.valid) {
        setDiscount(res.discount);
        toast.success(res.message);
      } else {
        setDiscount(0);
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not check that code.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createOrder({
        data: {
          name,
          mobile,
          email: email || undefined,
          address,
          area,
          remarks: remarks || undefined,
          couponCode: discount > 0 ? coupon : undefined,
          items: items.map((i) => ({ productId: i.productId, size: i.size, color: i.color, quantity: i.quantity })),
        },
      });
      setPlaced({ orderId: res.orderId, total: res.total, name });
      clear();
      toast.success(`Order ${res.orderId} placed — pay cash on delivery.`);
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong placing your order.");
    } finally {
      setBusy(false);
    }
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <BadgeCheck className="mx-auto h-14 w-14 text-rose-deep" strokeWidth={1.2} />
        <h1 className="mt-6 font-display text-4xl font-medium text-foreground">Thank you, {placed.name}!</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Your order is confirmed. Pay <span className="font-semibold text-foreground">{formatBDT(placed.total)}</span> in
          cash when it arrives.
        </p>
        <div className="glass-card mx-auto mt-8 max-w-sm p-6">
          <p className="eyebrow text-muted-foreground">Order number</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-wide text-foreground">{placed.orderId}</p>
          <p className="mt-2 text-xs text-muted-foreground">Keep this number to track your delivery.</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-none bg-primary px-8 uppercase tracking-[0.18em]">
            <Link to="/track">Track order</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-none border-foreground px-8 uppercase tracking-[0.18em]">
            <Link to="/shop">Keep shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <ShoppingBag className="h-10 w-10 text-muted-foreground/50" strokeWidth={1} />
        <h1 className="mt-6 font-display text-3xl font-medium text-foreground">Your bag is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add something you love before checking out.</p>
        <Button asChild className="mt-8 rounded-none bg-primary px-10 uppercase tracking-[0.18em]">
          <Link to="/shop">Shop the collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="text-center">
        <p className="eyebrow text-rose-deep">Almost there</p>
        <h1 className="mt-2 font-display text-4xl font-medium text-foreground md:text-5xl">Checkout</h1>
      </header>

      <form onSubmit={submit} className="mt-12 grid gap-10 lg:grid-cols-5">
        {/* Details */}
        <div className="space-y-6 lg:col-span-3">
          <div className="glass-card space-y-5 p-6 sm:p-8">
            <h2 className="eyebrow text-foreground/80">Delivery details</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name *</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="rounded-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile number *</Label>
                <Input
                  id="mobile"
                  required
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="rounded-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Full address *</Label>
              <Textarea
                id="address"
                required
                rows={3}
                placeholder="House, road, area, city"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Shipping area *</Label>
              <RadioGroup value={area} onValueChange={setArea} className="grid gap-3 sm:grid-cols-3">
                {SHIPPING_AREAS.map((a) => (
                  <Label
                    key={a.id}
                    htmlFor={a.id}
                    className="flex cursor-pointer items-center justify-between rounded-none border border-border px-4 py-3 text-sm font-normal has-[[data-state=checked]]:border-foreground"
                  >
                    <span>{a.label}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatBDT(a.cost)}</span>
                      <RadioGroupItem id={a.id} value={a.id} />
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Order remarks (optional)</Label>
              <Textarea
                id="remarks"
                rows={2}
                placeholder="Anything we should know?"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="rounded-none"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-2">
          <div className="glass-card space-y-5 p-6 sm:p-8">
            <h2 className="eyebrow text-foreground/80">Order summary</h2>
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3">
                  <img src={i.image} alt={i.name} className="h-16 w-12 shrink-0 object-cover" />
                  <div className="flex flex-1 items-start justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium leading-snug">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.size}
                        {i.color ? ` · ${i.color}` : ""} × {i.quantity}
                      </p>
                    </div>
                    <span className="whitespace-nowrap">{formatBDT(i.price * i.quantity)}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex gap-2">
              <Input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Discount code"
                className="h-10 rounded-none uppercase"
              />
              <Button type="button" variant="outline" onClick={applyCoupon} className="h-10 rounded-none px-5 text-xs uppercase tracking-[0.14em]">
                Apply
              </Button>
            </div>

            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between text-rose-deep">
                  <span>Discount</span>
                  <span>−{formatBDT(discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? "Free" : formatBDT(shipping)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="eyebrow text-foreground/80">Total (cash on delivery)</span>
                <span className="font-display text-2xl font-semibold">{formatBDT(total)}</span>
              </div>
            </div>

            <Button type="submit" disabled={busy} className="h-12 w-full rounded-none bg-primary uppercase tracking-[0.2em]">
              {busy ? "Placing order…" : "Place order"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Pay cash when your parcel arrives. No advance payment needed.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
