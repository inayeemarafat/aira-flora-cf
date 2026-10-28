import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, Eye, ShoppingCart, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { adminOverview } from "@/lib/admin.functions";
import { isAuthError, useAdminPassword } from "@/lib/admin-auth";
import { formatBDT } from "@/lib/shop-constants";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const PIE_COLORS = ["var(--rose-deep)", "var(--foreground)", "var(--rose)", "var(--ink-soft)", "var(--muted-foreground)"];

function AdminDashboard() {
  const { password, setPassword } = useAdminPassword();
  const q = useQuery({
    queryKey: ["admin", "overview", password],
    queryFn: () => adminOverview({ data: { adminPassword: password ?? "" } }),
    enabled: !!password,
  });

  useEffect(() => {
    if (q.error && isAuthError(q.error)) setPassword(null);
  }, [q.error, setPassword]);

  if (q.isPending || !q.data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-none" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-none" />
      </div>
    );
  }

  const o = q.data;
  const stats = [
    { label: "Total Revenue", value: formatBDT(o.revenue), icon: Banknote },
    { label: "Orders", value: String(o.ordersCount), icon: ShoppingCart },
    { label: "Visitors", value: String(o.visitors), icon: Eye },
    { label: "Net Profit", value: formatBDT(o.netProfit), icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-medium">Dashboard</h1>
        {o.pendingCount > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            <Link to="/admin/orders" className="text-rose-deep hover:underline">
              {o.pendingCount} new {o.pendingCount === 1 ? "order" : "orders"}
            </Link>{" "}
            waiting for acceptance.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card flex items-start justify-between p-5">
            <div>
              <p className="eyebrow text-muted-foreground">{s.label}</p>
              <p className="mt-2 font-display text-2xl font-semibold">{s.value}</p>
            </div>
            <s.icon className="h-5 w-5 text-rose-deep" strokeWidth={1.5} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-card p-6">
          <h2 className="eyebrow text-foreground/80">Revenue — last 6 months</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={o.monthly}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--rose-deep)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--rose-deep)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={(v) => formatBDT(Number(v))} contentStyle={{ borderRadius: 0 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--rose-deep)" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-card p-6">
          <h2 className="eyebrow text-foreground/80">Revenue — last 7 days</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={o.weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={(v) => formatBDT(Number(v))} contentStyle={{ borderRadius: 0 }} />
                <Bar dataKey="revenue" fill="var(--rose-deep)" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-card p-6">
          <h2 className="eyebrow text-foreground/80">Revenue by category</h2>
          {o.byCategory.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No sales recorded yet.</p>
          ) : (
            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={o.byCategory} dataKey="revenue" nameKey="category" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {o.byCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--background)" />
                    ))}
                  </Pie>
                  <Legend iconType="circle" formatter={(v) => <span className="text-xs">{v}</span>} />
                  <Tooltip formatter={(v) => formatBDT(Number(v))} contentStyle={{ borderRadius: 0 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="glass-card p-6">
          <h2 className="eyebrow text-foreground/80">Orders by status</h2>
          <ul className="mt-5 space-y-3">
            {Object.entries(o.statusCounts).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between border-b border-border pb-3 text-sm">
                <span className="capitalize text-ink-soft">{status.replace(/_/g, " ")}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
