import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProductById } from "@/lib/api";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Send,
  Star,
  Truck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import AddToCartButton from "@/components/products/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import productService from "@/services/productService";
import { getProductImageUrl } from "@/utils/imageUrl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useChat } from "@/contexts/ChatContext";
import { useChatHubClient } from "@/hooks/useChatHubClient";
import chatService from "@/services/chatService";
import { shopService } from "@/services/shopService";
import axiosClient from "@/services/axiosClient";
import { HubConnectionState } from "@microsoft/signalr";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import reviewsService, { ReviewDto, ReviewStatus } from "@/services/reviews";

export default function ProductDetail() {
  const location = useLocation();
  // ----------------------------------------------
  // Hooks MUST be called unconditionally at top level
  // ----------------------------------------------
  const { id } = useParams();
  const [mainImage, setMainImage] = useState<string>("/placeholder.svg");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string>("/placeholder.svg");
  const { user } = useAuth();
  // Chat (real) integration states
  const {
    enableChat,
    sendMessage,
    messages: chatMessages,
    loadConversation,
    markAsRead,
    isEnabled,
  } = useChat();
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Determine SignalR base URL (same logic as ChatContext)
  const signalRBaseUrl = useMemo(() => {
    const apiBaseUrl = axiosClient.defaults.baseURL;
    const isDev = import.meta.env.DEV;
    const isLocalhost =
      apiBaseUrl &&
      (apiBaseUrl.includes("localhost") || apiBaseUrl.includes("127.0.0.1"));

    if (isDev && isLocalhost) {
      return undefined; // Use relative path for Vite proxy
    }
    return apiBaseUrl || undefined;
  }, []);

  // Only enable SignalR client when chat is enabled (via useChat context)
  // This ensures we don't try to connect before user is authenticated
  const { client, state } = useChatHubClient({
    enabled: isEnabled,
    baseUrl: signalRBaseUrl,
    // Force WebSockets when using remote backend to avoid negotiation issues
    forceWebSockets: !!signalRBaseUrl, // if baseUrl is set, it means remote backend
    skipNegotiation: !!signalRBaseUrl,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id as string),
    enabled: !!id,
  });

  const { data: allProducts, isLoading: loadingAllProducts } = useQuery({
    queryKey: ["all-products"],
    queryFn: () => productService.getAll(),
    enabled: !!id,
  });

  // Tabs initial value: support deep link to reviews via ?tab=reviews or #reviews
  const initialTab = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const hash = (
        typeof window !== "undefined" ? window.location.hash : ""
      ).replace("#", "");
      if (tabParam === "reviews" || hash === "reviews") return "reviews";
    } catch {}
    return "desc";
  }, []);

  // Non-hook derived values
  const product: any = data || {};

  const similarProducts: any[] = useMemo(() => {
    const list = Array.isArray(allProducts) ? allProducts : [];
    const currentId = product?.id;
    const currentGlobalCat = (product as any)?.globalCategoryId ?? null;
    const currentCat = product?.categoryId ?? null;
    const filtered = list.filter((p: any) => {
      const pid = p?.id;
      if (!pid || pid === currentId) return false;
      const pGlobal = (p as any)?.globalCategoryId ?? null;
      const pCat = p?.categoryId ?? null;
      if (currentGlobalCat && pGlobal)
        return String(pGlobal) === String(currentGlobalCat);
      if (!currentGlobalCat && currentCat && pCat)
        return String(pCat) === String(currentCat);
      return false;
    });
    return filtered.slice(0, 4);
  }, [allProducts, product]);

  // -----------------------------
  // Reviews state & queries (always show only Approved reviews)
  // -----------------------------
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPageSize] = useState(10);
  // Hard-code onlyApproved = true to always fetch and display approved reviews only
  const onlyApproved = true;

  const {
    data: reviewsPaged,
    refetch: refetchReviews,
    isLoading: loadingReviews,
  } = useQuery({
    queryKey: ["product-reviews", id, reviewsPage, reviewsPageSize, "approved"],
    queryFn: () =>
      reviewsService.getProductReviews(
        String(id),
        reviewsPage,
        reviewsPageSize,
        onlyApproved,
      ),
    enabled: !!id,
  });

  // Thống kê sao: ưu tiên dùng từ BE nếu có, fallback tính theo trang hiện tại
  const reviewsStats = useMemo(() => {
    const paged: any = reviewsPaged as any;
    const fromBE = paged?.stats;
    const list: ReviewDto[] = (paged?.data as ReviewDto[]) || [];

    const distributionPage: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    let sum = 0;
    for (const r of list) {
      const rate = Math.round(Number(r?.rating) || 0);
      if (rate >= 1 && rate <= 5) {
        distributionPage[rate] += 1;
        sum += rate;
      }
    }
    const count = list.length;
    const avgPage = count ? sum / count : 0;
    const totalApproved = Number(paged?.totalCount || 0);

    const average =
      typeof fromBE?.averageRating === "number"
        ? fromBE.averageRating
        : avgPage;
    const distribution =
      (fromBE?.ratingDistribution as Record<number, number>) ||
      distributionPage;
    const totalApprovedCount =
      typeof fromBE?.totalApprovedCount === "number"
        ? Number(fromBE.totalApprovedCount)
        : totalApproved;

    const hasGlobalStats = Boolean(
      fromBE &&
        (typeof fromBE.averageRating !== "undefined" ||
          typeof fromBE.totalApprovedCount !== "undefined"),
    );

    return { average, distribution, totalApprovedCount, hasGlobalStats };
  }, [reviewsPaged]);

  const {
    data: myReview,
    refetch: refetchMyReview,
    isLoading: loadingMyReview,
  } = useQuery({
    queryKey: ["product-my-review", id, user?.id],
    queryFn: () => reviewsService.getMyReview(String(id)),
    enabled: !!id && !!user,
  });

  const [ratingInput, setRatingInput] = useState<string>("5");
  const [commentInput, setCommentInput] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const hasReviewed = Boolean(myReview?.hasReviewed);
  const existing = myReview?.review ?? null;
  const reviewStatus: ReviewStatus | null = (myReview?.status ??
    existing?.status ??
    null) as any;
  const rejectionReason =
    myReview?.rejectionReason ?? existing?.rejectionReason ?? null;

  useEffect(() => {
    if (existing) {
      setRatingInput(String(existing.rating ?? 5));
      setCommentInput(existing.comment ?? "");
    } else {
      // reset fields for create mode
      setRatingInput("5");
      setCommentInput("");
    }
  }, [existing?.id]);

  const handleCreate = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const resp = await reviewsService.create({
        productId: String(id),
        rating: Number(ratingInput),
        comment: commentInput.trim(),
      });
      if (resp?.Succeeded) {
        toast({ title: "Đánh giá của bạn đang chờ duyệt" });
        await refetchMyReview();
        // Always refresh reviews list (backend will show only Approved reviews)
        await refetchReviews();
      } else {
        const msg = (resp?.Message || "Không thể gửi đánh giá").toString();
        toast({ title: msg });
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) toast({ title: "Bạn cần đăng nhập để đánh giá" });
      else if (status === 403)
        toast({ title: "Bạn chưa đủ điều kiện để đánh giá" });
      else if (status === 400)
        toast({
          title: e?.response?.data?.message || "Dữ liệu đánh giá không hợp lệ",
        });
      else toast({ title: "Đã có lỗi xảy ra, vui lòng thử lại" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!existing) return;
    setSubmitting(true);
    try {
      const resp = await reviewsService.update(existing.id, {
        rating: Number(ratingInput),
        comment: commentInput.trim(),
      });
      if (resp?.Succeeded) {
        toast({ title: "Cập nhật review thành công, chờ duyệt" });
        await refetchMyReview();
        // Ensure reviews list is refreshed
        await refetchReviews();
      } else {
        toast({ title: resp?.Message || "Không thể cập nhật đánh giá" });
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) toast({ title: "Bạn cần đăng nhập" });
      else if (status === 400)
        toast({ title: e?.response?.data?.message || "Dữ liệu không hợp lệ" });
      else toast({ title: "Đã có lỗi xảy ra, vui lòng thử lại" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setSubmitting(true);
    try {
      const resp = await reviewsService.remove(existing.id);
      if (resp?.Succeeded) {
        toast({ title: "Đã xóa đánh giá" });
        await refetchMyReview();
        await refetchReviews();
      } else {
        toast({ title: resp?.Message || "Không thể xóa đánh giá" });
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) toast({ title: "Bạn cần đăng nhập" });
      else toast({ title: "Đã có lỗi xảy ra, vui lòng thử lại" });
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Helper function to clean up malformed base64 URLs
  const cleanImageUrl = (url: string): string => {
    if (!url || typeof url !== "string") return url || "";
    // Loại bỏ ký tự dư thừa ở đầu/cuối như khoảng trắng, dấu nháy, backtick
    let trimmed = url.trim().replace(/^['"`\s]+|['"`\s]+$/g, "");

    // ✅ If URL contains base64 but doesn't start with data:image/, it's malformed
    // Example: "https://aifshop-backend.onrender.comdata:image/webp;base64,..."
    // Example: "http://localhost:7109data:image/webp;base64,..."
    if (trimmed.includes("data:image/") && !trimmed.startsWith("data:image/")) {
      // Extract base64 part using regex - more comprehensive pattern
      // Matches: data:image/[type];base64,[base64data] (handles multiline base64)
      const base64Match = trimmed.match(
        /data:image\/[a-zA-Z0-9+]+;base64,[A-Za-z0-9+/=\s]+/,
      );
      if (base64Match) {
        const cleaned = base64Match[0].replace(/\s+/g, ""); // Remove any whitespace in base64
        if (process.env.NODE_ENV === "development") {
          console.log(
            "🧹 Cleaned malformed URL in Detail:",
            trimmed.substring(0, 60) + "... → base64",
          );
        }
        return cleaned;
      }
      // Fallback: try to find data:image/ and extract everything after it
      const dataImageIndex = trimmed.indexOf("data:image/");
      if (dataImageIndex > 0) {
        const extracted = trimmed.substring(dataImageIndex);
        // Take until we hit a quote, whitespace, or end of string (but keep base64 data)
        const endMatch = extracted.match(
          /^data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/,
        );
        if (endMatch) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "🧹 Cleaned malformed URL (fallback) in Detail:",
              trimmed.substring(0, 60) + "... → base64",
            );
          }
          return endMatch[0];
        }
      }
    }

    // ✅ Handle URLs that might have http/https prefix incorrectly combined
    // Check if it looks like a URL but has invalid characters
    if (trimmed.startsWith("http") && trimmed.includes("data:image")) {
      // Try to extract just the base64 part
      const base64Index = trimmed.indexOf("data:image/");
      if (base64Index > 0) {
        const base64Part = trimmed.substring(base64Index);
        const base64Match = base64Part.match(
          /^data:image\/[a-zA-Z0-9+]+;base64,[A-Za-z0-9+/=\s]+/,
        );
        if (base64Match) {
          return base64Match[0].replace(/\s+/g, "");
        }
      }
    }

    // Cuối cùng, trả lại chuỗi đã loại bỏ ký tự dư
    return trimmed;
  };

  const images: string[] = useMemo((): string[] => {
    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("Product data for images:", product);
      console.log("product.imageUrls:", product?.imageUrls);
      console.log("product.productImages:", product?.productImages);
    }

    // Helper to get API base (without trailing slash). Prefer axiosClient default baseURL when present.
    const getApiBase = () => {
      try {
        const base = axiosClient?.defaults?.baseURL;
        if (base && typeof base === "string") return base.replace(/\/+$/g, "");
      } catch {}
      // Fallback to current origin
      return window.location.origin.replace(/\/+$/g, "");
    };

    const normalize = (arr: any[]): string[] =>
      (arr || [])
        .map((i: any) => {
          if (!i) return null as any;
          if (typeof i === "string") {
            // ✅ Clean up malformed URLs first
            const cleaned = cleanImageUrl(i);
            // Validate string URL or base64
            if (
              cleaned &&
              (cleaned.startsWith("http") ||
                cleaned.startsWith("data:image") ||
                cleaned.startsWith("/"))
            ) {
              return cleaned;
            }
            // If cleaned looks like a bare filename (e.g. "79c0c4d76136...webp"), build full URL using API base
            if (cleaned && /^[\w\-]+\.[a-zA-Z]{2,6}$/.test(cleaned)) {
              const apiBase = getApiBase();
              return `${apiBase}/uploads/products/${cleaned.replace(/^\/+/, "")}`;
            }
            return null;
          }
          // Accept a variety of common keys the backend might use for images
          const url =
            i.url ||
            i.imageUrl ||
            i.src ||
            i.path ||
            i.Location ||
            i.fileName ||
            i.filename ||
            i.name ||
            i.blobName ||
            i.key ||
            null;
          if (url && typeof url === "string") {
            // ✅ Clean up malformed URLs first
            const cleaned = cleanImageUrl(url);
            if (
              cleaned &&
              (cleaned.startsWith("http") ||
                cleaned.startsWith("data:image") ||
                cleaned.startsWith("/"))
            ) {
              return cleaned;
            }
            // If object contains just filename-like property
            if (cleaned && /^[\w\-]+\.[a-zA-Z]{2,6}$/.test(cleaned)) {
              const apiBase = getApiBase();
              return `${apiBase}/uploads/products/${cleaned.replace(/^\/+/, "")}`;
            }
          }
          return null;
        })
        .filter(Boolean) as string[];

    // Xử lý imageUrls (array of strings - từ form tạo sản phẩm) - có thể là base64
    let imageUrlsArray: string[] = [];
    if (product?.imageUrls && Array.isArray(product.imageUrls)) {
      imageUrlsArray = product.imageUrls
        .map((url: any) => {
          if (!url || typeof url !== "string") return null;
          // ✅ Clean up malformed URLs first
          const cleaned = cleanImageUrl(url);
          // Accept http URLs, base64 data URLs, or relative paths
          if (
            cleaned &&
            (cleaned.startsWith("http") ||
              cleaned.startsWith("data:image") ||
              cleaned.startsWith("/"))
          ) {
            return cleaned;
          }
          return null;
        })
        .filter(Boolean);
    }

    // Try other image sources
    const normalizedImages =
      normalize(product?.productImages) ||
      normalize(product?.images) ||
      normalize(product?.gallery) ||
      [];

    // Single image fields
    const singleImages: string[] = [];
    if (product?.imageUrl && typeof product.imageUrl === "string") {
      // ✅ Clean up malformed URLs first
      const cleaned = cleanImageUrl(product.imageUrl);
      if (
        cleaned &&
        (cleaned.startsWith("http") ||
          cleaned.startsWith("data:image") ||
          cleaned.startsWith("/"))
      ) {
        singleImages.push(cleaned);
      }
    }
    if (product?.image && typeof product.image === "string") {
      // ✅ Clean up malformed URLs first
      const cleaned = cleanImageUrl(product.image);
      if (
        cleaned &&
        (cleaned.startsWith("http") ||
          cleaned.startsWith("data:image") ||
          cleaned.startsWith("/"))
      ) {
        singleImages.push(cleaned);
      }
    }

    // Combine all images, but prioritize base64 images (they're already available)
    const allImages = [...imageUrlsArray, ...normalizedImages, ...singleImages];

    // Separate base64 images from HTTP URLs
    const base64Images = allImages.filter((img) =>
      img.startsWith("data:image"),
    );
    const httpImages = allImages.filter((img) => img.startsWith("http"));
    const relativeImages = allImages.filter(
      (img) => img.startsWith("/") && !img.startsWith("data:"),
    );

    // Convert relative paths to absolute using API base to avoid loading from FE domain in production
    const DEFAULT_BASE = "https://aifshop-backend.onrender.com";
    const apiBase = axiosClient?.defaults?.baseURL || DEFAULT_BASE;
    const base = String(apiBase).replace(/\/+$/g, "");
    const absoluteRelativeImages = relativeImages.map(
      (p) => `${base}/${String(p).replace(/^\/+/, "")}`,
    );

    // Prioritize: base64 first (always work), then absolute relative paths, then HTTP URLs
    const result = [...base64Images, ...absoluteRelativeImages, ...httpImages];

    if (process.env.NODE_ENV === "development") {
      console.log("Final images array:", result);
    }

    return result;
  }, [product]);

  useEffect(() => {
    if (images && images.length) {
      // Prioritize base64 images for main image (they're always available)
      const base64Image = images.find((img) => img.startsWith("data:image"));
      const first = base64Image || images[0];
      setMainImage(first);
      setModalImage(first);
    }
  }, [images]);

  // Tham gia/rời nhóm SignalR, bỏ phụ thuộc trực tiếp vào HubConnectionState
  // ✅ MOVED BEFORE early returns to ensure consistent hook order
  useEffect(() => {
    if (!client || !conversationId) return;

    // Only try to join if SignalR is connected
    if (state.status !== HubConnectionState.Connected) {
      // SignalR is not connected, chat will work via polling (handled by ChatContext)
      return;
    }

    void client.joinConversation(conversationId).catch((e) => {
      // Nếu kết nối chưa sẵn sàng hoặc hub chưa xác thực, fallback sang polling
      console.warn("Join hub group thất bại (sẽ fallback polling):", e);
    });

    return () => {
      // Only leave if still connected
      if (state.status === HubConnectionState.Connected) {
        void client?.leaveConversation(conversationId).catch(() => undefined);
      }
    };
  }, [client, conversationId, state.status]);

  // Mở chat tự động theo query (?chat=1) — đặt trước mọi early return
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get("chat") === "1";
    if (product && shouldOpen) {
      // Delay nhẹ để context chat sẵn sàng
      setTimeout(() => {
        openChat();
      }, 0);
    }
  }, [product, location.search]);

  // Early returns AFTER all hooks are declared
  if (isLoading)
    return (
      <section className="py-12">
        <div className="container mx-auto grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <Skeleton className="w-full h-[520px]" />
                  <div className="mt-4 flex gap-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="w-20 h-20 rounded-md" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-7 w-3/4" />
                  <div className="mt-3 flex items-end gap-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Separator className="my-6" />
                  <Skeleton className="h-10 w-full" />
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-40" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-10">
              <CardContent className="p-6">
                <Skeleton className="h-10 w-40" />
                <div className="mt-4 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <aside className="hidden lg:block">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-28" />
                <div className="mt-3 space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    );
  if (error)
    return (
      <section className="py-12">
        <div className="container mx-auto">
          <Card>
            <CardContent className="p-6">
              <Alert variant="destructive">
                <AlertTitle>Không thể tải sản phẩm</AlertTitle>
                <AlertDescription>
                  Vui lòng kiểm tra kết nối đến máy chủ hoặc thử lại sau.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </section>
    );

  // Non-hook derived values (safe to compute after early returns)
  const shop = product?.shop || product?.shopInfo || product?.seller;

  const currentPrice = Number(
    product?.price ?? product?.salePrice ?? product?.currentPrice ?? 0,
  );
  const originalPriceRaw = Number(
    product?.originalPrice ??
      product?.regularPrice ??
      product?.priceBeforeDiscount ??
      product?.compareAtPrice ??
      product?.basePrice ??
      0,
  );
  const originalPrice = originalPriceRaw > currentPrice ? originalPriceRaw : 0;
  const discountPercent = originalPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const rating = Number(
    product?.rating ?? product?.averageRating ?? product?.avgRating ?? 0,
  );
  const ratingCount = Number(
    product?.ratingCount ?? product?.reviewsCount ?? product?.totalReviews ?? 0,
  );

  const stockQuantity = Number(
    product?.stockQuantity ?? product?.stock ?? product?.quantity ?? 0,
  );

  // Helper lấy sellerId từ payload hiện có hoặc gọi Shop API
  const getSellerUserId = async (): Promise<string | null> => {
    const inline =
      (product?.sellerId as string | undefined) ??
      (product?.shop?.sellerId as string | undefined) ??
      (product?.shopId as string | undefined) ??
      (product?.shop?.id as string | undefined) ??
      null;

    // Nếu inline đã là sellerId → trả luôn
    if (inline && inline.length > 20) return inline; // thường GUID dài
    // Nếu inline thực chất là shopId → gọi shopService để lấy sellerId
    const shopId =
      (product?.shopId as string | undefined) ??
      (product?.shop?.id as string | undefined) ??
      inline ??
      null;

    if (!shopId) return null;
    try {
      const shop = await shopService.getById(shopId);
      return shop?.sellerId ?? null;
    } catch {
      return null;
    }
  };

  const openChat = async () => {
    setChatOpen(true);
    if (!isEnabled) enableChat();

    const sellerUserId = await getSellerUserId();
    if (!sellerUserId) {
      console.warn("Không tìm thấy sellerUserId để tạo hội thoại");
      return;
    }

    try {
      const resp = await chatService.createConversation({
        targetUserId: sellerUserId,
      });
      if (resp.succeeded && resp.data?.conversationId) {
        const cid = resp.data.conversationId;
        setConversationId(cid);
        await loadConversation(cid);
        await markAsRead(cid);
      } else {
        console.warn("Create conversation response:", resp);
        // Try to get existing conversation if creation failed
        // The backend might return existing conversation in error response
        if (resp.data?.conversationId) {
          setConversationId(resp.data.conversationId);
          await loadConversation(resp.data.conversationId);
        }
      }
    } catch (e: any) {
      console.error("Create/join conversation failed:", e);
      // Log detailed error for debugging
      if (e?.response?.data) {
        console.error("Error details:", e.response.data);
      }
      // If it's a 400 error, the conversation might already exist
      // Try to load conversations and find the existing one
      if (e?.response?.status === 400) {
        console.info(
          "Conversation might already exist. Checking existing conversations...",
        );
        try {
          const listResp = await chatService.getConversations(1, 50);
          const items = listResp.data?.data || [];
          const existing = items.find((c: any) => {
            const pid = c.partnerId ?? c.PartnerId;
            return pid && String(pid) === String(sellerUserId);
          });
          if (existing?.conversationId) {
            const cid = existing.conversationId;
            setConversationId(cid);
            await loadConversation(cid);
            await markAsRead(cid);
            return;
          }
        } catch (fallbackErr) {
          console.warn("Fallback conversation lookup failed:", fallbackErr);
        }
      }
    }
  };

  

  const displayedMessages = conversationId
    ? chatMessages[conversationId] || []
    : [];

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text || !conversationId) return;
    const ok = await sendMessage(conversationId, text, "Text", id ?? undefined);
    if (ok) {
      setChatInput("");
    }
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Breadcrumb đơn giản */}
          <div className="mb-4 text-sm text-slate-600">
            <Link to="/" className="hover:underline">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <Link to="/products" className="hover:underline">
              Sản phẩm
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900 font-medium truncate inline-block max-w-[50ch] align-bottom">
              {product?.name || "Chi tiết"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group rounded-2xl overflow-hidden bg-white shadow-md"
              >
                <img
                  src={mainImage}
                  alt={product?.name}
                  onClick={() => setImageModalOpen(true)}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    // Use attempt counter to try a couple of fallbacks before final placeholder
                    const attempts = Number(target.dataset.attempts || "0");
                    target.dataset.attempts = String(attempts + 1);

                    // 1) If there is a base64 image available, use it immediately
                    if (images.length > 0) {
                      const base64Image = images.find(
                        (img) =>
                          img.startsWith("data:image") && img !== mainImage,
                      );
                      if (base64Image) {
                        target.src = base64Image;
                        setMainImage(base64Image);
                        return;
                      }
                    }

                    // 2) For HTTP/HTTPS URLs, try swapping protocol (http <-> https) on first attempt
                    const src = target.src || "";
                    if (attempts === 0 && /^https?:\/\//i.test(src)) {
                      try {
                        const alt = src.replace(
                          /^https?:/,
                          window.location.protocol,
                        );
                        // If swapping changes the url, try it
                        if (alt && alt !== src) {
                          target.src = alt;
                          return;
                        }
                      } catch {}
                    }

                    // 3) Try rebuilding URL from filename using various known path prefixes
                    try {
                      const fn = src.split("/").pop();
                      if (fn) {
                        const DEFAULT_BASE =
                          "https://aifshop-backend.onrender.com";
                        const apiBase =
                          axiosClient?.defaults?.baseURL || DEFAULT_BASE;
                        const base = String(apiBase).replace(/\/+$/g, "");
                        const candidates = [
                          `${base}/uploads/products/${fn}`,
                          `${base}/uploads/${fn}`,
                          `/uploads/products/${fn}`,
                          `/uploads/${fn}`,
                          `/images/products/${fn}`,
                        ];
                        const next =
                          candidates[attempts] ||
                          candidates.find((c) => c !== src);
                        if (next && next !== src) {
                          target.src = next;
                          return;
                        }
                      }
                    } catch {}

                    // Final fallback after attempts
                    target.src = "/placeholder.svg";
                    target.onerror = null;
                  }}
                  className="w-full h-[420px] md:h-[520px] object-contain bg-white transition-transform duration-300 ease-out group-hover:scale-105 cursor-zoom-in"
                />
              </motion.div>

              {images && images.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto relative z-50">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (img) setMainImage(img);
                      }}
                      aria-label={`Chọn ảnh ${idx + 1}`}
                      aria-selected={mainImage === img}
                      tabIndex={0}
                      className={`relative z-50 w-20 h-20 rounded-md overflow-hidden ${
                        mainImage === img
                          ? "border-2 border-rose-600"
                          : "border border-slate-200 hover:border-slate-300"
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500`}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <img
                        src={img}
                        alt={`thumb-${idx}`}
                        className="w-full h-full object-contain bg-white"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          // Use attempt counter to try a couple of fallbacks before final placeholder
                          const attempts = Number(
                            target.dataset.attempts || "0",
                          );
                          target.dataset.attempts = String(attempts + 1);

                          // If there's any base64 image, use it
                          if (
                            img &&
                            !img.startsWith("data:image") &&
                            images.length > 0
                          ) {
                            const base64Image = images.find((im) =>
                              im.startsWith("data:image"),
                            );
                            if (base64Image) {
                              target.src = base64Image;
                              return;
                            }
                          }

                          const src = target.src || img || "";
                          // Try swapping protocol first
                          if (attempts === 0 && /^https?:\/\//i.test(src)) {
                            try {
                              const alt = src.replace(
                                /^https?:/,
                                window.location.protocol,
                              );
                              if (alt && alt !== src) {
                                target.src = alt;
                                return;
                              }
                            } catch {}
                          }

                          // Try rebuilding URL from filename with multiple known prefixes
                          try {
                            const fn = src.split("/").pop();
                            if (fn) {
                              const DEFAULT_BASE =
                                "https://aifshop-backend.onrender.com";
                              const apiBase =
                                axiosClient?.defaults?.baseURL || DEFAULT_BASE;
                              const base = String(apiBase).replace(/\/+$/g, "");
                              const candidates = [
                                `${base}/uploads/products/${fn}`,
                                `${base}/uploads/${fn}`,
                                `/uploads/products/${fn}`,
                                `/uploads/${fn}`,
                                `/images/products/${fn}`,
                              ];
                              const next =
                                candidates[attempts] ||
                                candidates.find((c) => c !== src);
                              if (next && next !== src) {
                                target.src = next;
                                return;
                              }
                            }
                          } catch {}

                          // Final fallback to placeholder
                          target.src = "/placeholder.svg";
                          target.onerror = null;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
              {/* Modal phóng to ảnh */}
              <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
                <DialogContent className="max-w-4xl">
                  <div className="flex flex-col gap-3">
                    <div className="w-full h-[60vh] bg-white border rounded-xl overflow-hidden flex items-center justify-center">
                      <img
                        src={modalImage}
                        alt="preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/placeholder.svg";
                        }}
                      />
                    </div>
                    {images && images.length > 1 ? (
                      <div className="mt-1 flex gap-2 overflow-x-auto">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setModalImage(img)}
                            className={`w-16 h-16 rounded-md overflow-hidden ${modalImage === img ? "border-2 border-rose-600" : "border border-slate-200"}`}
                          >
                            <img
                              src={img}
                              alt={`modal-thumb-${idx}`}
                              className="w-full h-full object-contain bg-white"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  "/placeholder.svg";
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md md:sticky md:top-20">
              <div className="flex items-start gap-3">
                <h1
                    className="text-xl sm:text-2xl md:text-3xl font-semibold flex-1 whitespace-normal break-words leading-snug md:leading-tight line-clamp-3"
                >
                    {product?.name}
                </h1>
                {stockQuantity > 0 ? (
                    <Badge className="whitespace-nowrap">Còn hàng</Badge>
                ) : (
                    <Badge variant="destructive" className="whitespace-nowrap">
                        Hết hàng
                    </Badge>
                )}
              </div>
              {(rating > 0 || ratingCount > 0) && (
                <div className="mt-1 md:mt-2 flex items-center gap-2 text-sm text-slate-600">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < Math.round(rating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-slate-300"
                      }
                    />
                  ))}
                  <span className="ml-1">{rating.toFixed(1)} / 5</span>
                  {ratingCount ? (
                    <span className="ml-1">({ratingCount})</span>
                  ) : null}
                </div>
              )}
              <div className="mt-2 flex items-end gap-3">
                <div className="text-rose-600 font-bold text-2xl">
                  {currentPrice.toLocaleString("vi-VN")}₫
                </div>
                {originalPrice > 0 && (
                  <div className="text-gray-400 line-through">
                    {originalPrice.toLocaleString("vi-VN")}₫
                  </div>
                )}
                {discountPercent > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-rose-700 bg-rose-100"
                  >
                    -{discountPercent}%
                  </Badge>
                )}
              </div>
              <Separator className="my-6" />
              <div className="mt-6">
                {(user?.role === "Seller" || user?.role === "Admin") && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTitle>
                      {user?.role === "Admin"
                        ? "Admin không thể mua hàng hoặc chat"
                        : "Seller không thể mua hàng"}
                    </AlertTitle>
                    <AlertDescription>
                      Vui lòng dùng tài khoản Khách hàng để mua hoặc nhắn tin.
                    </AlertDescription>
                  </Alert>
                )}
                {id && (
                  <AddToCartButton
                    productId={id}
                    stockQuantity={stockQuantity}
                    className="mb-4"
                    disabled={user?.role === "Seller" || user?.role === "Admin"}
                  />
                )}
                {/* Floating chat button (bottom-right) */}
                {/* Removed inline chat button here; use global floating button below */}
              </div>
              <div className="mt-6 border-t pt-4">
                {shop && (
                  <div className="group flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={shop.logoUrl || shop.logo || "/placeholder.svg"}
                        alt={shop.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/placeholder.svg";
                        }}
                      />
                      <div>
                        <div className="font-medium">
                          {shop.name || shop.shopName || "Cửa hàng"}
                        </div>
                        {shop.rating && (
                          <div className="text-sm text-slate-500">
                            Đánh giá: {shop.rating} / 5
                          </div>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/shops/${shop.id || shop.shopId || shop._id}`}
                      aria-label="Xem shop"
                      className="text-rose-600 hover:underline opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    >
                      Xem shop
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <Tabs defaultValue={initialTab}>
                <TabsList>
                  <TabsTrigger value="desc">Mô tả</TabsTrigger>
                  <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
                </TabsList>
                <TabsContent value="desc" className="mt-4">
                  <div className="prose max-w-none text-slate-700 whitespace-pre-line">
                    {product?.description || "Chưa có mô tả."}
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="mt-4 text-slate-600">
                  <div className="space-y-6">
                    {/* Reviews list - chỉ hiển thị đánh giá đã duyệt */}
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Đánh giá sản phẩm</div>
                    </div>
                    {/* Thống kê sao - dùng số liệu BE nếu có, fallback từ trang hiện tại */}
                    {!loadingReviews && reviewsPaged ? (
                      <div className="mt-3 mb-4 rounded-xl border bg-white p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">Thống kê sao</div>
                          <div className="text-xs text-slate-500">
                            {reviewsStats.hasGlobalStats
                              ? "Theo BE"
                              : "Tạm tính từ trang hiện tại"}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                          <div className="text-2xl font-bold">
                            {reviewsStats.average?.toFixed?.(1) ?? "0.0"} / 5
                          </div>
                          <div className="text-sm text-slate-600">
                            Tổng {reviewsStats.totalApprovedCount} đánh giá
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = Number(
                              reviewsStats.distribution?.[star] || 0,
                            );
                            const total = Number(
                              reviewsStats.totalApprovedCount || 0,
                            );
                            const pct =
                              total > 0
                                ? Math.min(100, (count / total) * 100)
                                : 0;
                            return (
                              <div
                                key={star}
                                className="flex items-center gap-2"
                              >
                                <div className="w-16 text-sm">{star} sao</div>
                                <div className="flex-1 h-2 rounded bg-slate-200">
                                  <div
                                    className="h-2 rounded bg-pink-500"
                                    style={{ width: `${pct}%` }}
                                    aria-valuenow={Math.round(pct)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                  />
                                </div>
                                <div className="w-12 text-right text-sm">
                                  {count}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    {loadingReviews ? (
                      <div className="text-sm text-slate-500">
                        Đang tải danh sách đánh giá...
                      </div>
                    ) : reviewsPaged &&
                      reviewsPaged.data &&
                      reviewsPaged.data.length > 0 ? (
                      <div className="space-y-3">
                        {reviewsPaged.data.map((r: ReviewDto) => (
                          <div key={r.id} className="rounded-xl border p-3">
                            <div className="flex items-start justify-between">
                              <div className="text-sm font-medium">
                                {r.userFullName || r.userName || "Người dùng"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(r.createdAt).toLocaleString("vi-VN")}
                              </div>
                            </div>
                            <div className="mt-1 text-sm">⭐ {r.rating}/5</div>
                            <div className="mt-1 text-slate-700 text-sm">
                              {r.comment}
                            </div>
                          </div>
                        ))}
                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="text-xs text-slate-500">
                            Trang {reviewsPaged.page}/{reviewsPaged.totalPages}{" "}
                            • Tổng {reviewsPaged.totalCount}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              disabled={!reviewsPaged.hasPreviousPage}
                              onClick={() =>
                                setReviewsPage((p) => Math.max(1, p - 1))
                              }
                            >
                              Trước
                            </Button>
                            <Button
                              variant="outline"
                              disabled={!reviewsPaged.hasNextPage}
                              onClick={() => setReviewsPage((p) => p + 1)}
                            >
                              Sau
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        Chưa có đánh giá nào.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="bg-white rounded-2xl p-6 shadow-md overflow-y-auto mt-4">
            <h4 className="font-semibold mb-2">Thông tin nhanh</h4>
            <p className="text-sm text-slate-600">
              Tồn kho:{" "}
              <span className="font-medium">
                {product?.stockQuantity ?? "-"}
              </span>
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Danh mục:{" "}
              <span className="font-medium">
                {product?.categoryName || product?.category || "-"}
              </span>
            </p>
          </div>
          {/* Chính sách & vận chuyển */}
          <div className="bg-white rounded-2xl p-6 shadow-md mt-6">
            <h4 className="font-semibold mb-3">Chính sách & vận chuyển</h4>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <Truck className="h-4 w-4 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-medium">Miễn phí vận chuyển</div>
                  <div className="text-xs text-slate-500">
                    Áp dụng cho khu vực hỗ trợ.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw className="h-4 w-4 text-sky-600 mt-0.5" />
                <div>
                  <div className="font-medium">Đổi trả trong 7 ngày</div>
                  <div className="text-xs text-slate-500">
                    Hỗ trợ đổi size/màu nếu còn hàng.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 text-rose-600 mt-0.5" />
                <div>
                  <div className="font-medium">Bảo hành chính hãng</div>
                  <div className="text-xs text-slate-500">
                    Tư vấn và hỗ trợ sau bán.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md mt-6 h-[390px] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Sản phẩm tương tự</h4>
              {(() => {
                const catId = product?.categoryId ?? null;
                const globalCatId = (product as any)?.globalCategoryId ?? null;
                const href = catId
                  ? `/products?categoryId=${encodeURIComponent(String(catId))}`
                  : globalCatId
                    ? `/products?gc=${encodeURIComponent(String(globalCatId))}`
                    : `/products`;
                return (
                  <Link
                    to={href}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Xem thêm
                  </Link>
                );
              })()}
            </div>
            {loadingAllProducts ? (
              <div className="text-xs text-slate-500">Đang tải...</div>
            ) : similarProducts && similarProducts.length > 0 ? (
              <div className="space-y-2">
                {similarProducts.map((p: any) => {
                  const imgSrc = getProductImageUrl(p);
                  return (
                    <Link
                      key={p.id}
                      to={`/products/${p.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-16 h-16 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={imgSrc}
                          alt={p?.name || "product"}
                          loading="lazy"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "/placeholder.svg";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate group-hover:text-rose-700">
                          {p?.name}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {(p?.price ?? 0).toLocaleString("vi-VN")}₫
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Không có sản phẩm tương tự.
              </div>
            )}
          </div>
        </aside>
        {/* Sticky action bar for mobile (chat button removed as per request) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <div className="min-w-0">
              <div className="text-xs text-slate-500">Giá</div>
              <div className="text-base font-semibold text-rose-600 truncate">
                {currentPrice.toLocaleString("vi-VN")}₫
              </div>
            </div>
            <div className="flex-1" />
            {id && (
              <AddToCartButton
                productId={id}
                stockQuantity={stockQuantity}
                className="flex-1"
                disabled={user?.role === "Seller" || user?.role === "Admin"}
              />
            )}
          </div>
        </div>
        {/* Global floating chat button & panel */}
        {!(user?.role === "Seller" || user?.role === "Admin") && (
          <>
            <Button
              onClick={openChat}
              className="fixed bottom-4 right-4 z-50 rounded-full shadow-md px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" /> Chat với shop
            </Button>
            {chatOpen && (
              <div className="fixed bottom-20 right-4 z-50 w-[92vw] max-w-[380px] rounded-xl border shadow-lg bg-white overflow-hidden">
                <div className="px-3 py-2 border-b font-medium">
                  Chat với shop
                </div>
                <div className="flex flex-col gap-3 p-3">
                  <div className="h-64 border rounded-md p-3 overflow-y-auto bg-slate-50">
                    {displayedMessages.length === 0 ? (
                      <div className="text-sm text-slate-500">
                        Chưa có tin nhắn
                      </div>
                    ) : (
                      displayedMessages.map((m, idx) => (
                        <div
                          key={m.messageId ?? idx}
                          className={`mb-2 flex ${m.senderId === (product?.currentUserId || "") ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                              m.senderId === (product?.currentUserId || "")
                                ? "bg-rose-600 text-white"
                                : "bg-white border"
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nhập tin nhắn..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!conversationId || !chatInput.trim()}
                      className="inline-flex items-center gap-2"
                    >
                      <Send size={16} /> Gửi
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setChatOpen(false)}
                      className="ml-1"
                    >
                      Đóng
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
