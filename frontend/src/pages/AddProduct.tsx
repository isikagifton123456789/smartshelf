import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackagePlus } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { toast } from "sonner";

export default function AddProduct() {
  const { addProduct } = useProducts();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", quantity: "", expiryDate: "", supplier: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = "Valid quantity is required";
    if (!form.expiryDate) e.expiryDate = "Expiry date is required";
    if (!form.supplier.trim()) e.supplier = "Supplier name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await addProduct({ name: form.name.trim(), quantity: Number(form.quantity), expiryDate: form.expiryDate, supplier: form.supplier.trim() });
      toast.success("Product added successfully!");
      navigate("/");
    } catch {
      toast.error("Failed to add product. Please try again.");
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors[field] ? "border-status-danger" : "border-input"}`;

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-foreground">Add Product</h1>
        <p className="text-muted-foreground">Add a new product to your inventory</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-card p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">Product Name</label>
          <input className={inputClass("name")} placeholder="e.g. Amul Milk 1L" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <p className="mt-1 text-xs text-status-danger">{errors.name}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">Quantity</label>
          <input type="number" min="1" className={inputClass("quantity")} placeholder="e.g. 24" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          {errors.quantity && <p className="mt-1 text-xs text-status-danger">{errors.quantity}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">Expiry Date</label>
          <input type="date" className={inputClass("expiryDate")} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          {errors.expiryDate && <p className="mt-1 text-xs text-status-danger">{errors.expiryDate}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">Supplier Name</label>
          <input className={inputClass("supplier")} placeholder="e.g. Amul Distributors" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          {errors.supplier && <p className="mt-1 text-xs text-status-danger">{errors.supplier}</p>}
        </div>
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring">
          <PackagePlus className="h-4 w-4" />
          Add Product
        </button>
      </form>
    </div>
  );
}
