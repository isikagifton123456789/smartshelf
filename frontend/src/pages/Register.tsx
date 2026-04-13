import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, ShieldCheck } from "lucide-react";
import { useAuth, UserRole } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [role, setRole] = useState<UserRole>("shopkeeper");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const ok = await register(form.name.trim(), form.email.trim(), form.password, role);
    if (ok) {
      toast.success("Account created! Welcome to SmartShelf.");
      navigate("/");
    } else {
      toast.error("Could not create account. This email may already be in use.");
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors[field] ? "border-destructive" : "border-input"}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">Create Account</h1>
          <p className="text-muted-foreground">Join SmartShelf today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Full Name</label>
            <input className={inputClass("name")} placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Email</label>
            <input type="email" className={inputClass("email")} placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Password</label>
            <input type="password" className={inputClass("password")} placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Confirm Password</label>
            <input type="password" className={inputClass("confirmPassword")} placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
            {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Role</label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="shopkeeper">Shopkeeper</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <UserPlus className="h-4 w-4" /> Create Account
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
