import { useAuth } from "@/context/AuthContext";
import Dashboard from "./Dashboard";
import SupplierDashboard from "./SupplierDashboard";

export default function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === "supplier") return <SupplierDashboard />;
  return <Dashboard />;
}
