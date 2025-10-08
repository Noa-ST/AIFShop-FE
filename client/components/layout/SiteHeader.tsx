import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingCart, Store, Home, Boxes, LogIn } from "lucide-react";
import { motion } from "framer-motion";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-full text-sm font-medium transition-colors ${
    isActive ? "bg-rose-100 text-rose-700" : "text-slate-700 hover:bg-slate-100"
  }`;

export default function SiteHeader() {
  const location = useLocation();
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
            <div className="flex items-center gap-2"><Home size={16}/>Trang chủ</div>
          </NavLink>
          <NavLink to="/shops" className={navLinkClass}>
            <div className="flex items-center gap-2"><Store size={16}/>Shops</div>
          </NavLink>
          <NavLink to="/products" className={navLinkClass}>
            <div className="flex items-center gap-2"><Boxes size={16}/>Sản phẩm</div>
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm hover:bg-slate-50"
          >
            <LogIn size={16}/> Đăng nhập
          </Link>
          <Link
            to="/cart"
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
          >
            <ShoppingCart size={18}/>
            <span>Giỏ hàng</span>
            <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 bg-black text-white rounded-full">0</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
