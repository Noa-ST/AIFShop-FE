import axiosClient from "@/services/axiosClient";
import { getShopOrders } from "@/services/orders";
import type { OrderResponseDTO, OrderStatus } from "@/services/types";

// Types
export interface GetShop {
  id: string;
  sellerId: string;
  sellerName: string | null;
  name: string;
  description: string | null;
  logo: string | null;
  street: string;
  city: string;
  country: string | null;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateShop {
  sellerId: string;
  name: string;
  description?: string;
  logo?: string;
  street: string;
  city: string;
  country?: string;
}

export interface UpdateShop {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  street: string;
  city: string;
  country?: string;
}

export interface ShopFilterDto {
  page?: number;
  pageSize?: number;
  keyword?: string;
  city?: string;
  country?: string;
  minRating?: number;
  maxRating?: number;
  sortBy?: string; // "createdAt" | "name" | "rating" | "city" | "updatedAt"
  sortOrder?: string; // "asc" | "desc"
}

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ServiceResponse<T = any> {
  succeeded: boolean;
  message: string;
  data?: T;
  statusCode?: number;
}

export interface RevenueSummaryParams {
  from?: string; // ISO 8601, e.g. 2025-11-01
  to?: string; // ISO 8601, e.g. 2025-11-10
  groupBy?: "day" | "week";
  onlyPaid?: boolean;
  status?: string; // e.g. "Delivered"
  paymentMethod?: string[]; // e.g. ["Bank","Wallet"]
}

export interface RevenueSummaryData {
  totalRevenue: number;
  byMethod: {
    cash: number;
    cod: number;
    bank: number;
    wallet: number;
  };
  orders: {
    totalOrders: number;
    paidOrders: number;
    refundedOrders: number;
  };
  aov: number;
  timeseries: Array<{
    date: string; // yyyy-MM-dd
    revenue: number;
    orders: number;
    paidOrders: number;
  }>;
}

class ShopService {
  // Get all active shops
  async getAllActive(): Promise<GetShop[]> {
    const response = await axiosClient.get("/api/Shops/getall-active");
    return response.data;
  }

  // Search and filter with pagination
  async searchAndFilter(filter: ShopFilterDto): Promise<PagedResult<GetShop>> {
    const params = new URLSearchParams();

    if (filter.page) params.append("page", filter.page.toString());
    if (filter.pageSize) params.append("pageSize", filter.pageSize.toString());
    if (filter.keyword) params.append("keyword", filter.keyword);
    if (filter.city) params.append("city", filter.city);
    if (filter.country) params.append("country", filter.country);
    if (filter.minRating !== undefined)
      params.append("minRating", filter.minRating.toString());
    if (filter.maxRating !== undefined)
      params.append("maxRating", filter.maxRating.toString());
    if (filter.sortBy) params.append("sortBy", filter.sortBy);
    if (filter.sortOrder) params.append("sortOrder", filter.sortOrder);

    const response = await axiosClient.get(
      `/api/Shops/search?${params.toString()}`,
    );
    return response.data;
  }

  // Get shop by seller ID
  async getBySellerId(sellerId: string): Promise<GetShop[]> {
    const response = await axiosClient.get(`/api/Shops/seller/${sellerId}`);
    return response.data;
  }

