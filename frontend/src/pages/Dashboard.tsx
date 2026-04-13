import { Package, AlertTriangle, Clock, PackageMinus } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { getExpiryStatus, getDaysUntilExpiry, LOW_STOCK_THRESHOLD } from "@/lib/sampleData";
import SummaryCard from "@/components/SummaryCard";
import ProductTable from "@/components/ProductTable";

export default function Dashboard() {
  const { products } = useProducts();

  const total = products.length;
  const expiringIn7 = products.filter((p) => { const d = getDaysUntilExpiry(p.expiryDate); return d >= 0 && d <= 7; }).length;
  const expiringTomorrow = products.filter((p) => getDaysUntilExpiry(p.expiryDate) === 1).length;
  const lowStock = products.filter((p) => p.quantity <= LOW_STOCK_THRESHOLD).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Monitor your inventory at a glance</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Products" value={total} icon={Package} />
        <SummaryCard title="Expiring in 7 Days" value={expiringIn7} icon={Clock} variant="warning" />
        <SummaryCard title="Expiring Tomorrow" value={expiringTomorrow} icon={AlertTriangle} variant="danger" />
        <SummaryCard title="Low Stock Items" value={lowStock} icon={PackageMinus} variant="danger" />
      </div>
      <ProductTable products={products} />
    </div>
  );
}
