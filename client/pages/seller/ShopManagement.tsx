import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import ShopInfoForm from "@/components/seller/ShopInfoForm";
import ProductManagement from "./ProductManagement";

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full bg-white rounded-2xl shadow-md p-6 lg:p-8"
    >
      <Outlet />
    </motion.div>
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
