import React, { useEffect, useMemo, useState } from "react";
import { fetchGlobalCategories } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight } from "lucide-react";

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

  useEffect(() => {
    onChange?.({ categoryId, search });
  }, [categoryId, search]);

  // Keep a quick lookup of nodes by id and children presence for rendering
  const categoriesTree = useMemo(() => {
    return (categoriesData as any[]) || [];
  }, [categoriesData]);

  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});
  const toggleExpand = (id: string) =>
    setExpandedById((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderTree = (nodes: any[], depth = 0) => {
    if (!nodes || !nodes.length) return null;
    return (
      <ul className="space-y-1">
        {nodes.map((node) => {
          const hasChildren = Array.isArray(node.children) && node.children.length > 0;
          const isExpanded = !!expandedById[node.id];
          const isActive = categoryId === node.id;
          return (
            <li key={node.id}>
              <div className="flex items-center">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(node.id)}
                    className="mr-1 p-1 rounded hover:bg-slate-50"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    )}
                  </button>
                ) : (
                  <span className="mr-1 w-6" />
                )}
                <button
                  onClick={() => setCategoryId(node.id)}
                  className={`w-full text-left py-2 px-2 rounded ${
                    isActive ? "bg-rose-50 text-rose-700 font-medium" : "hover:bg-slate-50"
                  }`}
                  style={{ paddingLeft: depth * 12 + 8 }}
                >
                  {node.name}
                </button>
              </div>
              {hasChildren && isExpanded && (
                <div className="ml-6">{renderTree(node.children, depth + 1)}</div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

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
          <div className="text-sm text-slate-600 max-h-64 overflow-auto rounded border border-slate-200">
            <div className="p-1 border-b border-slate-200">
              <button
                onClick={() => setCategoryId(null)}
                className={`w-full text-left py-2 px-2 rounded ${
                  !categoryId ? "bg-slate-100 font-medium" : "hover:bg-slate-50"
                }`}
              >
                Tất cả
              </button>
            </div>
            <div className="p-1">{renderTree(categoriesTree)}</div>
          </div>
        </section>

        {/* Sort removed from sidebar; handled by top toolbar */}
      </div>
    </aside>
  );
}
