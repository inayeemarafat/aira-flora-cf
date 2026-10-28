import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminListOrders, adminUpdateOrderStatus } from "@/lib/admin.functions";
import { isAuthError, useAdminPassword } from "@/lib/admin-auth";
import { formatBDT, ORDER_STATUSES, statusLabel } from "@/lib/shop-constants";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const { password, setPassword } = useAdminPassword();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("all");

  const q = useQuery({
    queryKey: ["admin", "orders", password, status],
    queryFn: () =>
      adminListOrders({ data: { adminPassword: password ?? "", status: status === "all" ? undefined : status } }),
    enabled: !!password,
  });

  useEffect(() => {
    if (q.error && isAuthError(q.error)) setPassword(null);
  }, [q.error, setPassword]);

  const update = useMutation({
    mutationFn: (input: { id: string; status: string }) =>
      adminUpdateOrderStatus({ data: { adminPassword: password ?? "", ...input } }),
    onSuccess: () => {
      toast.success("Order status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (err) => {
      if (isAuthError(err)) setPassword(null);
      toast.error(err instanceof Error ? err.message : "Update failed.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-medium">Orders</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48 rounded-none border-border bg-card text-xs uppercase tracking-[0.14em]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All orders</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {q.isPending || !q.data ? (
        <Skeleton className="h-96 rounded-none" />
      ) : q.data.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">No orders here yet.</p>
      ) : (
        <div className="glass-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_id}</TableCell>
                  <TableCell>
                    <div className="text-sm">{order.customer_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.mobile} · {order.shipping_area === "outside" ? "Outside Dhaka" : "Dhaka"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-64 text-xs text-muted-foreground">
                    {order.items.map((i) => `${i.product_name} (${i.size} ×${i.quantity})`).join(", ")}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatBDT(order.total_amount)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => update.mutate({ id: order.id, status: value })}
                      disabled={update.isPending}
                    >
                      <SelectTrigger className="h-8 w-40 rounded-none border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {statusLabel(s.value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
