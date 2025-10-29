import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { fetchShopBySeller, isShopPresent } from "@/lib/api";

export default function SellerLayout() {
  const { user, isAuthenticated, initialized } = useAuth();
  const navigate = useNavigate();
  const [checkingShop, setCheckingShop] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!initialized) return; // wait for auth init

      if (!isAuthenticated || user?.role !== "Seller") {
        navigate("/login", { replace: true });
        return;
      }

      // Ensure seller has a shop; if not, redirect to create-shop
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
        // other errors: let page render and surface via children
      } finally {
        setCheckingShop(false);
      }
    };

    run();
  }, [initialized, isAuthenticated, user, navigate]);

  if (!initialized || checkingShop) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "Seller") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
