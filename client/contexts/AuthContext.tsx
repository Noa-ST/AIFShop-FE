import React, { createContext, useContext, useEffect, useState } from "react";
import authService from "@/services/authService";
import axiosClient from "@/services/axiosClient";

type Role = "Customer" | "Seller" | "Admin";

type AuthUser = {
  id?: string;
  email: string;
  fullname?: string;
  role: Role;
};

type LoginPayload = { email: string; password: string };
type RegisterPayload = {
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: "Customer" | "Seller";
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  initialized: boolean;
  loginUser: (payload: LoginPayload) => Promise<any>;
  logoutUser: () => void | Promise<void>;
  registerUser: (payload: RegisterPayload) => Promise<any>;
  refreshUser?: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    console.warn(
      "useAuth called outside AuthProvider - returning safe defaults",
    );
    const noopAsync = async () => {
      throw new Error("AuthProvider is not mounted");
    };
    const noop = () => {};
    return {
      user: null,
      isAuthenticated: false,
      initialized: false,
      loginUser: noopAsync,
      logoutUser: noop,
      registerUser: noopAsync,
    } as AuthContextType;
  }
  return ctx;
};

// Storage keys are handled by authService, but we keep these for compatibility
const ACCESS_KEY = "aifshop_token";
const REFRESH_KEY = "aifshop_refresh";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize from localStorage if token exists
    const token = authService.getAccessToken();
    const role = (localStorage.getItem("aifshop_role") as Role) || null;
    const email = localStorage.getItem("aifshop_email");
    const fullname = localStorage.getItem("aifshop_fullname");
    const id = localStorage.getItem("aifshop_userid");

    (async () => {
      if (token && role && email) {
        setUser({
          id: id || undefined,
          email,
          fullname: fullname || undefined,
          role,
        });
        setInitialized(true);
        return;
      }

      // Try refresh token if available
      const refresh = authService.getRefreshToken();
      if (refresh) {
        try {
          const response = await authService.refreshToken();
          if (response.success) {
            const finalRole = (response.role as Role) || role || "Customer";
            const finalEmail = localStorage.getItem("aifshop_email") || email || "";
            const finalFullname = localStorage.getItem("aifshop_fullname") || fullname || undefined;
            const finalUserId = localStorage.getItem("aifshop_userid") || id || undefined;

            setUser({
              id: finalUserId,
              email: finalEmail,
              fullname: finalFullname,
              role: finalRole,
            });
          }
        } catch (error) {
          // Refresh failed - clear tokens
          authService.clearTokens();
          authService.clearUserInfo();
        }
      }

      setInitialized(true);
    })();
  }, []);

  const loginUser = async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    
    if (res.success) {
      const role = (res.role as Role) || "Customer";
      const email = payload.email;
      const fullname = res.fullname || res.name || undefined;
      const id = res.userId || res.id || undefined;

      setUser({ id, email, fullname, role });
    }
    
    return res;
  };

  const logoutUser = async () => {
    await authService.logout();
    setUser(null);
    
    // Redirect to homepage when logging out
    try {
      window.location.href = "/";
    } catch (e) {
      console.warn("Redirect to home failed:", e);
    }
  };

  const registerUser = async (payload: RegisterPayload) => {
    const res = await authService.createUser({
      email: payload.email,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      fullname: payload.fullname,
      role: payload.role || "Customer",
    });
    return res;
  };

  const refreshUser = async () => {
    try {
      const me = await authService.getCurrentUser();
      if (me) {
        const finalRole = (me.roles?.[0] as Role) || user?.role || "Customer";
        const updated: AuthUser = {
          id: me.id,
          email: me.email,
          fullname: me.fullName || user?.fullname,
          role: finalRole,
        };
        setUser(updated);
        // sync localStorage for header displays
        localStorage.setItem("aifshop_role", finalRole);
        localStorage.setItem("aifshop_email", me.email);
        if (me.fullName) localStorage.setItem("aifshop_fullname", me.fullName);
        localStorage.setItem("aifshop_userid", me.id);
      }
    } catch (e) {
      console.warn("refreshUser failed:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        initialized,
        loginUser,
        logoutUser,
      registerUser,
      refreshUser,
    }}
  >
            {children}   {" "}
  </AuthContext.Provider>
);
};
