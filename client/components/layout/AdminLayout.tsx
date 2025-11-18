import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FolderTree,
  Settings,
  Users,
  Package,
  BarChart3,
  ClipboardList,
  Star,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Global Categories",
    url: "/admin/global-categories",
    icon: FolderTree,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: Package,
  },
  {
    title: "Featured",
    url: "/admin/featured",
    icon: Star,
  },
  {
    title: "Reviews",
    url: "/admin/reviews",
    icon: MessageSquare,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

function AdminSidebarFooter() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  return (
    <SidebarFooter>
      <div className="mt-4 flex items-center justify-end px-2">
        <button
          onClick={toggleSidebar}
          className="text-xs rounded-md border px-2 py-1 hover:bg-rose-50 hover:text-rose-700"
        >
          {isCollapsed ? "Mở rộng" : "Thu gọn"}
        </button>
      </div>
    </SidebarFooter>
  );
}

export default function AdminLayout() {
  const { user, isAuthenticated, initialized } = useAuth();
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(url);
  };

  // Check if user was logged out (tokens cleared but still on admin page)
  useEffect(() => {
    if (
      initialized &&
      !isAuthenticated &&
      window.location.pathname.startsWith("/admin")
    ) {
      // User was logged out, redirect to login
      window.location.href = "/login";
    }
  }, [initialized, isAuthenticated]);

  // Wait for auth initialization before checking auth guard
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

  // Auth guard: redirect non-admin users
  if (!isAuthenticated || user?.role !== "Admin") {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#fefefe]">
        <Sidebar id="admin-sidebar" collapsible="icon" className="border-r border-gray-200 bg-[#fdfdfd]" aria-label="Thanh điều hướng Admin">
          <div className="flex h-full flex-col">
            <div className="p-6">
              <h2 className="text-lg font-semibold">AIFShop</h2>
              <p className="text-sm text-gray-500">Admin</p>
            </div>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Điều hướng</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.url)}
                          className={cn(
                            "group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                            // Default text color
                            "text-gray-700",
                            // Hover palette standardized to rose
                            "hover:bg-rose-50 hover:text-rose-700",
                            // Active state palette standardized to rose
                            "data-[active=true]:bg-rose-50 data-[active=true]:text-rose-700 data-[active=true]:font-medium",
                            // Active left border to match rose palette
                            "data-[active=true]:border-l-2 data-[active=true]:border-rose-200",
                          )}
                        >
                          <Link
                            to={item.url}
                            className="flex items-center gap-3 w-full"
                            aria-current={isActive(item.url) ? "page" : undefined}
                            aria-label={item.title}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4",
                                "text-gray-400 group-hover:text-rose-700",
                                isActive(item.url) ? "text-rose-700" : "",
                              )}
                            />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            {/* Footer toggle giống Seller */}
            <AdminSidebarFooter />
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
