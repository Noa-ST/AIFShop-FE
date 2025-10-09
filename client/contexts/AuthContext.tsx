import React, { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, register as apiRegister } from "@/lib/api";

type Role = "Customer" | "Seller" | "Admin";

type AuthUser = {
  id?: string;
  email: string;
  fullname?: string;
  role: Role;
};

type LoginPayload = { email: string; password: string };
type RegisterPayload = { fullname: string; email: string; password: string; confirmPassword: string; role?: Role };

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginUser: (payload: LoginPayload) => Promise<any>;
  logoutUser: () => void;
  registerUser: (payload: RegisterPayload) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const ACCESS_KEY = "aifshop_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // initialize from localStorage if token exists
    const token = localStorage.getItem(ACCESS_KEY);
    const role = (localStorage.getItem("aifshop_role") as Role) || null;
    const email = localStorage.getItem("aifshop_email");
    const fullname = localStorage.getItem("aifshop_fullname");
    if (token && role && email) {
      setUser({ email, fullname: fullname || undefined, role });
    }
  }, []);

  const loginUser = async (payload: LoginPayload) => {
    const res = await apiLogin(payload);
    // apiLogin stores tokens in localStorage already
    const role = (res.role as Role) || "Customer";
    const email = payload.email;
    const fullname = res.fullname || res.name || undefined;
    localStorage.setItem("aifshop_role", role);
    localStorage.setItem("aifshop_email", email);
    if (fullname) localStorage.setItem("aifshop_fullname", fullname);
    setUser({ email, fullname, role });
    return res;
  };

  const logoutUser = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem("aifshop_refresh");
    localStorage.removeItem("aifshop_role");
    localStorage.removeItem("aifshop_email");
    localStorage.removeItem("aifshop_fullname");
    setUser(null);
    // optional: navigate to login handled by caller
  };

  const registerUser = async (payload: RegisterPayload) => {
    const res = await apiRegister(payload as any);
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loginUser, logoutUser, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
};
