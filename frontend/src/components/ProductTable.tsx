import { useState } from "react";
import { Search } from "lucide-react";
import { Product, getExpiryStatus } from "@/lib/sampleData";
import { useProducts } from "@/context/ProductContext";
import { toast } from "sonner";
import StatusBadge from "./StatusBadge";

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products }: ProductTableProps) {
  const { updateProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "good" | "warning" | "expired">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", quantity: "", expiryDate: "", supplier: "" });

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase());
    const status = getExpiryStatus(p.expiryDate);
    const matchesFilter = filter === "all" || status === filter;
    return matchesSearch && matchesFilter;
  });

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      quantity: String(product.quantity),
      expiryDate: product.expiryDate,
      supplier: product.supplier,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", quantity: "", expiryDate: "", supplier: "" });
  };

  const saveEdit = async (id: string) => {
    if (!editForm.name.trim() || !editForm.supplier.trim() || !editForm.expiryDate || Number(editForm.quantity) <= 0) {
      toast.error("Please fill valid values before saving.");
      return;
    }

    try {
      await updateProduct(id, {
        name: editForm.name.trim(),
        quantity: Number(editForm.quantity),
        expiryDate: editForm.expiryDate,
        supplier: editForm.supplier.trim(),
      });
      toast.success("Product updated.");
      cancelEdit();
    } catch {
      toast.error("Failed to update product.");
    }
  };

  const removeProduct = async (id: string) => {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    try {
      await deleteProduct(id);
      toast.success("Product deleted.");
    } catch {
      toast.error("Failed to delete product.");
    }
  };

  return (
    <div className="rounded-lg border bg-card animate-fade-in">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b">
        <h2 className="text-lg font-semibold font-display text-card-foreground">Product Inventory</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-56"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="h-9 rounded-md border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="good">Good</option>
            <option value="warning">Near Expiry</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Qty</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expiry Date</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No products found.</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-card-foreground">
                    {editingId === p.id ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="h-8 w-44 rounded-md border bg-background px-2 text-sm"
                      />
                    ) : p.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {editingId === p.id ? (
                      <input
                        value={editForm.supplier}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, supplier: e.target.value }))}
                        className="h-8 w-40 rounded-md border bg-background px-2 text-sm"
                      />
                    ) : p.supplier}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === p.id ? (
                      <input
                        type="number"
                        min="1"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: e.target.value }))}
                        className="h-8 w-20 rounded-md border bg-background px-2 text-sm text-center"
                      />
                    ) : (
                      <span className={p.quantity <= 5 ? "font-semibold text-status-danger" : "text-card-foreground"}>
                        {p.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {editingId === p.id ? (
                      <input
                        type="date"
                        value={editForm.expiryDate}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                        className="h-8 rounded-md border bg-background px-2 text-sm"
                      />
                    ) : (
                      new Date(p.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={getExpiryStatus(p.expiryDate)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === p.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => saveEdit(p.id)} className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90">Save</button>
                        <button onClick={cancelEdit} className="rounded-md border border-input px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => startEdit(p)} className="rounded-md border border-input px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted">Edit</button>
                        <button onClick={() => removeProduct(p.id)} className="rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
