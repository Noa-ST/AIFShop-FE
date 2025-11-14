import axiosClient from "@/services/axiosClient";

export type EntityType = "product" | "shop" | "category";

export interface PinRequest {
  entityType: EntityType;
  entityId: string;
  pinned: boolean;
  expiresAt?: string;
}

export interface Totals {
  clicks: number;
  impressions: number;
  addsToCart: number;
}

export interface StatsParams {
  entityType?: EntityType;
  entityId?: string;
  from?: string; // ISO datetime
  to?: string;   // ISO datetime
  topN?: number;
  page?: number;
  pageSize?: number;
}

export interface TopEntity {
  entityType: EntityType;
  entityId: string;
  totals: Totals;
}

export interface StatsResponse {
  totals: Totals;
  top?: TopEntity[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
}

const adminFeaturedService = {
  async pin(req: PinRequest): Promise<{ succeeded: boolean; message?: string }> {
    try {
      const resp = await axiosClient.post("/api/Admin/Featured/pin", req);
      return resp.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        const resp2 = await axiosClient.post("/api/Admin/featured/pin", req);
        return resp2.data;
      }
      throw err;
    }
  },

  async getStats(params: StatsParams): Promise<StatsResponse> {
    const q = new URLSearchParams();
    if (params.entityType) q.append("entityType", params.entityType);
    if (params.entityId) q.append("entityId", params.entityId);
    if (params.from) q.append("from", params.from);
    if (params.to) q.append("to", params.to);
    if (params.topN !== undefined) q.append("topN", String(params.topN));
    if (params.page !== undefined) q.append("page", String(params.page));
    if (params.pageSize !== undefined) q.append("pageSize", String(params.pageSize));

    try {
      const resp = await axiosClient.get(`/api/Admin/Featured/stats?${q.toString()}`);
      return resp.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        const resp2 = await axiosClient.get(`/api/Admin/featured/stats?${q.toString()}`);
        return resp2.data;
      }
      throw err;
    }
  },
};

export default adminFeaturedService;