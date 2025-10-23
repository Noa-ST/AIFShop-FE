import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  BarChart3,
} from "lucide-react";
import { fetchShopBySeller, isShopPresent } from "@/lib/api";

const sellerMenuItems = [
  {
    title: "Tổng quan",
    url: "/seller",
    icon: LayoutDashboard,
  },
  {
    title: "Sản phẩm",
    url: "/seller/products",
    icon: Package,
  },
  {
    title: "Đơn hàng",
    url: "/seller/orders",
    icon: ShoppingCart,
  },
  {
    title: "Quản lý Shop",
    url: "/seller/shop-management",
    icon: Settings,
  },
];

export default function SellerLayout() {
  const { user, isAuthenticated, initialized } = useAuth();
  const location = useLocation();
  const [shopChecked, setShopChecked] = useState(false);
  const [hasShop, setHasShop] = useState<boolean>(false);

  // allow accessing the create-shop flow without shop requirement
  const isCreateShopRoute = useMemo(
    () => location.pathname.startsWith("/seller/create-shop"),
    [location.pathname],
  );

  useEffect(() => {
    if (!initialized) return;

    // If not authenticated or wrong role, redirect handled below by Navigate
    if (!isAuthenticated || user?.role !== "Seller") return;

    // Skip shop check on create-shop route
    if (isCreateShopRoute) {
      setShopChecked(true);
      setHasShop(false);
      return;
    }

    const run = async () => {
      try {
        if (!user?.id) {
          setShopChecked(true);
          setHasShop(false);
          return;
        }
        const shop = await fetchShopBySeller(user.id);
        setHasShop(isShopPresent(shop));
      } catch (e) {
        setHasShop(false);
      } finally {
        setShopChecked(true);
      }
    };
    run();
  }, [initialized, isAuthenticated, user, isCreateShopRoute]);

  // Wait for auth
  if (!initialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  // Auth guard: only Seller
  if (!isAuthenticated || user?.role !== "Seller") {
    return <Navigate to="/login" replace />;
  }

  // Shop requirement (except create-shop)
  if (!isCreateShopRoute && !shopChecked) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Đang kiểm tra cửa hàng...</p>
        </div>
      </div>
    );
  }

  if (!isCreateShopRoute && shopChecked && !hasShop) {
    return <Navigate to="/seller/create-shop" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r">
          <div className="flex h-full flex-col">
            <div className="p-4">
              <h2 className="text-lg font-semibold">Seller Panel</h2>
              <p className="text-sm text-muted-foreground">
                Quản lý cửa hàng của bạn
              </p>
            </div>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Điều hướng</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sellerMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <a
                            href={item.url}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              "hover:bg-accent hover:text-accent-foreground",
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b bg-background px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold">Seller Dashboard</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Xin chào, {user?.fullname || user?.email}</span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
