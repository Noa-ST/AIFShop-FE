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
}

const NavItemComponent = ({
  item,
  isActive,
  hasActiveChild,
  onClose,
}: NavItemProps) => {
  const Icon = item.icon;
  const [isExpanded, setIsExpanded] = useState(hasActiveChild || isActive);
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
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive || hasActiveChild
                ? "bg-gradient-to-r from-[#e91e63] to-[#f43f5e] text-white shadow-lg shadow-pink-500/30"
                : "text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:text-[#d81b60]",
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 transition-all duration-200",
                isActive || hasActiveChild
                  ? "text-white"
                  : "text-gray-500 group-hover:text-[#d81b60] group-hover:scale-110",
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
            {hasChildren && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive || hasActiveChild ? "text-white" : "text-gray-400",
                  )}
                />
              </motion.div>
            )}
          </button>
        ) : (
          <Link to={item.href} onClick={onClose} className="flex-1">
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-gradient-to-r from-[#e91e63] to-[#f43f5e] text-white shadow-lg shadow-pink-500/30"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:text-[#d81b60]",
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive
                    ? "text-white"
                    : "text-gray-500 group-hover:text-[#d81b60] group-hover:scale-110",
                )}
              />
              <span className={cn("font-medium", isActive && "font-semibold")}>
                {item.label}
              </span>
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
            >
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-pink-200 pl-4">
                {item.children?.map((child) => {
                  const ChildIcon = child.icon;
                  const isChildActive = location.pathname === child.href;
                  return (
                    <Link
                      key={child.href}
                      to={child.href}
                      onClick={onClose}
                      className="block"
                    >
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm",
                          isChildActive
                            ? "bg-pink-100 text-[#d81b60] font-semibold border-l-4 border-[#e91e63]"
                            : "text-gray-600 hover:bg-pink-50 hover:text-[#d81b60]",
                        )}
                      >
                        <ChildIcon
                          className={cn(
                            "w-4 h-4 transition-all duration-200",
                            isChildActive
                              ? "text-[#d81b60]"
                              : "text-gray-400 group-hover:text-[#d81b60]",
                          )}
                        />
                        <span>{child.label}</span>
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

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

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
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : isMobileOpen ? 0 : "-100%",
        }}
        transition={{ duration: 0.3 }}
        className={cn(
          // On desktop, position the sidebar below the fixed seller navbar (height 4rem)
          "fixed lg:sticky top-0 lg:top-16 left-0 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-[#fdfdfd] border-r border-gray-200 p-6 flex flex-col justify-between z-40 lg:z-0",
        )}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                hasActiveChild={hasActiveChild(item)}
                onClose={() => setIsMobileOpen(false)}
              />
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-gray-200">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#d81b60] transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
          <p className="text-xs text-gray-400 mt-4">© 2025 AIFShop</p>
        </div>
      </motion.aside>
    </>
  );
}
