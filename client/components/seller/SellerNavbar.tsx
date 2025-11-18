import { Link, NavLink } from "react-router-dom";
import { Store, Home, Boxes, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchShopBySeller } from "@/lib/api";
import { getShopOrders } from "@/services/orders";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-full text-sm font-medium transition-colors ${
    isActive
      ? "bg-rose-50 text-rose-700 border border-rose-200"
      : "text-slate-700 hover:bg-rose-50 hover:text-rose-700"
  }`;

export default function SellerNavbar() {
  const { user, logoutUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // Dot thông báo đơn mở (Pending/Confirmed/Shipped)
  const sellerId = user?.id;
  const { data: shop } = useQuery({
    queryKey: ["sellerNavbarShop", sellerId],
    queryFn: async () => {
      if (!sellerId) return null;
      return await fetchShopBySeller(sellerId);
    },
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });
  const shopId = (() => {
    if (!shop) return null as string | null;
    if (Array.isArray(shop)) return (shop[0] as any)?.id || (shop[0] as any)?._id || null;
    return (shop as any).id || (shop as any)._id || (shop as any).shopId || null;
  })();
  const { data: pendingOrders } = useQuery({
    queryKey: ["sellerNavbarPending", shopId],
    queryFn: async () => {
      if (!shopId) return null as any;
      return await getShopOrders(shopId, { status: "Pending", page: 1, pageSize: 1 } as any);
    },
    enabled: !!shopId,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
  const { data: confirmedOrders } = useQuery({
    queryKey: ["sellerNavbarConfirmed", shopId],
    queryFn: async () => {
      if (!shopId) return null as any;
      return await getShopOrders(shopId, { status: "Confirmed", page: 1, pageSize: 1 } as any);
    },
    enabled: !!shopId,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
  const { data: shippedOrders } = useQuery({
    queryKey: ["sellerNavbarShipped", shopId],
    queryFn: async () => {
      if (!shopId) return null as any;
      return await getShopOrders(shopId, { status: "Shipped", page: 1, pageSize: 1 } as any);
    },
    enabled: !!shopId,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
  const openOrdersCount = ((pendingOrders as any)?.totalCount ?? 0) + ((confirmedOrders as any)?.totalCount ?? 0) + ((shippedOrders as any)?.totalCount ?? 0);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-200"
    >
      <div className="container mx-auto flex items-center justify-between h-16">
        {/* Logo + brand text to sync with SiteHeader */}
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow"
          />
          <span className="text-xl font-semibold tracking-tight">AIFShop</span>
        </Link>

        {/* Toggle Sidebar sẽ hiển thị cạnh tiêu đề, không đặt cạnh logo */}

        {/* Bỏ tiêu đề trang theo yêu cầu */}

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

        {/* Cart + User Info */}
        <div className="flex items-center gap-2">
          {/* Mobile burger */}
          <button
            className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-white/80"
            aria-expanded={mobileOpen}
            aria-controls="sellernav-mobile-menu"
            onClick={() => setMobileOpen((s) => !s)}
          >
            <span className="sr-only">Mở menu</span>
            <Boxes size={16} />
          </button>
          {/* Bỏ nút giỏ hàng với Seller */}
          {/* (đã xóa block Link to="/cart") */}
          {user && (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((s) => !s)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                }}
                className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-white/80"
                aria-expanded={open}
                aria-controls="sellernav-user-menu"
              >
                <User size={16} />
                <span className="hidden sm:inline-block">
                  {user?.fullname?.split(" ")[0] || user?.email}
                </span>
              </button>

              {open && (
                <div id="sellernav-user-menu" className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-md py-2 z-50">
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
                  {/* Đã bỏ mục Doanh thu khỏi dropdown
                  <Link
                    to="/seller/balance"
                    className="block px-4 py-2 text-sm hover:bg-slate-50"
                    onClick={() => setOpen(false)}
                  >
                    Doanh thu
                  </Link>
                  */}
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
      {/* Mobile menu panel */}
      {mobileOpen && (
        <div id="sellernav-mobile-menu" className="md:hidden border-t border-slate-200 bg-white">
          <div className="container mx-auto py-2 flex flex-col gap-1">
            <NavLink to="/home" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <div className="flex items-center gap-2">
                <Home size={16} />
                Trang chủ
              </div>
            </NavLink>
            <NavLink to="/shops" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <div className="flex items-center gap-2">
                <Store size={16} />
                Shops
              </div>
            </NavLink>
            <NavLink to="/products" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <div className="flex items-center gap-2">
                <Boxes size={16} />
                Sản phẩm
              </div>
            </NavLink>
          </div>
        </div>
      )}
    </motion.header>
  );
}
