import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
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
import { Store, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchShopBySeller, isShopPresent } from "@/lib/api";

const sellerMenuItems = [
  {
    title: "Quản lý Shop",
    url: "/seller/shop-management",
    icon: Store,
  },
  {
    title: "Sản phẩm",
    url: "/seller/products",
    icon: Package,
  },
];

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
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r">
          <div className="flex h-full flex-col">
            <div className="p-4">
              <h2 className="text-lg font-semibold">Seller Panel</h2>
              <p className="text-sm text-muted-foreground">Shop Management</p>
            </div>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
                <h1 className="text-xl font-semibold">Quản lý Cửa hàng</h1>
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
