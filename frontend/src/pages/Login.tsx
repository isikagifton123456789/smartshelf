import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth, UserRole } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const { login, googleAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [role, setRole] = useState<UserRole>("shopkeeper");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const ok = await login(form.email.trim(), form.password, role);
    if (ok) {
      toast.success("Welcome back!");
      navigate("/");
    } else {
      toast.error("Invalid credentials or role. Please try again.");
    }
  };

  const handleGoogleSuccess = async (credential?: string) => {
    if (!credential) {
      toast.error("Google authentication failed.");
      return;
    }

    const ok = await googleAuth(credential, role);
    if (ok) {
      toast.success("Logged in with Google");
      navigate("/");
    } else {
      toast.error("Google login failed or role mismatch.");
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
          <h1 className="text-2xl font-bold font-display text-foreground">Welcome to SmartShelf</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-card p-6 shadow-sm">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Email</label>
            <input type="email" className={inputClass("email")} placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Password</label>
            <input type="password" className={inputClass("password")} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Role</label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="shopkeeper">Shopkeeper</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <LogIn className="h-4 w-4" /> Login
          </button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(response) => handleGoogleSuccess(response.credential)}
              onError={() => toast.error("Google authentication failed.")}
              theme="outline"
              size="large"
              shape="pill"
              text="signin_with"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">Forgot Password?</Link>
            <Link to="/register" className="text-primary hover:underline">Create Account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
