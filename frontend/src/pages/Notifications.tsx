import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useAuth } from "@/context/AuthContext";
import { getDaysUntilExpiry, LOW_STOCK_THRESHOLD } from "@/lib/sampleData";
import NotificationItem from "@/components/NotificationItem";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface ServerNotification {
  id: string;
  title: string;
  message: string;
  isRead?: boolean;
  createdAt?: { seconds?: number } | null;
}

export default function Notifications() {
  const { user } = useAuth();
  const { products } = useProducts();
  const [serverNotifications, setServerNotifications] = useState<ServerNotification[]>([]);
  const [loadingServer, setLoadingServer] = useState(false);

  const alerts: { type: "expiry" | "expired" | "lowStock"; message: string }[] = [];

  products.forEach((p) => {
    const days = getDaysUntilExpiry(p.expiryDate);
    if (days < 0) alerts.push({ type: "expired", message: `${p.name} has expired ${Math.abs(days)} day(s) ago. Remove from shelf immediately.` });
    else if (days === 0) alerts.push({ type: "expired", message: `${p.name} expires today! Take action now.` });
    else if (days <= 7) alerts.push({ type: "expiry", message: `${p.name} expires in ${days} day(s). Consider discounting or restocking.` });
    if (p.quantity <= LOW_STOCK_THRESHOLD) alerts.push({ type: "lowStock", message: `${p.name} is low on stock (${p.quantity} ${p.quantityUnit || "pcs"} left). Reorder from ${p.supplier}.` });
  });

  alerts.sort((a, b) => {
    const order = { expired: 0, lowStock: 1, expiry: 2 };
    return order[a.type] - order[b.type];
  });

  const loadServerNotifications = async () => {
    if (!user?.token) return;

    setLoadingServer(true);
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load notifications");
      }

      setServerNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load notifications");
      setServerNotifications([]);
    } finally {
      setLoadingServer(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user?.token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Failed to mark notification as read");
      }

      setServerNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark notification as read");
    }
  };

  useEffect(() => {
    loadServerNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const unreadCount = useMemo(() => serverNotifications.filter((n) => !n.isRead).length, [serverNotifications]);
  const totalAlerts = alerts.length + serverNotifications.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {totalAlerts} notification{totalAlerts !== 1 ? "s" : ""} • {unreadCount} unread CRM update{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {loadingServer ? (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Loading CRM notifications...</div>
      ) : serverNotifications.length > 0 ? (
        <div className="space-y-3">
          {serverNotifications.map((n) => (
            <div key={n.id} className="space-y-2">
              <NotificationItem type="activity" message={`${n.title}: ${n.message}`} />
              {!n.isRead && (
                <div className="pl-2">
                  <Button size="sm" variant="outline" onClick={() => markAsRead(n.id)}>Mark as read</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {alerts.length === 0 && serverNotifications.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          All clear! No alerts at this time.
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((a, i) => <NotificationItem key={i} type={a.type} message={a.message} />)}
        </div>
      ) : null}
    </div>
  );
}
