import axios from "axios";

const DEFAULT_BASE_URL = "https://aifshop-backend.onrender.com";

export const ACCESS_TOKEN_STORAGE_KEY = "aifshop_token";
export const REFRESH_TOKEN_STORAGE_KEY = "aifshop_refresh";

const resolveBaseURL = () => {
  const env = (import.meta as any)?.env ?? {};
  const envBaseUrl = env?.VITE_API_BASE_URL || env?.VITE_API_BASE;

  // Robust dev detection: env.DEV, env.MODE, or localhost:5173
  const isDevEnv = Boolean(
    env?.DEV === true ||
      env?.MODE === "development" ||
      (typeof window !== "undefined" &&
        /localhost|127\.0\.0\.1/.test(window.location.hostname)),
  );

  // In development: respect env override if provided; otherwise use relative for proxy
  if (isDevEnv) {
    if (typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0) {
      return envBaseUrl.trim();
    }
    // Empty baseURL makes axios use relative paths and Vite proxy will forward /api
    return "";
  }

  // In production: prefer env, fallback to default
  if (typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0) {
    return envBaseUrl.trim();
  }
  return DEFAULT_BASE_URL;
};

const axiosClient = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // ✅ Add 30 second timeout to prevent infinite loading
});

// Debug: log axios baseURL and env in dev to verify proxy/absolute usage
if (typeof window !== "undefined") {
  const base = axiosClient.defaults.baseURL;
  const env = (import.meta as any)?.env ?? {};
  const isDevEnv = Boolean(
    env?.DEV === true ||
      env?.MODE === "development" ||
      /localhost|127\.0\.0\.1/.test(window.location.hostname),
  );
  console.info(
    "[AIFShop] Axios baseURL:",
    base || "<empty>",
    "DEV:",
    String(isDevEnv),
  );
}

axiosClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (token) {
    if (config.headers && typeof (config.headers as any).set === "function") {
      (config.headers as any).set("Authorization", `Bearer ${token}`);
    } else if (config.headers) {
      (config.headers as Record<string, string>)["Authorization"] =
        `Bearer ${token}`;
    } else {
      config.headers = { Authorization: `Bearer ${token}` } as any;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
  config: any;
}> = [];

const API_BASE = axiosClient.defaults.baseURL ?? DEFAULT_BASE_URL;

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token ?? undefined);
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest?._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        })
          .then(() => axiosClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken =
        typeof window !== "undefined"
          ? window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
          : null;

      try {
        if (!refreshToken) throw new Error("No refresh token available");

        let lastErr: unknown = null;

        try {
          const refreshed = await axios.get(
            `${API_BASE}/api/Authencation/refresh/${encodeURIComponent(
              refreshToken,
            )}`,
          );

          const responseData = refreshed?.data?.data ?? refreshed?.data ?? {};
          const accessToken = responseData.accessToken || responseData.token;
          const newRefreshToken = responseData.refreshToken;

          if (accessToken) {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                ACCESS_TOKEN_STORAGE_KEY,
                accessToken,
              );
              if (newRefreshToken) {
                window.localStorage.setItem(
                  REFRESH_TOKEN_STORAGE_KEY,
                  newRefreshToken,
                );
              }
            }

            axiosClient.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${accessToken}`;
            processQueue(null, accessToken);
            return axiosClient(originalRequest);
          }
        } catch (refreshErr) {
          lastErr = refreshErr;
        }

        throw lastErr || new Error("Refresh failed for all endpoints");
      } catch (refreshError) {
        processQueue(refreshError, null);

        if (typeof window !== "undefined") {
          window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
          window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
          window.localStorage.removeItem("aifshop_role");
          window.localStorage.removeItem("aifshop_email");
          window.localStorage.removeItem("aifshop_fullname");
          window.localStorage.removeItem("aifshop_userid");

          const currentPath = window.location.pathname;
          const isOnLoginPage = currentPath === "/login";
          const isInAdminFlow = currentPath.startsWith("/admin");
          if (!isOnLoginPage && !isInAdminFlow) {
            try {
              window.location.href = "/login";
            } catch (redirectError) {
              console.warn("Redirect to /login failed", redirectError);
            }
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;

