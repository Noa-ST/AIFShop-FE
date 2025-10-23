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
        if (!refreshToken) throw new Error("No refresh token available");

        let lastErr: any = null;

        // 1) Try path-based GET: /api/Authencation/refresh/{refreshToken}
        try {
          const resp = await axios.get(
            `${API_BASE}/api/Authencation/refresh/${encodeURIComponent(
              refreshToken,
            )}`,
          );
          const responseData = resp?.data?.data || resp?.data || {};
          const accessToken = responseData.accessToken || responseData.token;
          const newRefresh = responseData.refreshToken;
          if (accessToken) {
            localStorage.setItem(ACCESS_KEY, accessToken);
            if (newRefresh) localStorage.setItem(REFRESH_KEY, newRefresh);
            api.defaults.headers.common["Authorization"] =
              `Bearer ${accessToken}`;
            processQueue(null, accessToken);
            return api(originalRequest);
          }
        } catch (e) {
          lastErr = e;
        }
        throw lastErr || new Error("Refresh failed for all endpoints");
      } catch (e) {
        processQueue(e, null);
        // clear tokens and user info
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem("aifshop_role");
        localStorage.removeItem("aifshop_email");
        localStorage.removeItem("aifshop_fullname");
        localStorage.removeItem("aifshop_userid");

        // Only redirect to login if not already on login page and not in admin flow
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          const isOnLoginPage = currentPath === "/login";
          const isInAdminFlow = currentPath.startsWith("/admin");

          // Don't redirect if already on login page or if in admin flow (let AdminLayout handle it)
          if (!isOnLoginPage && !isInAdminFlow) {
            try {
              window.location.href = "/login";
            } catch (redirErr) {
              console.warn("Redirect to /login failed", redirErr);
            }
          }
        }

        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);

export const register = async (payload: any) => {
  const res = await api.post("/api/Authencation/create", payload);
  return res.data;
};

export const login = async (payload: any) => {
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

// Admin: Approve/Reject product moderation
export const approveProduct = async (id: string) => {
  const res = await api.put(`/api/Products/approve/${id}`);
  return res.data;
};

export const rejectProduct = async (id: string, rejectionReason?: string) => {
  const res = await api.put(`/api/Products/reject/${id}`, null, {
    params: rejectionReason ? { rejectionReason } : {},
  });
  return res.data;
};

// Soft delete product (seller/admin). Tries common endpoints with graceful fallback.
export const softDeleteProduct = async (id: string) => {
  try {
    // Common REST shape
    const res = await api.delete(`/api/Products/delete/${id}`);
    return res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    // Fallback to alternative verb/path some backends use
    if (status === 404 || status === 405) {
      const fallback = await api.put(`/api/Products/soft-delete/${id}`);
      return fallback.data;
    }
    throw err;
  }
};

export const fetchProductsByShop = async (shopId: string) => {
  const res = await api.get(`/api/Products/getbyshop/${shopId}`);
  return res.data;
};

export const createProduct = async (payload: any) => {
  const res = await api.post(`/api/Products/create`, payload);
  return res.data;
};

export const fetchShopById = async (id: string) => {
  const res = await api.get(`/api/Shops/get-single/${id}`);
  return res.data;
};

export const createShop = async (payload: any) => {
  const res = await api.post("/api/Shops/create", payload);
  return res.data;
};

export const updateShop = async (payload: any) => {
  if (payload?.id) {
    const res = await api.put(`/api/Shops/${payload.id}`, payload);
    return res.data;
  }
  throw new Error("Shop ID is required for update.");
};

export const fetchShopBySeller = async (sellerId: string) => {
  const path = `/api/Shops/seller/${sellerId}`;

  try {
    const res = await api.get(path);
    if (res && res.status === 200) {
      return res.data;
    }
    throw new Error("Shop not found for seller: " + sellerId);
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 400) {
      throw err;
    }
    throw err;
  }
};

// Utility: Normalize a variety of backend responses into a boolean: does the seller have a shop?
export const isShopPresent = (shop: any) => {
  if (!shop) return false;
  if (Array.isArray(shop)) return shop.length > 0;
  if (typeof shop === "boolean") return shop;
  if (typeof shop === "object") {
    return Boolean(
      shop.id ||
        shop._id ||
        shop.shopId ||
        shop.name ||
        (shop.name && shop.name.length),
    );
  }
  return false;
};
// Thêm hàm API cho Global Category (GC)

export const fetchGlobalCategories = async () => {
  // Gọi endpoint Admin để lấy toàn bộ danh mục dạng cây (nếu đã triển khai)
  const res = await api.get("/api/Admin/GlobalCategory/all");
  // Giả định BE trả về ServiceResponse<IEnumerable<GetGlobalCategory>>
  return res.data.data || [];
};

export const createGlobalCategory = async (payload: any) => {
  const res = await api.post("/api/Admin/GlobalCategory/add", payload);
  return res.data;
};

export const updateGlobalCategory = async (id: string, payload: any) => {
  const res = await api.put(`/api/Admin/GlobalCategory/update/${id}`, payload);
  return res.data;
};

export const deleteGlobalCategory = async (id: string) => {
  // API này là xóa mềm (soft delete)
  const res = await api.delete(`/api/Admin/GlobalCategory/delete/${id}`);
  return res.data;
};

export default api;
