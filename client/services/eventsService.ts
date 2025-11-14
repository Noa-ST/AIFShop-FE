import axiosClient from "@/services/axiosClient";

export type EntityType = "product" | "shop" | "category";

export interface EventMetadata {
  device?: string;
  region?: string;
  sessionId?: string;
  userAgent?: string;
  language?: string;
  referrer?: string;
  screen?: { width: number; height: number };
}

function defaultMetadata(partial?: EventMetadata): EventMetadata {
  const nav = typeof navigator !== "undefined" ? navigator : ({} as any);
  const scr = typeof window !== "undefined" ? window.screen : ({} as any);

  return {
    device: "web",
    region: partial?.region ?? (localStorage.getItem("region") || "VN"),
    sessionId:
      partial?.sessionId ??
      (localStorage.getItem("sessionId") ||
        (() => {
          const sid = crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
          try {
            localStorage.setItem("sessionId", sid);
          } catch {}
          return sid;
        })()),
    userAgent: partial?.userAgent ?? nav.userAgent,
    language: partial?.language ?? nav.language,
    referrer: partial?.referrer ?? (typeof document !== "undefined" ? document.referrer : undefined),
    screen: partial?.screen ?? { width: scr?.width ?? 0, height: scr?.height ?? 0 },
  };
}

async function post(path: string, payload: any): Promise<void> {
  try {
    await axiosClient.post(path, payload);
  } catch (err: any) {
    const status = err?.response?.status;
    // Fallback to PascalCase endpoints if backend expects capitalised segments
    if (status === 404 || status === 405) {
      const upper = path
        .replace("/api/events/impression", "/api/Events/Impression")
        .replace("/api/events/click", "/api/Events/Click")
        .replace("/api/events/add-to-cart", "/api/Events/AddToCart");
      try {
        await axiosClient.post(upper, payload);
        return;
      } catch (_) {
        // Swallow errors: tracking should never block UI
      }
    }
    // Swallow other errors too
  }
}

export const eventsService = {
  async trackClick(entityType: EntityType, entityId: string, metadata?: EventMetadata) {
    await post("/api/events/click", { entityType, entityId, metadata: defaultMetadata(metadata) });
  },

  async trackImpression(entityType: EntityType, entityId: string, metadata?: EventMetadata) {
    await post("/api/events/impression", { entityType, entityId, metadata: defaultMetadata(metadata) });
  },

  async trackAddToCart(productId: string, quantity: number, metadata?: EventMetadata) {
    await post("/api/events/add-to-cart", {
      entityType: "product",
      entityId: productId,
      quantity,
      metadata: defaultMetadata(metadata),
    });
  },
};

export default eventsService;