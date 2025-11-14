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
  SidebarTrigger,
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
        <Sidebar className="border-r border-gray-200 bg-[#fdfdfd]">
          <div className="flex h-full flex-col">
            <div className="p-6">
              <h2 className="text-lg font-semibold">AIFShop</h2>
              <p className="text-sm text-gray-500">Admin</p>
            </div>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.url)}
                          className={cn(
                            "group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                            "text-gray-700 hover:text-[#d81b60] hover:bg-white",
                            "data-[active=true]:text-[#d81b60] data-[active=true]:bg-transparent data-[active=true]:font-medium",
                            "data-[active=true]:border-l-2 data-[active=true]:border-[#d81b60]",
                          )}
                        >
                          <Link to={item.url} className="flex items-center gap-3 w-full">
                            <item.icon
                              className={cn(
                                "h-4 w-4",
                                "text-gray-400 group-hover:text-[#d81b60]",
                                isActive(item.url) ? "text-[#d81b60]" : "",
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
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b bg-[#fdfdfd] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold">Admin Dashboard</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Welcome, {user?.fullname || user?.email}</span>
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
