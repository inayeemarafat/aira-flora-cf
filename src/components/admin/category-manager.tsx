import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tags } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminDeleteCategory,
  adminListCategories,
  adminSaveCategory,
} from "@/lib/admin.functions";
import { isAuthError, useAdminPassword } from "@/lib/admin-auth";

/** "Categories" button + dialog for adding, renaming and deleting product categories. */
export function CategoryManager() {
  const { password, setPassword } = useAdminPassword();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const q = useQuery({
    queryKey: ["admin", "categories", password],
    queryFn: () => adminListCategories({ data: { adminPassword: password ?? "" } }),
    enabled: !!password && open,
  });

  useEffect(() => {
    if (q.error && isAuthError(q.error)) setPassword(null);
  }, [q.error, setPassword]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
  }

  function onError(err: unknown, fallback: string) {
    if (isAuthError(err)) setPassword(null);
    toast.error(err instanceof Error ? err.message : fallback);
  }

  const save = useMutation({
    mutationFn: (vars: { id?: string; name: string }) =>
      adminSaveCategory({ data: { adminPassword: password ?? "", ...vars } }),
    onSuccess: (_res, vars) => {
      toast.success(vars.id ? "Category renamed." : "Category added.");
      if (vars.id) setEditingId(null);
      else setNewName("");
      refresh();
    },
    onError: (err) => onError(err, "Save failed."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteCategory({ data: { adminPassword: password ?? "", id } }),
    onSuccess: () => {
      toast.success("Category deleted.");
      refresh();
    },
    onError: (err) => onError(err, "Delete failed."),
  });

  const list = q.data ?? [];

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="rounded-none uppercase tracking-[0.14em]"
      >
        <Tags className="mr-2 h-4 w-4" /> Categories
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Categories</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate({ name: newName });
            }}
            className="flex gap-2"
          >
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name"
              maxLength={40}
              className="rounded-none"
              aria-label="New category name"
            />
            <Button
              type="submit"
              disabled={save.isPending || !newName.trim()}
              className="rounded-none bg-primary uppercase tracking-[0.14em]"
            >
              Add
            </Button>
          </form>

          {q.isPending ? (
            <Skeleton className="h-40 rounded-none" />
          ) : list.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <ul className="max-h-[50vh] divide-y divide-border overflow-y-auto border border-border">
              {list.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  {editingId === c.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        save.mutate({ id: c.id, name: editName });
                      }}
                      className="flex w-full items-center gap-2"
                    >
                      <Input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={40}
                        className="h-8 rounded-none"
                        aria-label={`Rename ${c.name}`}
                      />
                      <Button type="submit" size="sm" disabled={save.isPending} className="h-8 rounded-none px-3 text-xs">
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="h-8 rounded-none px-3 text-xs"
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.productCount} product{c.productCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-none px-3 text-xs"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditName(c.name);
                          }}
                        >
                          Rename
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-none px-3 text-xs text-destructive hover:text-destructive"
                          disabled={remove.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete category "${c.name}"?`)) remove.mutate(c.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            A category can only be deleted when it has no products. Renaming updates its products.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
