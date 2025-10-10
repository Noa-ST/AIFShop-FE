import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function ProductList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  return (
    <section className="py-12">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Sản phẩm</h1>
          <div className="flex items-center gap-2">
            <input
              placeholder="Tìm kiếm"
              className="px-4 py-2 rounded-full border border-slate-200"
            />
          </div>
        </div>

        {isLoading && <p>Đang tải sản phẩm...</p>}
        {error && <p className="text-red-500">Không thể tải sản phẩm</p>}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data && data.map((p: any) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
