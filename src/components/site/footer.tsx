import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/shop.functions";
import { CATEGORIES } from "@/lib/shop-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await subscribeNewsletter({ data: { email } });
      toast.success("You're on the list — welcome to Aira Flora.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="border-t border-border bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <span className="font-display text-2xl font-semibold tracking-[0.12em]">AIRA FLORA</span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
              Quiet luxury for everyday wardrobes. Designed in Dhaka, delivered to your door — pay only when it
              arrives.
            </p>
            <form onSubmit={subscribe} className="mt-6 flex max-w-sm gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email for early access"
                className="h-11 rounded-none border-border bg-card"
              />
              <Button type="submit" disabled={busy} className="h-11 rounded-none bg-primary px-6">
                {busy ? "…" : "Join"}
              </Button>
            </form>
          </div>

          <div>
            <h3 className="eyebrow text-foreground/60">Shop</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link
                    to="/shop"
                    search={{ category: c }}
                    className="text-ink-soft transition-colors hover:text-rose-deep"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="eyebrow text-foreground/60">Help</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/track" className="text-ink-soft transition-colors hover:text-rose-deep">
                  Track your order
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-ink-soft transition-colors hover:text-rose-deep">
                  Size guide
                </Link>
              </li>
              <li className="text-ink-soft">Cash on Delivery nationwide</li>
              <li className="text-ink-soft">7-day easy exchange</li>
              <li className="text-ink-soft">hello@airaflora.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Aira Flora. All rights reserved.</span>
          <span className="eyebrow text-[0.6rem]">Dhaka, Bangladesh</span>
        </div>
      </div>
    </footer>
  );
}
