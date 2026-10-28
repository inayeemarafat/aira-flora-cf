import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminListCustomers } from "@/lib/admin.functions";
import { isAuthError, useAdminPassword } from "@/lib/admin-auth";
import { formatBDT } from "@/lib/shop-constants";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const { password, setPassword } = useAdminPassword();
  const q = useQuery({
    queryKey: ["admin", "customers", password],
    queryFn: () => adminListCustomers({ data: { adminPassword: password ?? "" } }),
    enabled: !!password,
  });

  useEffect(() => {
    if (q.error && isAuthError(q.error)) setPassword(null);
  }, [q.error, setPassword]);

  const list = q.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-medium">Customers</h1>
      {q.isPending ? (
        <Skeleton className="h-80 rounded-none" />
      ) : list.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">No customers yet.</p>
      ) : (
        <div className="glass-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total spent</TableHead>
                <TableHead>Last order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.mobile}>
                  <TableCell className="text-sm font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm">{c.mobile}</TableCell>
                  <TableCell className="text-right text-sm">{c.ordersCount}</TableCell>
                  <TableCell className="text-right font-medium">{formatBDT(c.totalSpent)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(c.lastOrderAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
