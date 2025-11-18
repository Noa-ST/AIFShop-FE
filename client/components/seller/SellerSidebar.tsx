import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Store,
  Package,
  ShoppingCart,
  Settings,
  Home,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Info,
  FolderTree,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchShopBySeller } from "@/lib/api";
import { shopService } from "@/services/shopService";
import { getShopOrders } from "@/services/orders";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    icon: Store,
    label: "Quản lý Shop",
    href: "/seller/shop-management",
    children: [
      {
        icon: Info,
        label: "Thông tin Shop",
        href: "/seller/shop-management/info",
      },
      {
        icon: FolderTree,
        label: "Danh mục Shop",
        href: "/seller/shop-management/categories",
      },
      {
        icon: Package,
        label: "Sản phẩm",
        href: "/seller/shop-management/products",
      },
    ],
  },
  { icon: ShoppingCart, label: "Đơn hàng", href: "/seller/orders" },
  { icon: DollarSign, label: "Doanh thu", href: "/seller/balance" },
  { icon: Settings, label: "Cài đặt", href: "/seller/settings" },
];

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  hasActiveChild?: boolean;
  onClose?: () => void;
  compact?: boolean;
  rightBadge?: React.ReactNode;
}

const NavItemComponent = ({
  item,
  isActive,
  hasActiveChild,
  onClose,
  compact,
  rightBadge,
}: NavItemProps) => {
  const Icon = item.icon;
  // Persist trạng thái mở rộng của nhóm trong localStorage để giữ nguyên khi điều hướng
  const storageKey = `sellerSidebarExpanded:${item.href}`;
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "true") return true;
      if (saved === "false") return false;
      return Boolean(hasActiveChild || isActive);
    } catch {
      return Boolean(hasActiveChild || isActive);
    }
  });
  const location = useLocation();

  const hasChildren = item.children && item.children.length > 0;
  const activeChild = item.children?.find(
    (child) => location.pathname === child.href,
  );

  return (
    <div>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            aria-expanded={isExpanded}
            aria-controls={`submenu-${item.href}`}
            onClick={() => {
              const next = !isExpanded;
              setIsExpanded(next);
              try {
                localStorage.setItem(storageKey, String(next));
              } catch {}
            }}
            className={cn(
              "flex-1 flex items-center transition-all duration-200 group",
              compact ? "gap-0 px-2 py-2 justify-center" : "gap-3 pl-3 pr-4 py-3",
              isActive || hasActiveChild
                ? "bg-rose-50 text-rose-700 border-l-2 border-rose-500"
                : "text-gray-700 hover:bg-rose-50 hover:text-rose-700 hover:border-l-2 hover:border-rose-200",
            )}
          >
            {compact ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      isActive || hasActiveChild
                        ? "text-rose-700"
                        : "text-gray-500 group-hover:text-rose-700 group-hover:scale-110",
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isActive || hasActiveChild
                      ? "text-rose-700"
                      : "text-gray-500 group-hover:text-rose-700 group-hover:scale-110",
                  )}
                />
                <span
                  className={cn(
                    "font-medium flex-1 text-left",
                    (isActive || hasActiveChild) && "font-semibold",
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
            {hasChildren && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive || hasActiveChild ? "text-rose-700" : "text-gray-400",
                  )}
                />
              </motion.div>
            )}
          </button>
        ) : (
          <Link to={item.href} onClick={onClose} className="flex-1" aria-current={isActive ? "page" : undefined} aria-label={item.label}>
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center transition-all duration-200 group",
                compact ? "gap-0 px-2 py-2 justify-center" : "gap-3 pl-3 pr-4 py-3",
                isActive
                  ? "bg-rose-50 text-rose-700 border-l-2 border-rose-500"
                  : "text-gray-700 hover:bg-rose-50 hover:text-rose-700 hover:border-l-2 hover:border-rose-200",
              )}
            >
              {compact ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-all duration-200",
                        isActive
                          ? "text-rose-700"
                          : "text-gray-500 group-hover:text-rose-700 group-hover:scale-110",
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                <>
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      isActive
                        ? "text-rose-700"
                        : "text-gray-500 group-hover:text-rose-700 group-hover:scale-110",
                    )}
                  />
                  <span className={cn("font-medium", isActive && "font-semibold")}>
                    {item.label}
                  </span>
                  {rightBadge && <span className="ml-auto">{rightBadge}</span>}
                </>
              )}
            </motion.div>
          </Link>
        )}
      </div>

      {/* Sub-menu */}
      {hasChildren && (
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
              id={`submenu-${item.href}`}
            >
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-rose-200 pl-4">
                {item.children?.map((child) => {
                  const ChildIcon = child.icon;
                  const isChildActive = location.pathname === child.href;
                  return (
                    <Link
                      key={child.href}
                      to={child.href}
                      onClick={onClose}
                      className="block"
                      aria-current={isChildActive ? "page" : undefined}
                      aria-label={child.label}
                    >
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex items-center transition-all duration-200 text-sm",
                          compact ? "gap-0 px-2 py-2 justify-center" : "gap-3 px-4 py-2.5",
                          isChildActive
                            ? "bg-rose-100 text-rose-700 font-semibold border-l-4 border-rose-300"
                            : "text-gray-600 hover:bg-rose-50 hover:text-rose-700 hover:border-l-2 hover:border-rose-200",
                        )}
                      >
                        {compact ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ChildIcon
                                className={cn(
                                  "w-4 h-4 transition-all duration-200",
                                  isChildActive
                                    ? "text-rose-700"
                                    : "text-gray-400 group-hover:text-rose-700",
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="right">{child.label}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <>
                            <ChildIcon
                              className={cn(
                                "w-4 h-4 transition-all duration-200",
                                isChildActive
                                  ? "text-rose-700"
                                  : "text-gray-400 group-hover:text-rose-700",
                              )}
                            />
                            <span>{child.label}</span>
                          </>
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default function SellerSidebar() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [compact, setCompact] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("sellerSidebarCompact");
      return v === "true" ? true : false;
    } catch {
      return false;
    }
  });
  const { user } = useAuth();
  const sellerId = user?.id;
  const { data: shop } = useQuery({
    queryKey: ["sidebarShopBySeller", sellerId],
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
  const { data: pendingOrders, isFetching: isFetchingPending } = useQuery({
    queryKey: ["sidebarPendingOrders", shopId],
    queryFn: async () => {
      if (!shopId) return null as any;
      const result = await getShopOrders(shopId, { status: "Pending", page: 1, pageSize: 1 } as any);
      return result;
    },
    enabled: !!shopId,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
  const pendingCount = (pendingOrders as any)?.totalCount ?? 0;

  // Thêm đếm cho Confirmed và Shipped để phản ánh tổng đơn đang mở
  const { data: confirmedOrders, isFetching: isFetchingConfirmed } = useQuery({
    queryKey: ["sidebarConfirmedOrders", shopId],
    queryFn: async () => {
      if (!shopId) return null as any;
      const result = await getShopOrders(shopId, { status: "Confirmed", page: 1, pageSize: 1 } as any);
      return result;
    },
    enabled: !!shopId,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
  const confirmedCount = (confirmedOrders as any)?.totalCount ?? 0;

  const { data: shippedOrders, isFetching: isFetchingShipped } = useQuery({
    queryKey: ["sidebarShippedOrders", shopId],
    queryFn: async () => {
      if (!shopId) return null as any;
      const result = await getShopOrders(shopId, { status: "Shipped", page: 1, pageSize: 1 } as any);
      return result;
    },
    enabled: !!shopId,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
  const shippedCount = (shippedOrders as any)?.totalCount ?? 0;
  const openOrdersCount = (pendingCount || 0) + (confirmedCount || 0) + (shippedCount || 0);
  const isOrdersLoading = isFetchingPending || isFetchingConfirmed || isFetchingShipped;
  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }
  const { data: revenueResp, isFetching: isFetchingRevenue } = useQuery({
    queryKey: ["sidebarRevenueToday", shopId, todayIso()],
    queryFn: async () => {
      if (!shopId) return null as any;
      const d = todayIso();
      const res = await shopService.getRevenueSummary(shopId as string, {
        from: d,
        to: d,
        groupBy: "day",
        onlyPaid: true,
      });
      return res;
    },
    enabled: !!shopId,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });
  const todayRevenue: number = (revenueResp as any)?.data?.totalRevenue ?? 0;
  const compactCurrency = (n: number) => new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(n);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Lắng nghe sự kiện từ SellerNavbar để toggle trạng thái compact/mobile
  useEffect(() => {
    const onCompactToggle = (e: Event) => {
      const detail = (e as CustomEvent).detail as { compact?: boolean } | undefined;
      const next = typeof detail?.compact === "boolean" ? detail!.compact : !compact;
      setCompact(next);
      try {
        localStorage.setItem("sellerSidebarCompact", String(next));
      } catch {}
    };

    const onMobileToggle = (e: Event) => {
      const detail = (e as CustomEvent).detail as { open?: boolean } | undefined;
      if (typeof detail?.open === "boolean") {
        setIsMobileOpen(detail.open);
      } else {
        setIsMobileOpen((s) => !s);
      }
    };

    document.addEventListener("sellerSidebarCompactToggle", onCompactToggle);
    document.addEventListener("sellerSidebarMobileToggle", onMobileToggle);
    return () => {
      document.removeEventListener("sellerSidebarCompactToggle", onCompactToggle);
      document.removeEventListener("sellerSidebarMobileToggle", onMobileToggle);
    };
  }, [compact]);

  const isActive = (href: string) => {
    if (href === "/seller/shop-management") {
      return (
        location.pathname === "/seller" ||
        location.pathname === href ||
        location.pathname.startsWith("/seller/shop-management/")
      );
    }
    return location.pathname.startsWith(href);
  };

  const hasActiveChild = (item: NavItem): boolean => {
    if (item.children) {
      return item.children.some((child) => location.pathname === child.href);
    }
    return false;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow"
        aria-expanded={isMobileOpen}
        aria-controls="seller-sidebar"
        aria-label="Mở/đóng sidebar"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside id="seller-sidebar" aria-label="Thanh điều hướng Seller"
        initial={false}
        animate={{
          x: isDesktop ? 0 : isMobileOpen ? 0 : "-100%",
        }}
        transition={{ duration: 0.3 }}
        className={cn(
          // On desktop, position the sidebar below the fixed seller navbar (height 4rem)
          compact
            ? "fixed lg:sticky top-0 lg:top-16 left-0 h-screen lg:h-[calc(100vh-4rem)] w-16 bg-[#fdfdfd] border-r border-gray-200 p-2 flex flex-col justify-between z-40 lg:z-0"
            : "fixed lg:sticky top-0 lg:top-16 left-0 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-[#fdfdfd] border-r border-gray-200 p-6 flex flex-col justify-between z-40 lg:z-0",
        )}
      >
        <TooltipProvider>
        <div className="flex-1 overflow-y-auto">
          {/* Navigation */}
          <nav className="space-y-2" role="navigation" aria-label="Điều hướng Seller">
            {navItems.map((item) => {
              const rightBadge = !compact && !item.children
                ? item.href === "/seller/orders"
                  ? isOrdersLoading
                    ? (<Badge variant="secondary" className="ml-auto">—</Badge>)
                    : openOrdersCount > 0
                      ? (<Badge variant="destructive" className="ml-auto">{openOrdersCount}</Badge>)
                      : null
                  : item.href === "/seller/balance"
                    ? isFetchingRevenue
                      ? (<Badge variant="secondary" className="ml-auto">—</Badge>)
                      : todayRevenue > 0
                        ? (<Badge variant="secondary" className="ml-auto">{compactCurrency(todayRevenue)}</Badge>)
                        : null
                    : null
                : null;
              return (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  isActive={isActive(item.href)}
                  hasActiveChild={hasActiveChild(item)}
                  onClose={() => setIsMobileOpen(false)}
                  compact={compact}
                  rightBadge={rightBadge}
                />
              );
            })}
          </nav>
        </div>
        </TooltipProvider>
        
        {/* Footer */}
        <div className={cn("pt-6 border-t border-gray-200", compact && "px-1")}
        >
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2 text-sm text-gray-500 hover:text-rose-700 transition-colors",
              compact && "justify-center",
            )}
          >
            <Home className="w-4 h-4" />
            {!compact && <span>Về trang chủ</span>}
          </Link>
          <div className={cn("mt-4 flex items-center justify-between", compact && "justify-center")}
          >
            {!compact && <p className="text-xs text-gray-400">© 2025 AIFShop</p>}
            <button
              onClick={() => {
                const next = !compact;
                setCompact(next);
                try { localStorage.setItem("sellerSidebarCompact", String(next)); } catch {}
              }}
              className={cn(
                "text-xs rounded-md border px-2 py-1 hover:bg-rose-50 hover:text-rose-700",
              )}
            >
              {compact ? "Mở rộng" : "Thu gọn"}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
