import { Link, NavLink } from "react-router-dom";
import { Store, Home, Boxes, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-full text-sm font-medium transition-colors ${
    isActive ? "bg-rose-100 text-rose-700" : "text-slate-700 hover:bg-slate-100"
  }`;

export default function SellerNavbar() {
  const { user, logoutUser } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-200"
    >
      <div className="container mx-auto flex items-center justify-between h-16">
        {/* Logo - Only icon, no text */}
        <Link to="/" className="flex items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow flex items-center justify-center"
          >
            <Store size={20} className="text-white" />
          </motion.div>
        </Link>

        {/* Navigation Links */}
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

        {/* User Info */}
        <div className="flex items-center gap-2">
          {user && (
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
                    onClick={() => setOpen(false)}
                  >
                    Hồ sơ
                  </Link>
                  <Link
                    to="/seller/shop-management"
                    className="block px-4 py-2 text-sm hover:bg-slate-50"
                    onClick={() => setOpen(false)}
                  >
                    Quản lý Shop
                  </Link>
                  <button
                    onClick={() => {
                      logoutUser?.();
                      setOpen(false);
                    }}
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
    </motion.header>
  );
}
