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

    // Debug: Log tổng số sản phẩm và status distribution
    if (process.env.NODE_ENV === 'development' && list.length > 0) {
      const statusCounts = {
        total: list.length,
        approved: 0,
        pending: 0,
        rejected: 0,
        other: 0,
      };
      list.forEach((p: any) => {
        const status = p?.status;
        if (status === 1 || status === "Approved" || status === "approved" || p?.isApproved === true) {
          statusCounts.approved++;
        } else if (status === 0 || status === "Pending" || status === "pending") {
          statusCounts.pending++;
        } else if (status === 2 || status === "Rejected" || status === "rejected") {
          statusCounts.rejected++;
        } else {
          statusCounts.other++;
        }
      });
      console.log("Product status distribution:", statusCounts);
    }

    // Chỉ hiển thị sản phẩm đã được admin duyệt (Approved)
    // Pending = đang chờ duyệt (status = 0 hoặc "Pending")
    // Approved = đã được duyệt (status = 1 hoặc "Approved")
    const beforeFilter = out.length;
    out = out.filter((p) => {
      const status = p?.status;
      const isApproved = p?.isApproved;
      const isActive = p?.isActive;
      const approvalStatus = p?.approvalStatus || p?.productStatus || p?.moderationStatus;
      
      // Debug logging trong development
      if (process.env.NODE_ENV === 'development' && !status && !isApproved && !isActive) {
        console.log("Product without clear status:", {
          id: p?.id,
          name: p?.name,
          status,
          isApproved,
          isActive,
          approvalStatus,
        });
      }
      
      // Logic 1: Check explicit isApproved flag
      if (typeof isApproved === 'boolean' && isApproved) {
        return true;
      }
      
      // Logic 2: Check isActive (thường là approved)
      if (typeof isActive === 'boolean' && isActive) {
        // Nếu có status cụ thể, kiểm tra status
        if (status !== undefined && status !== null) {
          // status = 1 hoặc "Approved" => đã duyệt
          return status === 1 || status === "Approved" || status === "approved";
        }
        return true; // isActive = true thường có nghĩa là approved
      }
      
      // Logic 3: Check status field
      if (status !== undefined && status !== null) {
        // Theo Admin ProductManagement: status = 1 => Approved, status = 0 => Pending
        if (typeof status === 'number') {
          return status === 1; // Chỉ Approved
        }
        if (typeof status === 'string') {
          const statusLower = status.toLowerCase().trim();
          return statusLower === 'approved' || statusLower === '1';
        }
      }
      
      // Logic 4: Check approvalStatus/productStatus/moderationStatus
      if (approvalStatus) {
        const approvalLower = String(approvalStatus).toLowerCase().trim();
        return approvalLower === 'approved' || approvalLower === '1' || approvalLower === 'active';
      }
      
      // Mặc định: không hiển thị nếu không có thông tin status rõ ràng
      return false;
    });

    // Debug: Log số sản phẩm sau khi filter
    if (process.env.NODE_ENV === 'development') {
      console.log(`Filtered products: ${out.length} / ${beforeFilter} (only Approved)`);
    }

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
