import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative bg-white rounded-2xl p-3 shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow"
    >
      <div className="overflow-hidden rounded-xl aspect-[4/3] bg-rose-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="pt-3">
        <h3 className="text-slate-900 font-medium truncate" title={product.name}>{product.name}</h3>
        <p className="text-rose-600 font-semibold">{product.price.toLocaleString("vi-VN")}₫</p>
      </div>
      <button
        className="absolute right-4 bottom-4 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Thêm vào giỏ hàng"
      >
        <ShoppingCart size={16} /> Thêm vào giỏ
      </button>
    </motion.div>
  );
}
