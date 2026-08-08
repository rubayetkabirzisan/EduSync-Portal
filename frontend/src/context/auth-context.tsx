"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { LoginResponse, UserProfile } from "@/lib/types";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
    const profile: UserProfile = {
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(profile));
    setToken(data.token);
    setUser(profile);

    // Redirect based on role
    const dest = data.role === "Admin" ? "/admin" : data.role === "Teacher" ? "/teacher" : "/student";
    router.push(dest);
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
