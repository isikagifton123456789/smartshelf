export interface Product {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string;
  supplier: string;
}

const today = new Date();
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r.toISOString().split("T")[0];
};

export const initialProducts: Product[] = [
  { id: "1", name: "Amul Milk 1L", quantity: 24, expiryDate: addDays(today, 1), supplier: "Amul Distributors" },
  { id: "2", name: "Britannia Bread", quantity: 3, expiryDate: addDays(today, 2), supplier: "Britannia Foods" },
  { id: "3", name: "Parle-G Biscuits", quantity: 50, expiryDate: addDays(today, 30), supplier: "Parle Agro" },
  { id: "4", name: "Nestle Yogurt", quantity: 8, expiryDate: addDays(today, 5), supplier: "Nestle India" },
  { id: "5", name: "Tropicana Juice", quantity: 2, expiryDate: addDays(today, -1), supplier: "PepsiCo" },
  { id: "6", name: "Mother Dairy Paneer", quantity: 12, expiryDate: addDays(today, 3), supplier: "Mother Dairy" },
  { id: "7", name: "Haldiram Namkeen", quantity: 40, expiryDate: addDays(today, 90), supplier: "Haldiram's" },
  { id: "8", name: "Cadbury Dairy Milk", quantity: 60, expiryDate: addDays(today, 120), supplier: "Mondelez" },
  { id: "9", name: "Kissan Ketchup", quantity: 4, expiryDate: addDays(today, 15), supplier: "HUL" },
  { id: "10", name: "Fresh Chicken 1kg", quantity: 1, expiryDate: addDays(today, 0), supplier: "Local Farm" },
];

export function getExpiryStatus(expiryDate: string): "good" | "warning" | "expired" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "expired";
  if (diff <= 7) return "warning";
  return "good";
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const LOW_STOCK_THRESHOLD = 5;
