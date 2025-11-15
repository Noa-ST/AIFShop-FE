import ProductCard from "@/components/ProductCard";
import FiltersSidebar, { type FiltersChanged } from "@/components/FiltersSidebar";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import productService, { ProductStatus, ProductFilterDto } from "@/services/productService";
import globalCategoryService from "@/services/globalCategoryService";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState<FiltersChanged>({});

  // Initialize filters from URL query params (e.g., ?categoryId=xxx&q=keyword)
  useEffect(() => {
    const cid = searchParams.get("categoryId");
    const q = searchParams.get("q");
    setFilters((f) => ({
      ...f,
      categoryId: cid ?? f.categoryId ?? null,
      search: q ?? f.search ?? "",
    }));
  }, []);

  // Fetch descendants when a category is selected
  const { data: descendantIds = [], isFetching: fetchingDesc } = useQuery({
    queryKey: ["category-descendants", filters.categoryId],
    queryFn: async () => {
      const id = filters.categoryId;
      if (!id) return [] as string[];
      const ids = await globalCategoryService.getDescendants(id, false);
      return Array.isArray(ids) ? ids : [];
    },
    enabled: !!filters.categoryId,
    staleTime: 60 * 1000,
  });

  // Convert FiltersChanged to ProductFilterDto
  const productFilter: ProductFilterDto = useMemo(() => {
    const filter: ProductFilterDto = {
      page,
      pageSize,
      status: ProductStatus.Approved, // Only show approved products
    };

    if (filters.search) {
      filter.keyword = filters.search;
    }

    if (filters.categoryId) {
      if (descendantIds && descendantIds.length > 0) {
        // Parent selected: use descendants only
        filter.categoryIds = descendantIds;
      } else {
        // Leaf selected: use single categoryId
        filter.categoryId = filters.categoryId;
      }
    }

    // Map sort options
    if (filters.sort) {
      switch (filters.sort) {
        case "price_asc":
          filter.sortBy = "price";
          filter.sortOrder = "asc";
          break;
        case "price_desc":
          filter.sortBy = "price";
          filter.sortOrder = "desc";
          break;
        case "newest":
          filter.sortBy = "createdAt";
          filter.sortOrder = "desc";
          break;
        case "best_selling":
          // Note: Backend might not support this, fallback to createdAt
          filter.sortBy = "createdAt";
          filter.sortOrder = "desc";
          break;
      }
    }

    return filter;
  }, [filters, page, pageSize, descendantIds]);

  // Decide whether to use client-side merge (for parent categories)
  const shouldClientMerge = !!(filters.categoryId && descendantIds && descendantIds.length > 0);

  // Server-side search (normal flow)
  const {
    data: serverData,
    isLoading: serverLoading,
    error: serverError,
    refetch: serverRefetch,
  } = useQuery({
    queryKey: ["products", "search", productFilter],
    queryFn: () => productService.searchAndFilter(productFilter),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !shouldClientMerge,
  });

  // Client-side merge for parent categories: fetch each descendant's products and combine
  const {
    data: mergedData,
    isLoading: mergedLoading,
    error: mergedError,
    refetch: mergedRefetch,
  } = useQuery({
    queryKey: [
      "products",
      "merge-descendants",
      filters.categoryId,
      descendantIds,
      page,
      pageSize,
      filters.search,
      filters.sort,
    ],
    enabled: shouldClientMerge,
    queryFn: async () => {
      const ids = descendantIds || [];
      if (!Array.isArray(ids) || ids.length === 0) {
        return {
          data: [],
          page,
          pageSize,
          totalCount: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        };
      }

      // Fetch in parallel for each descendant category
      const lists = await Promise.all(
        ids.map((cid) => productService.getByCategoryId(cid))
      );
      const flattened = ([] as any[]).concat(...lists);

      // Deduplicate by product id
      const uniqueMap = new Map<string, any>();
      for (const p of flattened) {
        const pid = String(p?.id ?? "");
        if (!uniqueMap.has(pid)) uniqueMap.set(pid, p);
      }
      let result = Array.from(uniqueMap.values());

      // Only approved
      result = result.filter((p: any) => String(p?.status) === String(ProductStatus.Approved));

      // Keyword filter (client)
      const keyword = (productFilter.keyword || "").trim().toLowerCase();
      if (keyword) {
        result = result.filter((p: any) =>
          (String(p?.name || "").toLowerCase().includes(keyword)) ||
          (String(p?.description || "").toLowerCase().includes(keyword))
        );
      }

      // Sort (client)
      if (productFilter.sortBy) {
        const { sortBy, sortOrder } = productFilter;
        const asc = (sortOrder || "asc").toLowerCase() === "asc";
        result.sort((a: any, b: any) => {
          const va = a?.[String(sortBy)];
          const vb = b?.[String(sortBy)];
          if (va == null && vb == null) return 0;
          if (va == null) return asc ? -1 : 1;
          if (vb == null) return asc ? 1 : -1;
          if (typeof va === "string" && typeof vb === "string") {
            return asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
          }
          const na = Number(va);
          const nb = Number(vb);
          return asc ? na - nb : nb - na;
        });
      }

      // Pagination (client)
      const totalCount = result.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageData = result.slice(start, end);

      return {
        data: pageData,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      };
    },
    staleTime: 15 * 1000,
  });

  // Unified data/error/loading refs
  const data = shouldClientMerge ? mergedData : serverData;
  const isLoading = shouldClientMerge ? mergedLoading : serverLoading;
  const error = shouldClientMerge ? mergedError : serverError;
  const refetch = shouldClientMerge ? mergedRefetch : serverRefetch;

  // Debug: log current filter and results (dev only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      const params = new URLSearchParams();
      if (productFilter.page) params.append("page", String(productFilter.page));
      if (productFilter.pageSize)
        params.append("pageSize", String(productFilter.pageSize));
      if (productFilter.keyword) params.append("keyword", productFilter.keyword);
      if (productFilter.shopId) params.append("shopId", productFilter.shopId);
      if (Array.isArray(productFilter.categoryIds)) {
        for (const id of productFilter.categoryIds) params.append("categoryIds", id);
      } else if (productFilter.categoryId) {
        params.append("categoryId", productFilter.categoryId);
      }
      if (productFilter.status !== undefined)
        params.append("status", String(productFilter.status));
      if (productFilter.minPrice !== undefined)
        params.append("minPrice", String(productFilter.minPrice));
      if (productFilter.maxPrice !== undefined)
        params.append("maxPrice", String(productFilter.maxPrice));
      if (productFilter.sortBy) params.append("sortBy", productFilter.sortBy);
      if (productFilter.sortOrder)
        params.append("sortOrder", productFilter.sortOrder);

      console.log("[Products] Applied filter", {
        categoryId: filters.categoryId,
        descendantIds,
        query: `/api/Products/search?${params.toString()}`,
        clientMerge: shouldClientMerge,
        totalCount: data?.totalCount,
        returned: Array.isArray(data?.data) ? data?.data.length : 0,
      });
    }
  }, [productFilter, data, descendantIds, filters.categoryId, shouldClientMerge]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.categoryId, filters.sort]);

  const products = data?.data || [];
  const pagination = data
    ? {
        totalCount: data.totalCount,
        totalPages: data.totalPages,
        hasPreviousPage: data.hasPreviousPage,
        hasNextPage: data.hasNextPage,
      }
    : null;

  const clearCategory = () => setFilters((f) => ({ ...f, categoryId: null }));
  const clearSearch = () => setFilters((f) => ({ ...f, search: "" }));

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="text-sm text-slate-500 mb-3">
          <span className="text-slate-600">Home</span>
          <span className="mx-2">/</span>
          <span className="text-rose-600 font-medium">Sản phẩm</span>
        </nav>

        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-3xl font-semibold tracking-tight">Sản phẩm</h1>
          <div className="text-sm text-slate-500">
            {isLoading
              ? "Đang tải..."
              : pagination
                ? `${pagination.totalCount} sản phẩm`
                : "0 sản phẩm"}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            {filters.search ? (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={clearSearch}
                title="Xóa tìm kiếm"
              >
                Từ khóa: "{filters.search}"
              </Badge>
            ) : null}
            {filters.categoryId ? (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={clearCategory}
                title="Xóa danh mục"
              >
                Đã chọn danh mục
              </Badge>
            ) : null}
            {!filters.search && !filters.categoryId ? (
              <span className="text-sm text-slate-500">
                Không có bộ lọc nào đang áp dụng
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Sắp xếp</span>
            <Select
              value={filters.sort ?? undefined}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, sort: v as FiltersChanged["sort"] }))
              }
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Mặc định" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_asc">Giá từ thấp đến cao</SelectItem>
                <SelectItem value="price_desc">Giá từ cao đến thấp</SelectItem>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="best_selling">Bán chạy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sticky sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <FiltersSidebar value={filters} onChange={setFilters} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                Lỗi khi tải danh sách sản phẩm. Vui lòng thử lại.
              </div>
            )}

            {/* Loading state */}
            {isLoading ? (
              <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <div className="mt-3 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-16 text-center">
                <div className="text-2xl font-semibold text-slate-800">
                  Không tìm thấy sản phẩm
                </div>
                <p className="mt-2 text-slate-500">
                  Thử điều chỉnh bộ lọc hoặc từ khóa để tìm sản phẩm phù hợp.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                  {products.map((p: any) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={!pagination.hasPreviousPage || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Trước
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              disabled={isLoading}
                              className="min-w-[40px]"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={!pagination.hasNextPage || isLoading}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>

                    <span className="text-sm text-slate-600 ml-4">
                      Trang {page} / {pagination.totalPages} ({pagination.totalCount}{" "}
                      sản phẩm)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}