import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, PackageCheck, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SummaryCard from "@/components/SummaryCard";
import { useAuth } from "@/context/AuthContext";
import { QUANTITY_UNITS, type QuantityUnit } from "@/lib/sampleData";

type OrderStatus = "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";

interface OrderItem {
  id: string;
  supplierId?: string | null;
  supplierName: string;
  productName: string;
  quantity: number;
  quantityUnit?: QuantityUnit;
  storeLocation: string;
  requestedDeliveryDate: string;
  notes?: string;
  status: OrderStatus;
  createdByName?: string;
  createdByPhone?: string;
  createdAt?: { seconds?: number } | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const statusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusClass: Record<OrderStatus, string> = {
  pending: "status-warning",
  confirmed: "status-good",
  in_transit: "bg-primary/10 text-primary",
  delivered: "status-good",
  cancelled: "status-danger",
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function formatCreatedAt(createdAt?: { seconds?: number } | null) {
  const seconds = createdAt?.seconds;
  if (!seconds) return "Now";
  return new Date(seconds * 1000).toLocaleString();
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    supplierName: "",
    productName: "",
    quantity: "",
    quantityUnit: "pcs" as QuantityUnit,
    storeLocation: "",
    requestedDeliveryDate: "",
    notes: "",
  });

  const loadOrders = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load orders");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;

    if (!form.supplierName || !form.productName || !form.quantity || !form.storeLocation || !form.requestedDeliveryDate) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!QUANTITY_UNITS.includes(form.quantityUnit)) {
      toast.error("Please choose a valid quantity unit");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          supplierName: form.supplierName,
          productName: form.productName,
          quantity: Number(form.quantity),
          quantityUnit: form.quantityUnit,
          storeLocation: form.storeLocation,
          requestedDeliveryDate: form.requestedDeliveryDate,
          notes: form.notes,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to create order");
      }

      toast.success("Order created successfully");
      setForm({
        supplierName: "",
        productName: "",
        quantity: "",
        quantityUnit: "pcs",
        storeLocation: "",
        requestedDeliveryDate: "",
        notes: "",
      });
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update status");
      }

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
      toast.success(`Order marked as ${statusLabel[nextStatus]}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const totals = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const inTransit = orders.filter((o) => o.status === "in_transit").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    return {
      total: orders.length,
      pending,
      inTransit,
      delivered,
    };
  }, [orders]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">CRM Orders & Delivery</h1>
          <p className="text-muted-foreground">
            {user?.role === "shopkeeper"
              ? "Create supplier orders, track delivery, and manage store goods flow"
              : "Manage incoming shop orders, delivery workflow, and confirmations"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Orders" value={totals.total} icon={ClipboardList} />
        <SummaryCard title="Pending" value={totals.pending} icon={PackageCheck} variant="warning" />
        <SummaryCard title="In Transit" value={totals.inTransit} icon={Truck} />
        <SummaryCard title="Delivered" value={totals.delivered} icon={CheckCircle2} variant="good" />
      </div>

      {user?.role === "shopkeeper" && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrder} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier Name *</label>
                <Input
                  value={form.supplierName}
                  onChange={(e) => setForm((prev) => ({ ...prev, supplierName: e.target.value }))}
                  placeholder="e.g. Acme Suppliers"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <Input
                  value={form.productName}
                  onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
                  placeholder="e.g. Rice 25kg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity *</label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    placeholder="e.g. 20"
                    className="col-span-2"
                  />
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.quantityUnit}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantityUnit: e.target.value as QuantityUnit }))}
                  >
                    {QUANTITY_UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Store Location *</label>
                <Input
                  value={form.storeLocation}
                  onChange={(e) => setForm((prev) => ({ ...prev, storeLocation: e.target.value }))}
                  placeholder="e.g. Main Street Branch"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Requested Delivery Date *</label>
                <Input
                  type="date"
                  value={form.requestedDeliveryDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, requestedDeliveryDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special delivery instructions"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Order"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{user?.role === "shopkeeper" ? "My Orders" : "Incoming Orders"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Qty</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Store</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Delivery Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-card-foreground">{order.productName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.supplierName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.quantity} {order.quantityUnit || "pcs"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.storeLocation}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(order.requestedDeliveryDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass[order.status]}`}>
                          {statusLabel[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatCreatedAt(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {user?.role === "supplier" && order.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "confirmed")}>Confirm</Button>
                          )}
                          {user?.role === "supplier" && order.status === "confirmed" && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "in_transit")}>Start Delivery</Button>
                          )}
                          {user?.role === "supplier" && order.status === "in_transit" && (
                            <Button size="sm" onClick={() => updateStatus(order.id, "delivered")}>Mark Delivered</Button>
                          )}
                          {user?.role === "shopkeeper" && ["pending", "confirmed"].includes(order.status) && (
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(order.id, "cancelled")}>Cancel</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
