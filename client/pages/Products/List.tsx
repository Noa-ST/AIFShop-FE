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
      filter.categoryId = filters.categoryId;
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
  }, [filters, page, pageSize]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["products", "search", productFilter],
    queryFn: () => productService.searchAndFilter(productFilter),
    staleTime: 30 * 1000, // 30 seconds
  });

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