import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProductById } from "@/lib/api";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function ProductDetail() {
  const { id } = useParams();
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
  const images: string[] =
    product?.productImages?.map((i: any) => i.url) ||
    product?.images?.map((i: any) => i.url) ||
    (product?.imageUrl ? [product.imageUrl] : null) ||
    (product?.image ? [product.image] : null) ||
    product?.gallery?.map((i: any) => i.url) ||
    [];

  // Keep mainImage in sync when images change
  useEffect(() => {
    if (images && images.length) setMainImage(images[0]);
  }, [images]);

  // Shop info may be present in several shapes
  const shop = product?.shop || product?.shopInfo || product?.seller;

  // Conditional returns (safe because hooks are already declared)
  if (isLoading) return <div className="p-8">Đang tải...</div>;
  if (error)
    return <div className="p-8 text-red-500">Lỗi khi tải sản phẩm</div>;

  return (
    <section className="py-12">
      <div className="container mx-auto grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl overflow-hidden bg-white shadow-md"
              >
                <img
                  src={mainImage}
                  alt={product?.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "/placeholder.svg";
                    (e.currentTarget as HTMLImageElement).onerror = null;
                  }}
                  className="w-full h-[520px] object-cover"
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
                      className={`relative z-50 w-20 h-20 rounded-md overflow-hidden ${mainImage === img ? "border-2 border-rose-600" : "border border-slate-200"}`}
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
              <p className="text-rose-600 font-bold text-2xl mt-2">
                {(product?.price || 0).toLocaleString("vi-VN")}₫
              </p>

              <div className="mt-4 text-slate-600">
                {product?.shortDescription || product?.description}
              </div>

              <div className="mt-6 flex items-center gap-4">
                <input
                  type="number"
                  defaultValue={1}
                  min={1}
                  className="w-20 px-3 py-2 border rounded-md"
                />
                <button className="px-6 py-3 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white">
                  Thêm vào giỏ
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
              <h3 className="text-lg font-semibold mb-3">Mô tả sản phẩm</h3>
              <div className="prose max-w-none text-slate-700">
                {product?.description}
              </div>
            </div>

            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Đánh giá</h3>
              <p className="text-slate-600">
                Khu vực hiển thị đánh giá người dùng (đang phát triển)
              </p>
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
