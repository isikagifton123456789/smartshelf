import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type UserRole = "shopkeeper" | "supplier";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole, phoneNumber: string) => Promise<{ ok: boolean; message: string }>;
  googleAuth: (credential: string, role: UserRole, phoneNumber?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = "smartshelf-session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  }, [user]);

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      setUser({ ...data.user, token: data.token });
      return true;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole, phoneNumber: string): Promise<{ ok: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, phoneNumber }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          ok: false,
          message: data?.message || "Could not create account. Please try again.",
        };
      }

      if (data?.token && data?.user) {
        setUser({ ...data.user, token: data.token });
      } else {
        setUser(null);
      }
      return {
        ok: true,
        message: data?.message || "Account creation successful. Check your email to activate your account.",
      };
    } catch {
      return {
        ok: false,
        message: "Could not create account. Please try again.",
      };
    }
  }, []);

  const googleAuth = useCallback(async (credential: string, role: UserRole, phoneNumber?: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credential, role, phoneNumber }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      setUser({ ...data.user, token: data.token });
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, googleAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
