import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

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
  shop?: {
    logoUrl?: string;
  };
};

export default function ProductCard({ product }: { product: Product }) {
  // Use the first product image url, fallback to shop logo, then placeholder
  const imageSrc =
    product.productImages?.[0]?.url ?? product.shop?.logoUrl ?? "/placeholder.svg";

  const oldPrice = (product as any).oldPrice ?? (product as any).listPrice ?? null;
  const price = (product as any).price ?? product.price ?? 0;
  const discount = oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const rating = (product as any).rating ?? 4.5;

  return (
    <Link to={`/products/${product.id}`} className="group">
      <motion.div
        whileHover={{ y: -6 }}
        className="relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col"
      >
        <div className="overflow-hidden rounded-2xl bg-gray-50 p-6 flex items-center justify-center mb-4" style={{aspectRatio: '1/1'}}>
          <img
            src={imageSrc}
            alt={product.name}
            onError={(e) => {
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

          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold text-slate-900">${price}</div>
            {oldPrice ? (
              <div className="text-sm text-slate-400 line-through">${oldPrice}</div>
            ) : null}
            {discount ? (
              <div className="ml-auto bg-pink-50 text-pink-600 text-xs font-semibold px-2 py-1 rounded-full">-{discount}%</div>
            ) : null}
          </div>
        </div>

      </motion.div>
    </Link>
  );
}
