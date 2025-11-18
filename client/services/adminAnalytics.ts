import axiosClient from "./axiosClient";

export interface AdminOverview {
  totals: {
    users: number;
    products: number;
    globalCategories: number;
    revenue: number; // ví dụ "$12,345" hoặc số; tuỳ API
  };
  changes: {
    users: string;             // ví dụ "+12% từ tháng trước"
    products: string;
    globalCategories: string;  // ví dụ "+2 từ tháng trước"
    revenue: string;           // ví dụ "+15% từ tháng trước"
  };
}

export interface RecentActivity {
  id: number | string;
  action: string; // mô tả ngắn tiếng Việt
  time: string;   // "2 phút trước"...
  type?: "user" | "product" | "category" | "order" | string;
}

// Time series point for charts
export interface AdminTimeseriesPoint {
  date: string; // ISO date string (yyyy-MM-dd)
  orders?: number;
  revenue?: number;
  users?: number;
  products?: number;
  avgRating?: number; // trung bình đánh giá theo ngày (0-5)
}

export interface AdminAlerts {
  longPendingOrders: number; // số đơn pending quá ngưỡng thời gian
  productsWaitingApproval: number; // số sản phẩm chờ duyệt
}

export type TimeRangePreset = "7d" | "30d" | "custom";

export interface TimeseriesQuery {
  from: string; // ISO date
  to: string;   // ISO date
  granularity?: "day" | "week";
}

async function getOverview(): Promise<AdminOverview> {
  const { data } = await axiosClient.get("/api/Admin/analytics/overview");
  const raw: any = data ?? {};
  return {
    totals: {
      users: raw?.totals?.users ?? raw?.users ?? 0,
      products: raw?.totals?.products ?? raw?.products ?? 0,
      globalCategories:
        raw?.totals?.globalCategories ?? raw?.globalCategories ?? 0,
      revenue: raw?.totals?.revenue ?? raw?.revenue ?? 0,
    },
    changes: {
      users: raw?.changes?.users ?? "",
      products: raw?.changes?.products ?? "",
      globalCategories: raw?.changes?.globalCategories ?? "",
      revenue: raw?.changes?.revenue ?? "",
    },
  };
}

async function getRecentActivities(): Promise<RecentActivity[]> {
  const { data } = await axiosClient.get(
    "/api/Admin/analytics/activities?limit=5",
  );
  const items: any[] = Array.isArray(data) ? data : [];
  return items.map((it) => ({
    id:
      it?.id ??
      it?.orderId ??
      it?.productId ??
      it?.reviewId ??
      it?.paymentId ??
      it?.shopId ??
      Math.random(),
    action:
      it?.action ?? it?.title ?? it?.description ?? it?.status ?? "Hoạt động",
    time: it?.time ?? it?.createdAt ?? it?.timestamp ?? new Date().toISOString(),
    type: it?.type ?? it?.kind ?? undefined,
  }));
}

// Fetch time series data for charts
async function getTimeseries(
  query: TimeseriesQuery,
): Promise<AdminTimeseriesPoint[]> {
  const params = new URLSearchParams();
  params.set("from", query.from);
  params.set("to", query.to);
  // Backend expects groupBy=day|week|month; map our granularity to groupBy
  params.set("groupBy", query.granularity ?? "day");

  const { data } = await axiosClient.get(
    `/api/Admin/analytics/revenue/timeseries?${params.toString()}`,
  );
  return Array.isArray(data) ? data : [];
}

// Fetch system health snapshot and adapt to alerts shape used by Dashboard
async function getAlerts(): Promise<AdminAlerts> {
  const { data } = await axiosClient.get("/api/Admin/analytics/health");
  const raw: any = data ?? {};
  return {
    longPendingOrders: raw?.pendingOrders ?? 0,
    productsWaitingApproval: raw?.pendingProducts ?? 0,
  };
}

// Optional: expose top categories/products endpoints for future use
export interface TopItem {
  id: number | string;
  name: string;
  value: number;
}

async function getTopCategories(top = 10): Promise<TopItem[]> {
  const { data } = await axiosClient.get(
    `/api/Admin/analytics/top/categories?top=${top}`,
  );
  return Array.isArray(data) ? data : [];
}

async function getTopProducts(top = 10): Promise<TopItem[]> {
  const { data } = await axiosClient.get(
    `/api/Admin/analytics/top/products?top=${top}`,
  );
  return Array.isArray(data) ? data : [];
}

export const adminAnalyticsService = {
  getOverview,
  getRecentActivities,
  getTimeseries,
  getAlerts,
  getTopCategories,
  getTopProducts,
};