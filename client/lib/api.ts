import axiosClient, {
  ACCESS_TOKEN_STORAGE_KEY as ACCESS_KEY,
  REFRESH_TOKEN_STORAGE_KEY as REFRESH_KEY,
} from "@/services/axiosClient";
import { globalCategoryService } from "@/services/globalCategoryService";

const api = axiosClient;

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

  console.log("🔍 fetchShopBySeller called:", { sellerId, path });

  try {
    const res = await api.get(path);
    console.log("✅ fetchShopBySeller response:", res.status, res.data);

    if (res && res.status === 200) {
      return res.data;
    }
    throw new Error("Shop not found for seller: " + sellerId);
  } catch (err: any) {
    console.error("❌ fetchShopBySeller error:", {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      code: err.code,
    });

    if (err?.response?.status === 404 || err?.response?.status === 400) {
      throw err;
    }

    // ✅ Handle timeout and network errors
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      throw new Error("Request timeout. Vui lòng thử lại.");
    }

    if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
      throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối.");
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
  // Sử dụng service thay vì gọi API trực tiếp
  let raw: any[] = [];
  
  try {
    const response = await globalCategoryService.getAll(true);
    
    if (!response.succeeded || !response.data) {
      console.warn("Failed to fetch global categories:", response.message);
      // Tiếp tục thử fallback thay vì trả về rỗng ngay
      raw = [];
    }
    
    raw = response.data;
    if (!Array.isArray(raw)) {
      console.warn("Global categories data is not an array:", raw);
      raw = [];
    }
  } catch (error: any) {
    console.error("Error fetching global categories:", error);
    // Fallback: thử gọi API trực tiếp nếu service lỗi
    try {
      const res = await api.get("/api/GlobalCategory/all?includeChildren=true");
      raw = (res as any)?.data?.data ?? (res as any)?.data ?? [];
      if (!Array.isArray(raw)) return [];
    } catch (fallbackError) {
      console.error("Fallback API call also failed:", fallbackError);
      raw = [];
    }
  }

  // Nếu vẫn rỗng, thử cơ chế dự phòng: gọi theo parentId để xây cây
  if (!Array.isArray(raw) || raw.length === 0) {
    try {
      const rootsResp = await globalCategoryService.getByParentId(null);
      if (rootsResp?.succeeded && Array.isArray(rootsResp.data)) {
        const buildChildren = async (parentIds: string[]): Promise<Record<string, any[]>> => {
          const map: Record<string, any[]> = {};
          for (const pid of parentIds) {
            try {
              const childrenResp = await globalCategoryService.getByParentId(pid);
              const children = childrenResp?.succeeded && Array.isArray(childrenResp.data)
                ? childrenResp.data
                : [];
              map[pid] = children;
            } catch (e) {
              map[pid] = [];
            }
          }
          return map;
        };

        // Xây cây sâu 2-3 lớp tùy vào dữ liệu; tránh gọi quá nhiều lần
        const roots = rootsResp.data.map(r => ({ ...r, children: [] as any[] }));
        const level1Map = await buildChildren(roots.map(r => r.id));
        for (const r of roots) {
          const children = level1Map[r.id] || [];
          (r as any).children = children.map((c: any) => ({ ...c, children: [] }));
        }

        const level2Ids: string[] = [];
        for (const r of roots) {
          for (const c of (r as any).children) level2Ids.push(c.id);
        }
        if (level2Ids.length) {
          const level2Map = await buildChildren(level2Ids);
          for (const r of roots) {
            for (const c of (r as any).children) {
              const gkids = level2Map[c.id] || [];
              (c as any).children = gkids.map((gc: any) => ({ ...gc, children: [] }));
            }
          }
        }

        raw = roots as any[];
      }
    } catch (parentFallbackErr) {
      console.warn("ParentId fallback fetching failed:", parentFallbackErr);
      // Nếu thất bại, trả về rỗng
      raw = [];
    }
  }

  if (!Array.isArray(raw) || raw.length === 0) return [];

  // 1) Flatten regardless of current shape (handles mixed tree/flat responses)
  type Node = {
    id: string;
    name: string;
    description?: string;
    parentId: string | null;
    createdAt?: string;
    productCount?: number;
  };
  const flat: Node[] = [];

  const getDirectProductCount = (node: any): number => {
    if (typeof node?.productCount === "number") return node.productCount;
    if (typeof node?.productsCount === "number") return node.productsCount;
    if (typeof node?.totalProducts === "number") return node.totalProducts;
    if (Array.isArray(node?.products)) return node.products.length;
    if (Array.isArray(node?.productList)) return node.productList.length;
    if (Array.isArray(node?.items)) return node.items.length;
    return 0;
  };

  const pushNode = (it: any, parentIdOverride: string | null = null) => {
    const id = String(it?.id ?? it?._id ?? "");
    if (!id) return;
    flat.push({
      id,
      name: it?.name ?? "",
      description: it?.description ?? "",
      parentId:
        parentIdOverride ?? (it?.parentId ?? it?.parent?.id ?? null)
          ? String(it?.parentId ?? it?.parent?.id)
          : null,
      createdAt: it?.createdAt ?? it?.created_at ?? "",
      productCount: getDirectProductCount(it),
    });
    const children = (it?.children ?? it?.subCategories ?? []) as any[];
    if (Array.isArray(children) && children.length) {
      for (const ch of children) pushNode(ch, id);
    }
  };

  for (const it of raw) pushNode(it, it?.parent ? String(it.parent.id) : null);

  // 2) Rebuild full tree from flat list
  const byId = new Map<string, any>();
  const roots: any[] = [];
  for (const it of flat) {
    byId.set(it.id, { ...it, children: [] as any[] });
  }
  for (const it of flat) {
    const node = byId.get(it.id);
    if (it.parentId && byId.has(it.parentId)) {
      const parentNode = byId.get(it.parentId);
      node.parent = parentNode; // provide parent for UI badges
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const computeTotals = (node: any): number => {
    const own = Number(node.productCount ?? 0) || 0;
    if (!Array.isArray(node.children) || node.children.length === 0) {
      node.totalProductCount = own;
      return node.totalProductCount;
    }
    const childSum = node.children.reduce((sum: number, child: any) => {
      return sum + computeTotals(child);
    }, 0);
    node.totalProductCount = own + childSum;
    return node.totalProductCount;
  };

  roots.forEach((root) => computeTotals(root));
  return roots;
};

// Re-export wrapper functions from the new service for backward compatibility
export const createGlobalCategory = async (payload: any) => {
  return await globalCategoryService.create(payload);
};

export const updateGlobalCategory = async (id: string, payload: any) => {
  return await globalCategoryService.update(id, payload);
};

export const deleteGlobalCategory = async (id: string) => {
  return await globalCategoryService.delete(id);
};

// Legacy implementations using old Admin endpoints (for fallback)
export const createGlobalCategoryLegacy = async (payload: any) => {
  const res = await api.post("/api/Admin/GlobalCategory/add", payload);
  return res.data;
};

export const updateGlobalCategoryLegacy = async (id: string, payload: any) => {
  const res = await api.put(`/api/Admin/GlobalCategory/update/${id}`, payload);
  return res.data;
};

export const deleteGlobalCategoryLegacy = async (id: string) => {
  const res = await api.delete(`/api/Admin/GlobalCategory/delete/${id}`);
  return res.data;
};

// Shop List API functions
export const fetchAllActiveShops = async () => {
  const res = await api.get("/api/Shops/getall-active");
  return res.data;
};

export const fetchShopDetail = async (id: string) => {
  const res = await api.get(`/api/Shops/get-single/${id}`);
  return res.data;
};

export default api;

// -----------------------------
// Cart APIs (Authorized)
// -----------------------------
export type CartAddPayload = { productId: string; quantity: number };
export type CartUpdatePayload = { productId: string; quantity: number };

export const fetchCart = async () => {
  const res = await api.get(`/api/Cart`);
  // Normalize common API envelope shapes so callers can be simple
  const root = (res as any)?.data?.data ?? (res as any)?.data;
  if (!root) return [] as any[];
  return (root.items ?? root.cartItems ?? root) as any;
};

export const addToCart = async (payload: CartAddPayload) => {
  const res = await api.post(`/api/Cart/add`, payload);
  return res.data;
};

export const updateCartItem = async (payload: CartUpdatePayload) => {
  const res = await api.put(`/api/Cart/update`, payload);
  return res.data;
};

export const deleteCartItem = async (productId: string) => {
  const res = await api.delete(`/api/Cart/deleteItem/${productId}`);
  return res.data;
};

// -----------------------------
// Address Book APIs (Authorized)
// Note: graceful fallbacks to localStorage for demo/dev without BE
// -----------------------------
export type Address = {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  addressLine: string;
  isDefault?: boolean;
};

export type AddressCreatePayload = Omit<Address, "id">;

const ADDRESS_LS_KEY = "aifshop_addresses";

function readLocalAddresses(): Address[] {
  try {
    const raw = localStorage.getItem(ADDRESS_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Address[]) : [];
  } catch {
    return [];
  }
}

function writeLocalAddresses(addresses: Address[]) {
  try {
    localStorage.setItem(ADDRESS_LS_KEY, JSON.stringify(addresses));
  } catch {}
}

export const fetchAddresses = async (): Promise<Address[]> => {
  try {
    const res = await api.get(`/api/Address/list`);
    const root = (res as any)?.data?.data ?? (res as any)?.data ?? [];
    const list = (root.items ?? root.addresses ?? root) as any[];
    if (!Array.isArray(list)) return [];
    // Normalize keys
    return list.map(
      (it: any): Address => ({
        id: String(it.id ?? it._id ?? it.addressId ?? Date.now()),
        fullName: it.fullName ?? it.name ?? it.receiverName ?? "",
        phone: it.phone ?? it.phoneNumber ?? "",
        province: it.province ?? it.city ?? it.cityProvince ?? "",
        district: it.district ?? it.county ?? "",
        ward: it.ward ?? it.subdistrict ?? "",
        addressLine: it.addressLine ?? it.street ?? it.address ?? "",
        isDefault: Boolean(
          it.isDefault ?? it.defaultAddress ?? it.isPrimary ?? false,
        ),
      }),
    );
  } catch {
    return readLocalAddresses();
  }
};

export const createAddress = async (
  payload: AddressCreatePayload,
): Promise<Address> => {
  try {
    const res = await api.post(`/api/Address/create`, payload);
    const data = (res as any)?.data?.data ?? (res as any)?.data ?? payload;
    const id = String(data.id ?? data._id ?? data.addressId ?? Date.now());
    return { ...payload, id } as Address;
  } catch {
    // Fallback to localStorage persistence in dev
    const current = readLocalAddresses();
    const next: Address = { ...payload, id: String(Date.now()) };
    if (next.isDefault) {
      for (const a of current) a.isDefault = false;
    }
    current.unshift(next);
    writeLocalAddresses(current);
    return next;
  }
};

export const updateAddress = async (
  id: string,
  payload: AddressCreatePayload,
): Promise<Address> => {
  try {
    const res = await api.put(`/api/Address/update/${id}`, payload);
    const data = (res as any)?.data?.data ?? (res as any)?.data ?? payload;
    return {
      id: String(data.id ?? id),
      fullName: data.fullName ?? payload.fullName,
      phone: data.phone ?? payload.phone,
      province: data.province ?? payload.province,
      district: data.district ?? payload.district,
      ward: data.ward ?? payload.ward,
      addressLine: data.addressLine ?? payload.addressLine,
      isDefault: Boolean(data.isDefault ?? payload.isDefault),
    };
  } catch {
    const current = readLocalAddresses();
    const idx = current.findIndex((a) => a.id === id);
    if (idx >= 0) {
      const updated: Address = { ...current[idx], ...payload, id };
      if (updated.isDefault) {
        for (const a of current) a.isDefault = false;
      }
      current[idx] = updated;
      writeLocalAddresses(current);
      return updated;
    }
    const next: Address = { ...payload, id };
    current.unshift(next);
    writeLocalAddresses(current);
    return next;
  }
};

export const deleteAddress = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/Address/delete/${id}`);
  } catch {
    const current = readLocalAddresses().filter((a) => a.id !== id);
    writeLocalAddresses(current);
  }
};
