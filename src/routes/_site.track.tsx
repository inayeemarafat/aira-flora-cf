import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, PackageSearch, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackOrder } from "@/lib/shop.functions";
import { formatBDT, ORDER_STATUSES, statusLabel } from "@/lib/shop-constants";
import { cn } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

export const Route = createFileRoute("/_site/track")({
  component: TrackOrderPage,
});

const TIMELINE = ORDER_STATUSES.filter((s) => s.value !== "cancelled");

function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ order: Order; items: OrderItem[] } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await trackOrder({ data: { orderId, mobile } });
      if (!res) {
        toast.error("No order found for that number and mobile.");
      } else {
        setResult(res);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = result ? TIMELINE.findIndex((s) => s.value === result.order.status) : -1;
  const cancelled = result?.order.status === "cancelled";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <p className="eyebrow text-rose-deep">Where is my parcel?</p>
        <h1 className="mt-2 font-display text-4xl font-medium text-foreground md:text-5xl">Track Order</h1>
      </header>

      <form onSubmit={submit} className="glass-card mx-auto mt-10 grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <div className="space-y-2">
          <Label htmlFor="order-id">Order number</Label>
          <Input
            id="order-id"
            required
            placeholder="AF-XXXXXX"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="rounded-none uppercase"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="track-mobile">Mobile used at checkout</Label>
          <Input
            id="track-mobile"
            required
            inputMode="tel"
            placeholder="01XXXXXXXXX"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="rounded-none"
          />
        </div>
        <Button type="submit" disabled={busy} className="h-11 rounded-none bg-primary uppercase tracking-[0.18em] sm:col-span-2">
          {busy ? "Looking up…" : "Track my order"}
        </Button>
      </form>

      {result ? (
        <div className="glass-card mt-10 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
            <div>
              <p className="eyebrow text-muted-foreground">Order</p>
              <p className="mt-1 font-display text-2xl font-semibold">{result.order.order_id}</p>
            </div>
            <div className="text-right">
              <p className="eyebrow text-muted-foreground">Status</p>
              <p className={cn("mt-1 text-sm font-medium", cancelled ? "text-destructive" : "text-rose-deep")}>
                {statusLabel(result.order.status)}
              </p>
            </div>
          </div>

          {cancelled ? (
            <div className="mt-6 flex items-center gap-3 text-sm text-destructive">
              <X className="h-5 w-5" strokeWidth={1.5} /> This order was cancelled. Contact us if this seems wrong.
            </div>
          ) : (
            <ol className="mt-8 space-y-0">
              {TIMELINE.map((s, i) => {
                const done = i <= stepIndex;
                return (
                  <li key={s.value} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border",
                          done ? "border-rose-deep bg-rose-deep text-white" : "border-border bg-background text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                      </span>
                      {i < TIMELINE.length - 1 ? (
                        <span className={cn("h-10 w-px", i < stepIndex ? "bg-rose-deep" : "bg-border")} />
                      ) : null}
                    </div>
                    <div className="pb-1 pt-1.5">
                      <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                        {s.label}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-6 border-t border-border pt-5">
            <p className="eyebrow text-muted-foreground">Items</p>
            <ul className="mt-3 space-y-3">
              {result.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 text-sm">
                  {i.image ? (
                    <img src={i.image} alt={i.product_name} className="h-14 w-11 shrink-0 object-cover" />
                  ) : (
                    <PackageSearch className="h-8 w-8 text-muted-foreground/50" strokeWidth={1} />
                  )}
                  <div className="flex flex-1 justify-between gap-2">
                    <span>
                      {i.product_name} · {i.size}
                      {i.color ? ` · ${i.color}` : ""} × {i.quantity}
                    </span>
                    <span>{formatBDT(i.price * i.quantity)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-sm">
              <span className="eyebrow text-foreground/80">Total (cash on delivery)</span>
              <span className="font-display text-xl font-semibold">{formatBDT(result.order.total_amount)}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Delivering to: {result.order.address} ({result.order.shipping_area === "outside" ? "Outside Dhaka" : "Dhaka"})
            </p>
          </div>
        </div>
      ) : null}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Haven't ordered yet? <Link to="/shop" className="text-rose-deep underline-offset-4 hover:underline">Start here</Link>.
      </p>
    </div>
  );
}