  // Get shop by ID
  async getById(id: string): Promise<GetShop | null> {
    try {
      const response = await axiosClient.get(`/api/Shops/get-single/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Create shop
  async create(shop: CreateShop): Promise<ServiceResponse> {
    const response = await axiosClient.post("/api/Shops/create", shop);
    return response.data;
  }

  // Update shop
  async update(id: string, shop: UpdateShop): Promise<ServiceResponse> {
    const response = await axiosClient.put(`/api/Shops/${id}`, shop);
    return response.data;
  }

  // Delete shop (soft delete)
  async delete(id: string): Promise<ServiceResponse> {
    const response = await axiosClient.delete(`/api/Shops/delete/${id}`);
    return response.data;
  }

  // Recalculate rating (Admin only)
  async recalculateRating(id: string): Promise<ServiceResponse> {
    const response = await axiosClient.post(
      `/api/Shops/${id}/recalculate-rating`,
    );
    return response.data;
  }

  // Get statistics (Admin only)
  async getStatistics(): Promise<ServiceResponse<any>> {
    const response = await axiosClient.get('/api/Shops/admin/statistics');
    return response.data;
  }

  async getFeatured(limit: number = 6, city?: string): Promise<GetShop[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      if (city) params.append('city', city);
      const resp = await axiosClient.get(`/api/Shops/featured?${params.toString()}`);
      return (resp.data?.data ?? resp.data) as GetShop[];
    } catch (e) {
      const all = await this.getAllActive();
      return (Array.isArray(all) ? all : []).slice(0, limit);
    }
  }

  async getRevenueSummary(
    shopId: string,
    params: RevenueSummaryParams = {},
  ): Promise<ServiceResponse<RevenueSummaryData>> {
    // Chuẩn hóa định dạng ngày: backend định nghĩa $date-time
    const normalizeDateTime = (
      s?: string,
      isEnd?: boolean,
    ): string | undefined => {
      if (!s) return undefined;
      // Nếu đã là dạng date-time thì dùng nguyên
      if (s.includes("T")) return s;
      // Nếu là yyyy-MM-dd thì chuyển sang đầu/cuối ngày (UTC)
      const dt = new Date(`${s}T${isEnd ? "23:59:59" : "00:00:00"}Z`);
      return dt.toISOString();
    };

    const buildQuery = (p: RevenueSummaryParams) => {
      const q = new URLSearchParams();
      const fromDT = normalizeDateTime(p.from, false);
      const toDT = normalizeDateTime(p.to, true);
      if (fromDT) q.append("from", fromDT);
      if (toDT) q.append("to", toDT);
      if (p.groupBy) q.append("groupBy", p.groupBy);
      if (typeof p.onlyPaid === "boolean")
        q.append("onlyPaid", String(p.onlyPaid));
      if (p.status) q.append("status", p.status);
      // Theo swagger: paymentMethod là array[string] -> lặp key nhiều lần
      if (Array.isArray(p.paymentMethod) && p.paymentMethod.length > 0) {
        p.paymentMethod.forEach((m) => q.append("paymentMethod", m));
      }
      return q.toString();
    };

    const defaultData: RevenueSummaryData = {
      totalRevenue: 0,
      byMethod: { cash: 0, cod: 0, bank: 0, wallet: 0 },
      orders: { totalOrders: 0, paidOrders: 0, refundedOrders: 0 },
      aov: 0,
      timeseries: [],
    };

    // Gọi đúng endpoint như swagger, kèm fallback chữ thường/phân biệt hoa-thường nếu server xử lý khác biệt
    const paths = [
      (q: string) => `/api/Shops/${shopId}/revenue/summary?${q}`,
      (q: string) => `/api/shops/${shopId}/revenue/summary?${q}`,
    ];

    let lastError: any = null;
    for (const buildPath of paths) {
      try {
        const qs = buildQuery(params);
        const url = buildPath(qs);
        const response = await axiosClient.get(url);
        return response.data;
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;
        if (status === 404 || status === 405 || status === 500) {
          continue;
        }
      }
    }

    // Fallback: compute revenue locally from shop orders when API fails
    try {
      const localData = await computeRevenueSummaryFromOrders(shopId, params);
      return {
        succeeded: true,
        message: "Computed locally due to upstream error",
        data: localData,
        statusCode: 200,
      };
    } catch (aggErr: any) {
      return {
        succeeded: false,
        message:
          lastError?.message ||
          aggErr?.message ||
          "Revenue summary unavailable",
        data: {
          totalRevenue: 0,
          byMethod: { cash: 0, cod: 0, bank: 0, wallet: 0 },
          orders: { totalOrders: 0, paidOrders: 0, refundedOrders: 0 },
          aov: 0,
          timeseries: [],
        },
        statusCode: lastError?.response?.status,
      };
    }
  }
}
export const shopService = new ShopService();
export default shopService;

// Helper: fetch all shop orders across pages respecting date and status filters
async function fetchAllShopOrders(
  shopId: string,
  params: RevenueSummaryParams,
): Promise<OrderResponseDTO[]> {
  const pageSize = 100;
  let page = 1;
  let hasNext = true;
  const all: OrderResponseDTO[] = [];

  while (hasNext) {
    const result = await getShopOrders(shopId, {
      page,
      pageSize,
      // Pass coarse filters to backend to reduce payload
      status: params.status as OrderStatus | undefined,
      startDate: params.from,
      endDate: params.to,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    all.push(...result.data);
    hasNext = result.hasNextPage;
    page += 1;
    // Safety cap to avoid infinite loops
    if (page > 50) break;
  }
  return all;
}

// Helper: format date yyyy-MM-dd
function formatDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Helper: week key as Monday's date (yyyy-MM-dd)
function startOfISOWeek(d: Date): Date {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // 1-7, Monday=1
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  return date;
}

// Map payment method enum to summary keys
function paymentKey(method?: string): keyof RevenueSummaryData["byMethod"] {
  switch (method) {
    case "COD":
      return "cod";
    case "Wallet":
      return "wallet";
    case "Bank":
      return "bank";
    case "Cash":
      return "cash";
    default:
      return "cash";
  }
}

// Main aggregator: compute summary from orders list
async function computeRevenueSummaryFromOrders(
  shopId: string,
  params: RevenueSummaryParams,
): Promise<RevenueSummaryData> {
  const orders = await fetchAllShopOrders(shopId, params);

  // Client-side filters
  const fromDate = params.from ? new Date(params.from) : undefined;
  const toDate = params.to ? new Date(params.to) : undefined;
  const methods = Array.isArray(params.paymentMethod)
    ? params.paymentMethod
    : undefined;

  const filtered = orders.filter((o) => {
    const created = new Date(o.createdAt);
    const inFrom = fromDate ? created >= fromDate : true;
    const inTo = toDate ? created <= toDate : true;
    const statusOk = params.status ? o.status === params.status : true;
    const paidOk =
      typeof params.onlyPaid === "boolean"
        ? (o.isPaid ?? o.paymentStatus === "Paid") === params.onlyPaid
        : true;
    const methodOk =
      methods && methods.length ? methods.includes(o.paymentMethod) : true;
    return inFrom && inTo && statusOk && paidOk && methodOk;
  });

  const byMethod = { cash: 0, cod: 0, bank: 0, wallet: 0 };
  let totalRevenue = 0;
  let totalOrders = filtered.length;
  let paidOrders = filtered.filter(
    (o) => o.isPaid ?? o.paymentStatus === "Paid",
  ).length;
  let refundedOrders = filtered.filter(
    (o) => o.paymentStatus === "Failed" || o.status === "Canceled",
  ).length;

  // Timeseries buckets
  const buckets: Record<
    string,
    { revenue: number; orders: number; paidOrders: number }
  > = {};
  const groupBy = params.groupBy === "week" ? "week" : "day";

  for (const o of filtered) {
    const amount = Number(o.totalAmount) || 0;
    totalRevenue += amount;
    const key = paymentKey(o.paymentMethod);
    byMethod[key] += amount;

    const created = new Date(o.createdAt);
    const bucketDate =
      groupBy === "week" ? startOfISOWeek(created) : new Date(created);
    const dayKey = formatDay(bucketDate);

    if (!buckets[dayKey])
      buckets[dayKey] = { revenue: 0, orders: 0, paidOrders: 0 };
    buckets[dayKey].revenue += amount;
    buckets[dayKey].orders += 1;
    if (o.isPaid ?? o.paymentStatus === "Paid") buckets[dayKey].paidOrders += 1;
  }

  // Sort keys ascending
  const dates = Object.keys(buckets).sort();

  const timeseries = dates.map((date) => ({
    date,
    revenue: buckets[date].revenue,
    orders: buckets[date].orders,
    paidOrders: buckets[date].paidOrders,
  }));

  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalRevenue,
    byMethod,
    orders: { totalOrders, paidOrders, refundedOrders },
    aov,
    timeseries,
  };
}
