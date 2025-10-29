import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import ShopLayout from "@/components/seller/ShopLayout";
import ShopInfoForm from "@/components/seller/ShopInfoForm";
import ProductManagement from "./ProductManagement";
import { motion } from "framer-motion";

export default function ShopManagement() {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to info page if on base route
  useEffect(() => {
    if (location.pathname === "/seller/shop-management") {
      navigate("/seller/shop-management/info", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <ShopLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-md p-8 lg:p-10"
      >
        <Outlet />
      </motion.div>
    </ShopLayout>
  );
}

// Info Page Component
export function ShopInfoPage() {
  return <ShopInfoForm />;
}

// Products Page Component
export function ShopProductsPage() {
  return <ProductManagement />;
}
