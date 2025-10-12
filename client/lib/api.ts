import axios from "axios";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) || "https://localhost:7109";

const ACCESS_KEY = "aifshop_token";
const REFRESH_KEY = "aifshop_refresh";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) {
    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else if (config.headers) {
      (config.headers as Record<string, string>)["Authorization"] =
        `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (val?: any) => void;
  reject: (err?: any) => void;
  config: any;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (
      err.response &&
      err.response.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject, config: originalRequest });
        })
          .then(() => api(originalRequest))
          .catch((e) => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      try {
        const resp = await axios.post(`${API_BASE}/api/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefresh } = resp.data;
        localStorage.setItem(ACCESS_KEY, accessToken);
        if (newRefresh) localStorage.setItem(REFRESH_KEY, newRefresh);
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);

export const register = async (payload: {
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
}) => {
  const res = await api.post("/api/Authencation/create", payload);
  return res.data;
};

export const login = async (payload: { email: string; password: string }) => {
  const res = await api.post("/api/Authencation/login", payload);
  const { accessToken, refreshToken, role } = res.data;
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  return res.data;
};

export const logout = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export const fetchProducts = async () => {
  const res = await api.get("/api/Products/all");
  return res.data;
};

export const fetchProductById = async (id: string) => {
  const res = await api.get(`/api/Products/detail/${id}`);
  return res.data;
};

export const fetchShopById = async (id: string) => {
  const res = await api.get(`/api/Shops/get-single/${id}`);
  return res.data;
};

export const fetchProductsByShop = async (shopId: string) => {
  const res = await api.get(`/api/Products/getbyshop/${shopId}`);
  return res.data;
};

export const fetchShopBySeller = async (sellerId: string) => {
  // Try several common backend endpoint shapes to be resilient across different APIs
  const candidates = [
    `/api/Shops/get-by-seller/${sellerId}`,
    `/api/Shops/seller/${sellerId}`,
    `/api/shops/seller/${sellerId}`,
    `/api/Shops/by-seller/${sellerId}`,
    `/api/Shops/get-single-by-seller/${sellerId}`,
    `/api/Shops/getbyseller/${sellerId}`,
    `/api/Shops/get-by-seller?sellerId=${sellerId}`,
    `/api/Shops?sellerId=${sellerId}`,
  ];

  let lastError: any = null;
  for (const path of candidates) {
    try {
      const res = await api.get(path);
      // If API returns 200 but empty body, return it (caller will interpret)
      if (res && (res.status === 200 || res.status === 201)) {
        return res.data;
      }
    } catch (err: any) {
      lastError = err;
      // If 404, try next candidate
      if (err?.response?.status === 404) continue;
      // For other errors (network, 5xx), keep trying other endpoints but remember lastError
      continue;
    }
  }

  // If none matched, throw the last error or a generic not found
  if (lastError) throw lastError;
  throw new Error("Shop not found for seller: " + sellerId);
};

// Utility: Normalize a variety of backend responses into a boolean: does the seller have a shop?
export const isShopPresent = (shop: any) => {
  if (!shop) return false;
  // If backend returns an array of shops
  if (Array.isArray(shop)) return shop.length > 0;
  // If backend returns a boolean flag
  if (typeof shop === "boolean") return shop;
  // If backend returns an object with common identifiers
  if (typeof shop === "object") {
    return Boolean(
      shop.id || shop._id || shop.shopId || shop.name || shop.name?.length
    );
  }
  return false;
};

export const createShop = async (payload: {
  name: string;
  description?: string;
  logo?: string;
  sellerId?: string;
}) => {
  const res = await api.post("/api/Shops/create", payload);
  return res.data;
};

export default api;
