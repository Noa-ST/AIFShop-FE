// Utility to sanitize and select usable image URLs across the app
import axiosClient from "@/services/axiosClient";

// Consider only absolute http(s) and data URLs as fully usable.
// Relative paths like "/uploads/..." should be converted to absolute
// to avoid dev-server origin issues.
const isUsable = (url: string | null | undefined): url is string => {
  if (!url || typeof url !== "string") return false;
  const u = url.trim();
  return (
    u.startsWith("http") ||
    u.startsWith("data:image")
  );
};

export const sanitizeImageUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== "string") return null;
  let trimmed = url.trim().replace(/^['"`\s]+|['"`\s]+$/g, "");
  // Normalize Windows-style backslashes and common fake paths
  trimmed = trimmed
    .replace(/\\+/g, "/")
    .replace(/^file:\/\//, "")
    .replace(/^([a-zA-Z]:)?\/?fakepath\/?/i, "")
    .replace(/^c:\/fakepath\//i, "");

  // If string embeds a data:image but has prefix noise, extract it
  if (trimmed.includes("data:image/") && !trimmed.startsWith("data:image/")) {
    const match = trimmed.match(/data:image\/[^;]+;base64,[^\s"']+/);
    if (match) return match[0];
  }
  return trimmed;
};

// Build a full URL using API base for relative or filename-only paths
const withApiBase = (raw: string): string => {
  const DEFAULT_BASE = "https://aifshop-backend.onrender.com";
  // In dev, axiosClient baseURL may be empty string, so always fall back to DEFAULT for static files
  const apiBase = axiosClient?.defaults?.baseURL || DEFAULT_BASE;
  const clean = raw.replace(/^\/+/, "").replace(/\\+/g, "/");
  const hasPath = clean.includes("/");
  const filename = clean.split("/").pop() || clean;

  // If we already have a path like uploads/... keep it
  if (hasPath && /(^|\/)uploads\//.test(clean) || /(^|\/)images\//.test(clean)) {
    return `${apiBase}/${clean}`;
  }

  // Otherwise assume a bare filename and try common static folders on the backend
  const candidates = [
    `${apiBase}/uploads/products/${filename}`,
    `${apiBase}/uploads/${filename}`,
    `${apiBase}/images/products/${filename}`,
    `${apiBase}/images/${filename}`,
    `${apiBase}/${clean}`,
    `/${clean}`,
  ];

  // Return the first candidate (ordered by likelihood)
  return candidates[0];
};

export const getProductImageUrl = (product: any, fallback: string = "/placeholder.svg"): string => {
  const candidates: Array<string | null | undefined> = [
    product?.imageUrl,
    Array.isArray(product?.imageUrls) ? product.imageUrls[0] : undefined,
    Array.isArray(product?.productImages) ? product.productImages?.[0]?.url : undefined,
    Array.isArray(product?.images) ? product.images?.[0] : undefined,
    Array.isArray(product?.gallery) ? product.gallery?.[0] : undefined,
    product?.image,
  ];

  for (const c of candidates) {
    const s = sanitizeImageUrl(c);
    if (s) {
      // http(s) and data URLs return directly
      if (isUsable(s)) return s;
      // Đối với các đường dẫn tương đối hoặc chỉ là filename,
      // ghép với API base để tránh bị load từ domain FE khi deploy
      return withApiBase(s);
    }
  }
  return fallback;
};

export const getShopLogoUrl = (shop: any, fallback: string = "/placeholder.svg"): string => {
  const candidates: Array<string | null | undefined> = [
    shop?.logo,
    shop?.logoUrl,
    shop?.imageUrl,
    shop?.coverImage,
  ];
  for (const c of candidates) {
    const s = sanitizeImageUrl(c);
    if (s && isUsable(s)) return s;
  }
  return fallback;
};

export default {
  sanitizeImageUrl,
  getProductImageUrl,
  getShopLogoUrl,
};