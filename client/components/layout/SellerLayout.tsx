import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { fetchShopBySeller, isShopPresent } from "@/lib/api";
import SellerNavbar from "@/components/seller/SellerNavbar";
import SellerSidebar from "@/components/seller/SellerSidebar";

export default function SellerLayout() {
  const { user, isAuthenticated, initialized } = useAuth();
  const navigate = useNavigate();
  const [checkingShop, setCheckingShop] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!initialized) return;

      if (!isAuthenticated || user?.role !== "Seller") {
        navigate("/login", { replace: true });
        return;
      }

      try {
        if (!user?.id) {
          setCheckingShop(false);
          return;
        }
        const shop = await fetchShopBySeller(user.id);
        if (!isShopPresent(shop)) {
          navigate("/seller/create-shop", { replace: true });
          return;
        }
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 404 || status === 400) {
          navigate("/seller/create-shop", { replace: true });
          return;
        }
      } finally {
        setCheckingShop(false);
      }
    };

    run();
  }, [initialized, isAuthenticated, user, navigate]);

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
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)]">
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
