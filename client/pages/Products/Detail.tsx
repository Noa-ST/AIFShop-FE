import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addToCart, fetchProductById } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const { isAuthenticated, initialized } = useAuth();
  const queryClient = useQueryClient();
  const [qty, setQty] = useState<number>(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id as string),
    enabled: !!id,
  });

  // ----------------------------------------------------
  // Hooks must be called unconditionally at the top-level
  // ----------------------------------------------------
  const [mainImage, setMainImage] = useState<string>("/placeholder.svg");

  // Now safe to compute product and images (not hooks)
  const product: any = data || {};

  // Normalize images from multiple possible shapes
  const images: string[] = useMemo(() => {
    const normalize = (arr: any[]): string[] =>
      (arr || [])
        .map((i: any) => {
          if (!i) return null as any;
          if (typeof i === "string") return i;
          return (
            i.url || i.imageUrl || i.src || i.path || i.Location || null
          );
        })
        .filter(Boolean) as string[];

    return (
      normalize(product?.productImages) ||
      normalize(product?.images) ||
      normalize(product?.gallery) ||
      (product?.imageUrl ? [product.imageUrl] : undefined) ||
      (product?.image ? [product.image] : undefined) ||
      []
    );
  }, [product]);

  // Keep mainImage in sync when images change
  useEffect(() => {
    if (images && images.length) setMainImage(images[0]);
  }, [images]);

  // Shop info may be present in several shapes
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

  // Conditional returns (safe because hooks are already declared)
  if (isLoading) return <div className="p-8">Đang tải...</div>;
  if (error)
    return <div className="p-8 text-red-500">Lỗi khi tải sản phẩm</div>;

  const { mutateAsync: mutateAdd, isPending } = useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Đã thêm vào giỏ hàng" });
    },
    onError: () => {
      toast({ title: "Thêm vào giỏ thất bại", description: "Vui lòng thử lại." });
    },
  });

  const handleAddToCart = async () => {
    if (!initialized) return;
    if (!isAuthenticated) {
      toast({ title: "Vui lòng đăng nhập để thêm vào giỏ" });
      try {
        window.location.href = "/login";
      } catch {}
      return;
    }
    if (!id) return;
    const quantity = Math.max(1, Number(qty || 1));
    await mutateAdd({ productId: id, quantity });
  };

  return (
    <section className="py-12">
      <div className="container mx-auto grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group rounded-2xl overflow-hidden bg-white shadow-md"
              >
                <img
                  src={mainImage}
                  alt={product?.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "/placeholder.svg";
                    (e.currentTarget as HTMLImageElement).onerror = null;
                  }}
                  className="w-full h-[520px] object-cover transition-transform duration-300 ease-out group-hover:scale-105 cursor-zoom-in"
                />
              </motion.div>

              {images && images.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto relative z-50">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        // guard and set
                        if (img) setMainImage(img);
                      }}
                      aria-label={`Chọn ảnh ${idx + 1}`}
                      className={`relative z-50 w-20 h-20 rounded-md overflow-hidden ${
                        mainImage === img
                          ? "border-2 border-rose-600"
                          : "border border-slate-200 hover:border-slate-300"
                      }`}
                      style={{
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <img
                        src={img}
                        alt={`thumb-${idx}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/placeholder.svg";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h1 className="text-3xl font-semibold">{product?.name}</h1>
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
                  <div className="px-2 py-0.5 text-xs rounded bg-rose-100 text-rose-700 font-semibold">
                    -{discountPercent}%
                  </div>
                )}
              </div>

              {(rating > 0 || ratingCount > 0) && (
                <div className="mt-2 text-sm text-slate-600">
                  ⭐ {rating.toFixed(1)} / 5 {ratingCount ? `(${ratingCount})` : ""}
                </div>
              )}

              <div className="mt-4 text-slate-600">
                {product?.shortDescription || product?.description}
              </div>

              <div className="mt-6 flex items-center gap-4">
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
                  min={1}
                  className="w-20 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={handleAddToCart}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white disabled:opacity-60 hover:shadow-md transition"
                >
                  <ShoppingCart size={18} /> Thêm vào giỏ
                </button>
                <button className="px-4 py-2 rounded-full border border-slate-200">
                  Yêu thích
                </button>
              </div>

              <div className="mt-6 border-t pt-4">
                {shop && (
                  <div className="flex items-center justify-between">
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
                      className="text-rose-600 hover:underline"
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
              <Tabs defaultValue="desc">
                <TabsList>
                  <TabsTrigger value="desc">Mô tả</TabsTrigger>
                  <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
                  <TabsTrigger value="related">Sản phẩm tương tự</TabsTrigger>
                </TabsList>
                <TabsContent value="desc" className="mt-4">
                  <div className="prose max-w-none text-slate-700">
                    {product?.description || "Chưa có mô tả."}
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="mt-4 text-slate-600">
                  Tính năng đánh giá sẽ cập nhật sau.
                </TabsContent>
                <TabsContent value="related" className="mt-4 text-slate-600">
                  Đang phát triển danh sách sản phẩm tương tự.
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="bg-white rounded-2xl p-6 shadow-md">
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
        </aside>
      </div>
    </section>
  );
}
