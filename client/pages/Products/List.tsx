import ProductCard from "@/components/ProductCard";
import FiltersSidebar, { type FiltersChanged } from "@/components/FiltersSidebar";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api";
import { useMemo, useState } from "react";

export default function ProductList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["productsAll"],
    queryFn: fetchProducts,
  });

  const [filters, setFilters] = useState<FiltersChanged>({});

  const products = useMemo(() => {
    const list: any[] = data?.data || data || [];
    let out = [...list];

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      out = out.filter((p) =>
        (p?.name || "").toLowerCase().includes(q),
      );
    }

    if (filters.categoryId) {
      out = out.filter(
        (p) => p?.categoryId === filters.categoryId || p?.globalCategoryId === filters.categoryId,
      );
    }

    switch (filters.sort) {
      case "price_asc":
        out.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price_desc":
        out.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "newest":
        out.sort(
          (a, b) => new Date(b.createdAt || b.createDate || b.createdDate || 0).getTime() -
            new Date(a.createdAt || a.createDate || a.createdDate || 0).getTime(),
        );
        break;
      case "best_selling":
        out.sort((a, b) => (b.sales || b.sold || 0) - (a.sales || a.sold || 0));
        break;
    }

    return out;
  }, [data, filters]);

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <nav className="text-sm text-slate-500 mb-4">Home &gt; Sản phẩm</nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold">Sản phẩm</h1>
          <div className="text-sm text-slate-500">
            {isLoading ? "Đang tải..." : `${products.length} sản phẩm`}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <FiltersSidebar value={filters} onChange={setFilters} />
          </div>

          <div className="col-span-12 lg:col-span-9">
            {error && (
              <div className="text-red-500 mb-4">Lỗi khi tải danh sách sản phẩm</div>
            )}
            <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
              {products.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
