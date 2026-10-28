import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ClipboardList, LayoutDashboard, LogOut, Package, Ticket, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLogin } from "@/lib/admin.functions";
import { useAdminPassword } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Aira Flora" },
      { name: "description", content: "Aira Flora store administration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Orders", to: "/admin/orders", icon: ClipboardList },
  { label: "Products", to: "/admin/products", icon: Package },
  { label: "Coupons", to: "/admin/coupons", icon: Ticket },
  { label: "Customers", to: "/admin/customers", icon: Users },
] as const;

function AdminLayout() {
  const { password, setPassword } = useAdminPassword();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminLogin({ data: { adminPassword: input } });
      setPassword(input);
      setInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!password) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <form onSubmit={signIn} className="glass-card w-full max-w-sm space-y-6 p-8">
          <div className="text-center">
            <p className="font-display text-2xl font-semibold tracking-[0.12em]">AIRA FLORA</p>
            <p className="eyebrow mt-1 text-[0.6rem] text-rose-deep">Store Administration</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-password" className="eyebrow text-foreground/70">
              Admin password
            </label>
            <Input
              id="admin-password"
              type="password"
              required
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-none"
            />
          </div>
          <Button type="submit" disabled={busy} className="h-11 w-full rounded-none bg-primary uppercase tracking-[0.18em]">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-rose-deep">
              ← Back to store
            </Link>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="border-b border-border bg-cream lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col p-5">
          <Link to="/admin" className="font-display text-xl font-semibold tracking-[0.12em]">
            AIRA FLORA
          </Link>
          <nav className="mt-8 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: "exact" in item ? item.exact : false }}
                className="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-6">
            <Button
              variant="ghost"
              onClick={() => {
                setPassword(null);
                toast.success("Signed out.");
              }}
              className="w-full justify-start gap-3 text-sm text-foreground/70 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sign out
            </Button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
