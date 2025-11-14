import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchShopBySeller, isShopPresent } from "@/lib/api";
import SellerNavbar from "@/components/seller/SellerNavbar";
import SellerSidebar from "@/components/seller/SellerSidebar";

export default function SellerLayout() {
  const { user, isAuthenticated, initialized } = useAuth();
  const navigate = useNavigate();

  // Sử dụng React Query để cache shop data, tránh gọi API nhiều lần
  const {
    data: shop,
    isLoading: checkingShop,
    error,
  } = useQuery({
    queryKey: ["shopBySeller", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await fetchShopBySeller(user.id);
    },
    enabled:
      initialized && isAuthenticated && user?.role === "Seller" && !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache 5 phút - shop data không thay đổi thường xuyên
    retry: (failureCount, error: any) => {
      // Chỉ retry nếu không phải lỗi 404 hoặc 400 (shop chưa tồn tại)
      const status = error?.response?.status;
      if (status === 404 || status === 400) {
        return false; // Không retry nếu shop không tồn tại
      }
      return failureCount < 1; // Chỉ retry 1 lần cho các lỗi khác
    },
  });

  useEffect(() => {
    if (!initialized) return;

    if (!isAuthenticated || user?.role !== "Seller") {
      navigate("/login", { replace: true });
      return;
    }

    // Kiểm tra shop sau khi query hoàn thành
    if (!checkingShop) {
      const status = error?.response?.status;
      if (status === 404 || status === 400 || !isShopPresent(shop)) {
        navigate("/seller/create-shop", { replace: true });
        return;
      }
    }
  }, [
    initialized,
    isAuthenticated,
    user?.role,
    shop,
    checkingShop,
    error,
    navigate,
  ]);

  if (!initialized || checkingShop) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#fefefe]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e91e63] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "Seller") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#fefefe]">
      {/* Navbar - Already fixed in SellerNavbar component */}
      <SellerNavbar />

      {/* Main Layout - with padding-top for navbar */}
      <div className="flex pt-16 min-h-screen">
        {/* Sidebar */}
        <SellerSidebar />

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
