import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminDeleteCoupon, adminListCoupons, adminSaveCoupon } from "@/lib/admin.functions";
import { isAuthError, useAdminPassword } from "@/lib/admin-auth";
import { formatBDT } from "@/lib/shop-constants";
import type { Coupon } from "@/lib/types";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

interface CouponForm {
  id?: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order: number;
  active: boolean;
  expires_at: string | null;
}

const EMPTY: CouponForm = { code: "", type: "percent", value: 10, min_order: 0, active: true, expires_at: null };

function AdminCoupons() {
  const { password, setPassword } = useAdminPassword();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CouponForm | null>(null);

  const q = useQuery({
    queryKey: ["admin", "coupons", password],
    queryFn: () => adminListCoupons({ data: { adminPassword: password ?? "" } }),
    enabled: !!password,
  });

  useEffect(() => {
    if (q.error && isAuthError(q.error)) setPassword(null);
  }, [q.error, setPassword]);

  const save = useMutation({
    mutationFn: (coupon: CouponForm) => adminSaveCoupon({ data: { adminPassword: password ?? "", coupon } }),
    onSuccess: () => {
      toast.success("Coupon saved.");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (err) => {
      if (isAuthError(err)) setPassword(null);
      toast.error(err instanceof Error ? err.message : "Save failed.");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteCoupon({ data: { adminPassword: password ?? "", id } }),
    onSuccess: () => {
      toast.success("Coupon deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (err) => {
      if (isAuthError(err)) setPassword(null);
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    },
  });

  const list = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-medium">Coupons</h1>
        <Button onClick={() => setEditing({ ...EMPTY })} className="rounded-none bg-primary uppercase tracking-[0.14em]">
          <Plus className="mr-2 h-4 w-4" /> New coupon
        </Button>
      </div>

      {q.isPending ? (
        <Skeleton className="h-80 rounded-none" />
      ) : list.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">No coupons yet.</p>
      ) : (
        <div className="glass-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="text-right">Min order</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium tracking-widest">{c.code}</TableCell>
                  <TableCell className="text-sm">
                    {c.type === "percent" ? `${c.value}% off` : `${formatBDT(c.value)} off`}
                  </TableCell>
                  <TableCell className="text-right text-sm">{formatBDT(c.min_order)}</TableCell>
                  <TableCell className="text-right text-sm">{c.used_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never"}
                  </TableCell>
                  <TableCell>
                    <span className={c.active ? "text-rose-deep" : "text-muted-foreground"}>{c.active ? "Active" : "Off"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-none px-3 text-xs"
                        onClick={() =>
                          setEditing({
                            id: c.id,
                            code: c.code,
                            type: c.type,
                            value: c.value,
                            min_order: c.min_order,
                            active: c.active,
                            expires_at: c.expires_at,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-none px-3 text-xs text-destructive hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Delete coupon ${c.code}?`)) remove.mutate(c.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => (open ? undefined : setEditing(null))}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing?.id ? "Edit coupon" : "New coupon"}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(editing);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="c-code">Code</Label>
                <Input
                  id="c-code"
                  required
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  className="rounded-none uppercase tracking-widest"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="c-type">Type</Label>
                  <select
                    id="c-type"
                    value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value as Coupon["type"] })}
                    className="h-10 w-full border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="percent">Percent %</option>
                    <option value="fixed">Fixed ৳</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-value">Value</Label>
                  <Input
                    id="c-value"
                    type="number"
                    min={1}
                    required
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
                    className="rounded-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="c-min">Min order (৳)</Label>
                  <Input
                    id="c-min"
                    type="number"
                    min={0}
                    value={editing.min_order}
                    onChange={(e) => setEditing({ ...editing, min_order: Number(e.target.value) })}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-expires">Expires (optional)</Label>
                  <Input
                    id="c-expires"
                    type="date"
                    value={editing.expires_at ? editing.expires_at.slice(0, 10) : ""}
                    onChange={(e) =>
                      setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                    className="rounded-none"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm">
                <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} /> Active
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)} className="rounded-none">
                  Cancel
                </Button>
                <Button type="submit" disabled={save.isPending} className="rounded-none bg-primary uppercase tracking-[0.14em]">
                  {save.isPending ? "Saving…" : "Save coupon"}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
