import { Link, NavLink } from "react-router-dom";
import { ShoppingCart, Store, Home, Boxes, LogIn, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect, useMemo } from "react";
import { useCart } from "@/contexts/CartContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-full text-sm font-medium transition-colors ${
    isActive ? "bg-rose-100 text-rose-700" : "text-slate-700 hover:bg-slate-100"
  }`;

export default function SiteHeader() {
  const { isAuthenticated, user, logoutUser, initialized } = useAuth();
  const { getTotalItems } = useCart();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const cartCount = useMemo(() => {
    if (!initialized) {
      return 0;
    }
    // Lấy tổng số item trong giỏ nếu có; với Seller có thể là 0
    return getTotalItems();
  }, [initialized, getTotalItems]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-200">
      <div className="container mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow"
          />
          <span className="text-xl font-semibold tracking-tight">AIFShop</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/home" className={navLinkClass}>
            <div className="flex items-center gap-2">
              <Home size={16} />
              Trang chủ
            </div>
          </NavLink>
          <NavLink to="/shops" className={navLinkClass}>
            <div className="flex items-center gap-2">
              <Store size={16} />
              Shops
            </div>
          </NavLink>
          <NavLink to="/products" className={navLinkClass}>
            <div className="flex items-center gap-2">
              <Boxes size={16} />
              Sản phẩm
            </div>
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {initialized && !isAuthenticated && (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm hover:bg-slate-50"
            >
              <LogIn size={16} /> Đăng nhập
            </Link>
          )}

          {/* Chỉ hiển thị giỏ hàng cho khách (chưa login) hoặc Customer */}
          {(!isAuthenticated || user?.role === "Customer") && (
            <Link
              to="/cart"
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
            >
              <ShoppingCart size={18} />
              <span>Giỏ hàng</span>
              <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 bg-black text-white rounded-full">
                {cartCount || 0}
              </span>
            </Link>
          )}

          {isAuthenticated && (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((s) => !s)}
                className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-white/80"
              >
                <User size={16} />
                <span className="hidden sm:inline-block">
                  {user?.fullname?.split(" ")[0] || user?.email}
                </span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-md py-2 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Hồ sơ
                  </Link>
                  {user?.role === "Customer" && (
                    <Link
                      to="/orders/my"
                      className="block px-4 py-2 text-sm hover:bg-slate-50"
                    >
                      Đơn hàng của tôi
                    </Link>
                  )}
                  {user?.role === "Seller" && (
                    <Link
                      to="/seller/shop-management"
                      className="block px-4 py-2 text-sm hover:bg-slate-50"
                    >
                      Quản lý Shop
                    </Link>
                  )}
                  {/* Bỏ mục Đơn hàng cửa hàng khỏi menu trang chủ - đã có trong quản lý shop */}
                  {user?.role === "Admin" && (
                    <>
                      <Link
                        to="/admin/global-categories"
                        className="block px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        Dashboard Admin
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => logoutUser()}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
