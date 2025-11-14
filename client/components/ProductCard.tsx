import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrencyVND } from "@/lib/utils";
import { ProductStatus } from "@/services/productService";
import { Badge } from "@/components/ui/badge";
import { getProductImageUrl } from "@/utils/imageUrl";
import { useEffect } from "react";
import eventsService from "@/services/eventsService";

export type ProductImageDto = {
  id: string;
  url: string;
};

export type Product = {
  id: string;
  name: string;
  price?: number;
  // support multiple backend shapes
  productImages?: ProductImageDto[];
  image?: string;
  oldPrice?: number;
  listPrice?: number;
  rating?: number;
  status?: ProductStatus | number; // ProductStatus enum or number
  stockQuantity?: number;
  shop?: {
    logoUrl?: string;
    name?: string;
  };
  // For seller/admin view
  showStatus?: boolean;
};

export default function ProductCard({ product }: { product: Product }) {
  // Chọn ảnh hiển thị từ nhiều nguồn và chuẩn hóa URL
  const imageSrc = getProductImageUrl(product);

  const oldPrice = (product as any).oldPrice ?? (product as any).listPrice ?? null;
  const price = (product as any).price ?? product.price ?? 0;
  const discount = oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const rating = (product as any).rating ?? (product as any).averageRating ?? 0;
  const shopName = (product as any)?.shop?.name || (product as any)?.shopName || (product as any)?.shop?.title;
  
  // Status handling
  const status = product.status !== undefined ? Number(product.status) : undefined;
  const stockQuantity = product.stockQuantity ?? (product as any).stock ?? 0;
  const isOutOfStock = stockQuantity === 0;
  const showStatus = product.showStatus ?? false;

  // Get status badge
  const getStatusBadge = () => {
    if (!showStatus || status === undefined) return null;

    switch (status) {
      case ProductStatus.Pending:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Chờ duyệt
          </Badge>
        );
      case ProductStatus.Rejected:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Đã từ chối
          </Badge>
        );
      case ProductStatus.Approved:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Đã duyệt
          </Badge>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    eventsService.trackImpression("product", product.id);
  }, [product.id]);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group"
      onClick={() => eventsService.trackClick("product", product.id)}
    >
      <motion.div
        whileHover={{ y: -6 }}
        className="relative bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-lg hover:border-rose-200 transition-all h-full flex flex-col"
      >
        <div className={`relative overflow-hidden rounded-xl bg-gray-50 p-6 flex items-center justify-center mb-4 ${isOutOfStock ? 'opacity-60' : ''}`} style={{aspectRatio: '1/1'}}>
          {discount ? (
            <div className="absolute left-2 top-2 z-[1] rounded-full bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
              -{discount}%
            </div>
          ) : null}
          {getStatusBadge() && (
            <div className="absolute right-2 top-2 z-[1]">
              {getStatusBadge()}
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[1]">
              <div className="bg-white px-3 py-1 rounded-md text-sm font-semibold text-gray-900">
                Hết hàng
              </div>
            </div>
          )}
          <img
            src={imageSrc}
            alt={product.name}
            onLoad={(e) => {
              // Log chỉ trong môi trường dev để xác định sản phẩm nào hiển thị ảnh
              if ((import.meta as any)?.env?.DEV) {
                const el = e.currentTarget as HTMLImageElement;
                console.info("[Image OK] product:", product.id, "src:", el.currentSrc || el.src);
              }
            }}
            onError={(e) => {
              if ((import.meta as any)?.env?.DEV) {
                const el = e.currentTarget as HTMLImageElement;
                console.warn("[Image FAIL] product:", product.id, "src:", el.src);
              }
              (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
              (e.currentTarget as HTMLImageElement).onerror = null;
            }}
            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900 mb-1 line-clamp-2" title={product.name}>
            {product.name}
          </h3>

          {rating > 0 && (
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center text-yellow-400 text-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.round(rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1" className="mr-0.5">
                    <path d="M12 .587l3.668 7.431L23.4 9.752l-5.7 5.556L18.835 24 12 19.897 5.165 24l1.135-8.692L.6 9.752l7.732-1.734z" />
                  </svg>
                ))}
                <span className="text-xs text-slate-500 ml-2">{rating.toFixed(1)}/5</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold text-slate-900">{formatCurrencyVND(price)}</div>
            {oldPrice ? (
              <div className="text-sm text-slate-400 line-through">{formatCurrencyVND(oldPrice)}</div>
            ) : null}
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                <ShoppingCart className="h-3.5 w-3.5" />
                Xem chi tiết
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            {shopName && (
              <div className="text-sm text-slate-600">{shopName}</div>
            )}
            {showStatus && stockQuantity !== undefined && (
              <div className="text-xs text-slate-500">
                Tồn: {stockQuantity}
              </div>
            )}
          </div>
        </div>

      </motion.div>
    </Link>
  );
}
