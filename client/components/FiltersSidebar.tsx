import React, { useEffect, useMemo, useState } from "react";
import { fetchGlobalCategories } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

export type FiltersChanged = {
  categoryId?: string | null;
  sort?: "price_asc" | "price_desc" | "newest" | "best_selling" | null;
  search?: string;
};

export default function FiltersSidebar({
  onChange,
  value,
}: {
  onChange?: (filters: FiltersChanged) => void;
  value?: FiltersChanged;
}) {
  const { data: categoriesData = [] } = useQuery({
    queryKey: ["globalCategories"],
    queryFn: fetchGlobalCategories,
  });

  const [search, setSearch] = useState(value?.search ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    value?.categoryId ?? null,
  );
  const [sort, setSort] = useState<FiltersChanged["sort"]>(value?.sort ?? null);

  useEffect(() => {
    onChange?.({ categoryId, sort, search });
  }, [categoryId, sort, search]);

  const categories = useMemo(() => {
    // Flatten if tree structure
    const result: Array<{ id: string; name: string }> = [];
    const walk = (nodes: any[], prefix = "") => {
      for (const n of nodes || []) {
        result.push({
          id: n.id,
          name: prefix ? `${prefix} / ${n.name}` : n.name,
        });
        if (n.children && n.children.length)
          walk(n.children, prefix ? `${prefix} / ${n.name}` : n.name);
      }
    };
    walk(categoriesData as any[]);
    return result;
  }, [categoriesData]);

  return (
    <aside className="bg-white rounded-2xl p-4 shadow-sm">
      <h4 className="font-semibold text-lg">Bộ lọc</h4>

      <div className="mt-4 space-y-6">
        <section>
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </section>

        <section>
          <h5 className="font-medium mb-2">Danh mục</h5>
          <ul className="text-sm text-slate-600 space-y-1 max-h-64 overflow-auto">
            <li>
              <button
                onClick={() => setCategoryId(null)}
                className={`w-full text-left py-2 px-2 rounded ${!categoryId ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
              >
                Tất cả
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setCategoryId(c.id)}
                  className={`w-full text-left py-2 px-2 rounded ${categoryId === c.id ? "bg-rose-50 text-rose-700 font-medium" : "hover:bg-slate-50"}`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h5 className="font-medium mb-2">Sắp xếp</h5>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setSort("price_asc")}
              className={`px-3 py-2 rounded border ${sort === "price_asc" ? "border-rose-500 text-rose-600" : "border-slate-200"}`}
            >
              Giá từ thấp đến cao
            </button>
            <button
              onClick={() => setSort("price_desc")}
              className={`px-3 py-2 rounded border ${sort === "price_desc" ? "border-rose-500 text-rose-600" : "border-slate-200"}`}
            >
              Giá từ cao đến thấp
            </button>
            <button
              onClick={() => setSort("newest")}
              className={`px-3 py-2 rounded border ${sort === "newest" ? "border-rose-500 text-rose-600" : "border-slate-200"}`}
            >
              Mới nhất
            </button>
            <button
              onClick={() => setSort("best_selling")}
              className={`px-3 py-2 rounded border ${sort === "best_selling" ? "border-rose-500 text-rose-600" : "border-slate-200"}`}
            >
              Bán chạy
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
