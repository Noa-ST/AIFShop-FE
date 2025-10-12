import React, { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, register as apiRegister } from "@/lib/api";
import api from "@/lib/api";

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
  role?: Role;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  initialized: boolean;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // initialize from localStorage if token exists
    const token = localStorage.getItem(ACCESS_KEY);
    const role = (localStorage.getItem("aifshop_role") as Role) || null;
    const email = localStorage.getItem("aifshop_email");
    const fullname = localStorage.getItem("aifshop_fullname");
    const id = localStorage.getItem("aifshop_userid");

    const tryRefresh = async (refreshToken: string) => {
      const candidates = ["/api/auth/refresh", "/api/Authencation/refresh", "/api/Auth/refresh"];
      let lastErr: any = null;
      for (const path of candidates) {
        try {
          const resp = await api.post(path, { refreshToken });
          const { accessToken, refreshToken: newRefresh, role: newRole, fullname: newFullname, email: newEmail, id: newId, userId } = resp.data;
          if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
          if (newRefresh) localStorage.setItem(REFRESH_KEY, newRefresh);
          if (newRole) localStorage.setItem("aifshop_role", newRole);
          if (newEmail) localStorage.setItem("aifshop_email", newEmail);
          if (newFullname) localStorage.setItem("aifshop_fullname", newFullname);
          const finalId = newId || userId || id;
          if (finalId) localStorage.setItem("aifshop_userid", finalId);

          const finalRole = (newRole as Role) || role || "Customer";
          const finalEmail = newEmail || email || "";
          const finalFullname = newFullname || fullname || undefined;
          const finalUserId = finalId || id || undefined;

          setUser({ id: finalUserId, email: finalEmail, fullname: finalFullname, role: finalRole });
          return true;
        } catch (err) {
          lastErr = err;
          continue;
        }
      }

      console.warn("Refresh token failed for all endpoints:", lastErr);
      // clear tokens
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem("aifshop_role");
      localStorage.removeItem("aifshop_email");
      localStorage.removeItem("aifshop_fullname");
      localStorage.removeItem("aifshop_userid");
      return false;
    };

    (async () => {
      if (token && role && email) {
        setUser({ id: id || undefined, email, fullname: fullname || undefined, role });
        setInitialized(true);
        return;
      }

      const refresh = localStorage.getItem(REFRESH_KEY);
      if (refresh) {
        const ok = await tryRefresh(refresh);
        setInitialized(true);
        return;
      }

      // no tokens
      setInitialized(true);
    })();
  }, []);

  const loginUser = async (payload: LoginPayload) => {
    const res = await apiLogin(payload);
    // apiLogin stores tokens in localStorage already
    const role = (res.role as Role) || "Customer";
    const email = payload.email;
    const fullname = res.fullname || res.name || undefined;
    const id = (res.id || res.userId || res.user?.id || res?.data?.id) as
      | string
      | undefined;

    localStorage.setItem("aifshop_role", role);
    localStorage.setItem("aifshop_email", email);
    if (fullname) localStorage.setItem("aifshop_fullname", fullname);
    if (id) localStorage.setItem("aifshop_userid", id);

    setUser({ id: id || undefined, email, fullname, role });
    return res;
  };

  const logoutUser = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem("aifshop_refresh");
    localStorage.removeItem("aifshop_role");
    localStorage.removeItem("aifshop_email");
    localStorage.removeItem("aifshop_fullname");
    localStorage.removeItem("aifshop_userid");
    setUser(null);
    // Redirect to homepage when logging out. AuthProvider sits outside Router,
    // so use a hard redirect to ensure navigation works in all cases.
    try {
      window.location.href = "/";
    } catch (e) {
      // Fallback: in non-browser environments do nothing
      console.warn("Redirect to home failed:", e);
    }
  };

  const registerUser = async (payload: RegisterPayload) => {
    const res = await apiRegister(payload as any);
    return res;
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
