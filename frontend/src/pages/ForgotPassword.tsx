import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ShieldCheck, CheckCircle } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Failed to send reset link");
        return;
      }

      setSent(true);
    } catch {
      setError("Failed to send reset link");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">Reset Password</h1>
          <p className="text-muted-foreground">We'll send you a reset link</p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {sent ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle className="mx-auto h-12 w-12 text-primary" />
              <p className="font-medium text-card-foreground">Reset link sent!</p>
              <p className="text-sm text-muted-foreground">Check your inbox at <strong>{email}</strong> for a password reset link.</p>
              <Link to="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Email</label>
                <input type="email" className={`w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${error ? "border-destructive" : "border-input"}`} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
              </div>
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                <Mail className="h-4 w-4" /> Reset Password
              </button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">Back to Login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
