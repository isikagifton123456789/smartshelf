import { Bell } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { getDaysUntilExpiry, LOW_STOCK_THRESHOLD } from "@/lib/sampleData";
import NotificationItem from "@/components/NotificationItem";

export default function Notifications() {
  const { products } = useProducts();

  const alerts: { type: "expiry" | "expired" | "lowStock"; message: string }[] = [];

  products.forEach((p) => {
    const days = getDaysUntilExpiry(p.expiryDate);
    if (days < 0) alerts.push({ type: "expired", message: `${p.name} has expired ${Math.abs(days)} day(s) ago. Remove from shelf immediately.` });
    else if (days === 0) alerts.push({ type: "expired", message: `${p.name} expires today! Take action now.` });
    else if (days <= 7) alerts.push({ type: "expiry", message: `${p.name} expires in ${days} day(s). Consider discounting or restocking.` });
    if (p.quantity <= LOW_STOCK_THRESHOLD) alerts.push({ type: "lowStock", message: `${p.name} is low on stock (${p.quantity} left). Reorder from ${p.supplier}.` });
  });

  alerts.sort((a, b) => {
    const order = { expired: 0, lowStock: 1, expiry: 2 };
    return order[a.type] - order[b.type];
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Notifications</h1>
          <p className="text-muted-foreground">{alerts.length} active alert{alerts.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      {alerts.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          All clear! No alerts at this time.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => <NotificationItem key={i} type={a.type} message={a.message} />)}
        </div>
      )}
    </div>
  );
}
