import { Package, AlertTriangle, Clock, RotateCcw, CheckCircle } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useAuth } from "@/context/AuthContext";
import { getExpiryStatus, getDaysUntilExpiry, LOW_STOCK_THRESHOLD } from "@/lib/sampleData";
import SummaryCard from "@/components/SummaryCard";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function SupplierDashboard() {
  const { user } = useAuth();
  const { products } = useProducts();

  const sendProductActionNotification = async (productId: string, action: "restock" | "acknowledge", productName: string) => {
    if (!user?.token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/product-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ productId, action }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Failed to send notification");
      }

      if (action === "restock") {
        toast.success(`Restock update sent to shopkeeper for ${productName}`);
      } else {
        toast.success(`Acknowledgement sent to shopkeeper for ${productName}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send notification");
    }
  };

  // Supplier sees all products (simulated — in real app, filtered by supplier)
  const supplied = products;
  const expiringIn7 = supplied.filter((p) => { const d = getDaysUntilExpiry(p.expiryDate); return d >= 0 && d <= 7; }).length;
  const lowStock = supplied.filter((p) => p.quantity <= LOW_STOCK_THRESHOLD).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Supplier Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {user?.name}. Monitor supplied products.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Products Supplied" value={supplied.length} icon={Package} />
        <SummaryCard title="Expiring in 7 Days" value={expiringIn7} icon={Clock} variant="warning" />
        <SummaryCard title="Low Stock Alerts" value={lowStock} icon={AlertTriangle} variant="danger" />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Shop</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {supplied.map((p) => {
              const status = getExpiryStatus(p.expiryDate);
              const isLow = p.quantity <= LOW_STOCK_THRESHOLD;
              const statusLabel = isLow ? "Low Stock" : status === "expired" ? "Expired" : status === "warning" ? "Near Expiry" : "Good";
              const statusClass = isLow || status === "expired" ? "status-danger" : status === "warning" ? "status-warning" : "status-good";
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-card-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.createdByName || "SmartShelf Store"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.createdByPhone || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>{statusLabel}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => sendProductActionNotification(p.id, "restock", p.name)} className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                      <RotateCcw className="h-3 w-3" /> Restock
                    </button>
                    <button onClick={() => sendProductActionNotification(p.id, "acknowledge", p.name)} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                      <CheckCircle className="h-3 w-3" /> Acknowledge
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
