import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminDeleteProduct,
  adminSaveProduct,
  adminProductsList,
  adminUploadImage,
  type AdminProductInput,
} from "@/lib/admin.functions";
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
import { Textarea } from "@/components/ui/textarea";
import { isAuthError, useAdminPassword } from "@/lib/admin-auth";
import { CATEGORIES, formatBDT } from "@/lib/shop-constants";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

const EMPTY: AdminProductInput = {
  name: "",
  slug: "",
  description: "",
  category: "Dresses",
  price: 0,
  compare_price: null,
  stock: 0,
  sizes: ["S", "M", "L"],
  colors: [],
  image: "",
  gallery: [],
  is_featured: false,
  is_flash_sale: false,
  flash_sale_price: null,
  flash_ends_at: null,
};

function AdminProducts() {
  const { password, setPassword } = useAdminPassword();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminProductInput | null>(null);

  const q = useQuery({
    queryKey: ["admin", "products", password],
    queryFn: () => adminProductsList({ data: { adminPassword: password ?? "" } }),
    enabled: !!password,
  });

  useEffect(() => {
    if (q.error && isAuthError(q.error)) setPassword(null);
  }, [q.error, setPassword]);

  const save = useMutation({
    mutationFn: (product: AdminProductInput) =>
      adminSaveProduct({ data: { adminPassword: password ?? "", product } }),
    onSuccess: () => {
      toast.success("Product saved.");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => {
      if (isAuthError(err)) setPassword(null);
      toast.error(err instanceof Error ? err.message : "Save failed.");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteProduct({ data: { adminPassword: password ?? "", id } }),
    onSuccess: () => {
      toast.success("Product deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
        <h1 className="font-display text-3xl font-medium">Products</h1>
        <Button onClick={() => setEditing({ ...EMPTY })} className="rounded-none bg-primary uppercase tracking-[0.14em]">
          <Plus className="mr-2 h-4 w-4" /> New product
        </Button>
      </div>

      {q.isPending ? (
        <Skeleton className="h-96 rounded-none" />
      ) : list.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">No products yet.</p>
      ) : (
        <div className="glass-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-12 w-9 object-cover" />
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">/{p.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.category}</TableCell>
                  <TableCell className="text-right text-sm">
                    {formatBDT(p.price)}
                    {p.compare_price ? (
                      <span className="ml-1 text-xs text-muted-foreground line-through">{formatBDT(p.compare_price)}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right text-sm">{p.stock}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.is_featured ? "Featured " : ""}
                    {p.is_flash_sale ? "· Flash" : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-none px-3 text-xs"
                        onClick={() =>
                          setEditing({
                            id: p.id,
                            name: p.name,
                            slug: p.slug,
                            description: p.description,
                            category: p.category,
                            price: p.price,
                            compare_price: p.compare_price,
                            stock: p.stock,
                            sizes: p.sizes,
                            colors: p.colors,
                            image: p.image,
                            gallery: p.gallery,
                            is_featured: p.is_featured,
                            is_flash_sale: p.is_flash_sale,
                            flash_sale_price: p.flash_sale_price,
                            flash_ends_at: p.flash_ends_at,
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
                          if (window.confirm(`Delete “${p.name}”? This cannot be undone.`)) {
                            remove.mutate(p.id);
                          }
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

      <ProductDialog
        value={editing}
        password={password ?? ""}
        onAuthError={() => setPassword(null)}
        onClose={() => setEditing(null)}
        onSave={(p) => save.mutate(p)}
        saving={save.isPending}
      />
    </div>
  );
}

function UploadButton({
  adminPassword,
  label,
  multiple = false,
  onUploaded,
  onAuthError,
}: {
  adminPassword: string;
  label: string;
  multiple?: boolean;
  onUploaded: (urls: string[]) => void;
  onAuthError: (() => void) | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of list) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`"${file.name}" is larger than 10 MB.`);
          continue;
        }
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
          reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
          reader.readAsDataURL(file);
        });
        const res = await adminUploadImage({
          data: {
            adminPassword,
            fileName: file.name,
            contentType: file.type || "image/jpeg",
            dataBase64: base64,
          },
        });
        urls.push(res.url);
      }
      if (!urls.length) throw new Error("Nothing was uploaded.");
      onUploaded(urls);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Unauthorized")) onAuthError?.();
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="shrink-0 whitespace-nowrap rounded-none"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </>
  );
}

function ProductDialog({
  value,
  password,
  onAuthError,
  onClose,
  onSave,
  saving,
}: {
  value: AdminProductInput | null;
  password: string;
  onAuthError?: () => void;
  onClose: () => void;
  onSave: (p: AdminProductInput) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<AdminProductInput>(value ?? EMPTY);
  const [sizesText, setSizesText] = useState("");
  const [colorsText, setColorsText] = useState("");
  const [galleryText, setGalleryText] = useState("");

  useEffect(() => {
    if (value) {
      setForm(value);
      setSizesText(value.sizes.join(", "));
      setColorsText(value.colors.map((c) => `${c.name}:${c.hex}`).join(", "));
      setGalleryText(value.gallery.join(", "));
    }
  }, [value]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      sizes: sizesText.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
      colors: colorsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((pair) => {
          const [name, hex] = pair.split(":");
          return { name: (name ?? "").trim(), hex: (hex ?? "#000000").trim() };
        }),
      gallery: galleryText.split(",").map((s) => s.trim()).filter(Boolean),
    });
  }

  const set = <K extends keyof AdminProductInput>(key: K, v: AdminProductInput[K]) =>
    setForm((f) => ({ ...f, [key]: v }));

  return (
    <Dialog open={!!value} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{value?.id ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" required value={form.name} onChange={(e) => set("name", e.target.value)} className="rounded-none" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-category">Category</Label>
            <select
              id="p-category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="h-10 w-full border border-input bg-transparent px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-stock">Stock</Label>
            <Input
              id="p-stock"
              type="number"
              min={0}
              required
              value={form.stock}
              onChange={(e) => set("stock", Number(e.target.value))}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-price">Price (৳)</Label>
            <Input
              id="p-price"
              type="number"
              min={0}
              required
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-compare">Compare price (৳)</Label>
            <Input
              id="p-compare"
              type="number"
              min={0}
              value={form.compare_price ?? ""}
              onChange={(e) => set("compare_price", e.target.value ? Number(e.target.value) : null)}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="p-image">Main image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="p-image"
                required
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="Upload a photo, or paste a URL"
                className="flex-1 rounded-none"
              />
              <UploadButton
                adminPassword={password}
                label="Upload photo"
                onUploaded={(urls) => urls[0] && set("image", urls[0])}
                onAuthError={onAuthError}
              />
            </div>
            {form.image ? (
              <img
                src={form.image}
                alt="Main image preview"
                className="h-24 w-20 border border-border object-cover"
              />
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="p-gallery">Gallery (comma separated URLs)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="p-gallery"
                value={galleryText}
                onChange={(e) => setGalleryText(e.target.value)}
                className="flex-1 rounded-none"
              />
              <UploadButton
                adminPassword={password}
                label="Add photos"
                multiple
                onUploaded={(urls) => {
                  if (!urls.length) return;
                  setGalleryText((t) => (t.trim() ? `${t.trim().replace(/,\s*$/, "")}, ${urls.join(", ")}` : urls.join(", ")));
                }}
                onAuthError={onAuthError}
              />
            </div>
            <p className="text-xs text-muted-foreground">You can pick several photos from your phone or computer at once.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-sizes">Sizes (comma separated)</Label>
            <Input id="p-sizes" value={sizesText} onChange={(e) => setSizesText(e.target.value)} className="rounded-none" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-colors">Colors (name:hex, comma separated)</Label>
            <Input id="p-colors" placeholder="Black:#111111" value={colorsText} onChange={(e) => setColorsText(e.target.value)} className="rounded-none" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" rows={3} required value={form.description} onChange={(e) => set("description", e.target.value)} className="rounded-none" />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={form.is_featured} onCheckedChange={(v) => set("is_featured", v)} /> Featured on home
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={form.is_flash_sale} onCheckedChange={(v) => set("is_flash_sale", v)} /> Flash sale
          </label>
          {form.is_flash_sale ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="p-flash-price">Flash sale price (৳)</Label>
                <Input
                  id="p-flash-price"
                  type="number"
                  min={0}
                  value={form.flash_sale_price ?? ""}
                  onChange={(e) => set("flash_sale_price", e.target.value ? Number(e.target.value) : null)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-flash-ends">Flash sale ends</Label>
                <Input
                  id="p-flash-ends"
                  type="datetime-local"
                  value={form.flash_ends_at ? form.flash_ends_at.slice(0, 16) : ""}
                  onChange={(e) => set("flash_ends_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="rounded-none"
                />
              </div>
            </>
          ) : null}
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-none">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-none bg-primary uppercase tracking-[0.14em]">
              {saving ? "Saving…" : "Save product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
