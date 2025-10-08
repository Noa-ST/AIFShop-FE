import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProductById } from "@/lib/api";
import { motion } from "framer-motion";

export default function ProductDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery(["product", id], () => fetchProductById(id as string), { enabled: !!id });

  if (isLoading) return <div className="p-8">Đang tải...</div>;
  if (error) return <div className="p-8 text-red-500">Lỗi khi tải sản phẩm</div>;

  const product = data;

  return (
    <section className="py-12">
      <div className="container mx-auto grid md:grid-cols-2 gap-8">
        <div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl overflow-hidden bg-white shadow-md">
            <img src={product?.imageUrl || product?.image || "/public/placeholder.svg"} alt={product?.name} className="w-full h-[480px] object-cover" />
          </motion.div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h1 className="text-2xl font-semibold">{product?.name}</h1>
          <p className="text-rose-600 font-bold text-xl mt-2">{(product?.price || 0).toLocaleString("vi-VN")}₫</p>
          <p className="mt-4 text-slate-600">{product?.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <button className="px-6 py-3 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white">Thêm vào giỏ</button>
            <button className="px-4 py-2 rounded-full border border-slate-200">Yêu thích</button>
          </div>
        </div>
      </div>
    </section>
  );
}
