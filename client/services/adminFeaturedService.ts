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
    // Helper: map entityType to potential backend enum casing
    const toPascal = (t: EntityType): string => {
      if (t === "category") return "GlobalCategory"; // common backend naming
      return t.charAt(0).toUpperCase() + t.slice(1);
    };

    // Helper: build alternative payload shapes for compatibility
    const altPayload = {
      EntityType: toPascal(req.entityType),
      EntityId: req.entityId,
      IsPinned: req.pinned,
      // Some backends require non-Z ISO or trimmed seconds
      ExpiresAt: req.expiresAt ? req.expiresAt.substring(0, 19) : undefined,
    } as any;

    // First try the canonical endpoint with the natural payload
    try {
      const resp = await axiosClient.post("/api/Admin/Featured/pin", req);
      return resp.data;
    } catch (err: any) {
      const status = err?.response?.status;
      // If route casing mismatches, attempt lowercase Featured segment
      if (status === 404 || status === 405) {
        const resp2 = await axiosClient.post("/api/Admin/featured/pin", req);
        return resp2.data;
      }
      // Bad Request: try alternative payload casing/shape
      if (status === 400) {
        try {
          const resp3 = await axiosClient.post("/api/Admin/Featured/pin", altPayload);
          return resp3.data;
        } catch (err2: any) {
          const st2 = err2?.response?.status;
          if (st2 === 404 || st2 === 405) {
            const resp4 = await axiosClient.post("/api/Admin/featured/pin", altPayload);
            return resp4.data;
          }
          // Surface readable error if available
          const message = err2?.response?.data?.message || err2?.message || "Bad Request";
          return { succeeded: false, message };
        }
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