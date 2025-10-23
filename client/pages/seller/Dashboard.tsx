import { Link as RouterLink, useNavigate } from "react-router-dom";
import { BarChart2, Box, Users, DollarSign, Package, Activity } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller, isShopPresent } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: any;
}) {
  return (
    <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl hover:shadow-rose-600/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {title}
        </CardTitle>
        <div className="text-rose-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <p className="text-xs text-slate-500 pt-1">+20.1% so với tháng trước</p>
      </CardContent>
    </Card>
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, initialized } = useAuth();

  const [isShopChecked, setIsShopChecked] = useState(false);
  const [shopInfo, setShopInfo] = useState<any>(null);

  useEffect(() => {
    // Wait until AuthContext initialized to avoid premature redirects/logouts
    if (!initialized) return;

    if (!user || user?.role !== "Seller") {
      navigate("/login");
      return;
    }

    const checkShop = async () => {
      const sellerId = user.id;
      setIsShopChecked(false);
      setShopInfo(null);

      if (!sellerId) {
        setIsShopChecked(true);
        return;
      }

      try {
        const shop = await fetchShopBySeller(sellerId);
        if (isShopPresent(shop)) {
          setShopInfo(Array.isArray(shop) ? shop[0] : shop);
        } else {
          navigate("/seller/create-shop");
          return;
        }
      } catch (err: any) {
        if (
          err.response &&
          (err.response.status === 404 || err.response.status === 400)
        ) {
          navigate("/seller/create-shop");
          return;
        }
        console.error("Lỗi khi kiểm tra shop:", err);
        navigate("/error");
        return;
      } finally {
        setIsShopChecked(true);
      }
    };

    checkShop();
  }, [user, initialized, navigate]);

  if (!isShopChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 text-xl">
        Đang kiểm tra trạng thái Cửa hàng...
      </div>
    );
  }

  if (!shopInfo) return null;

  // Build UI similar to Admin dashboard but tailored to seller
  const stats = useMemo(
    () => [
      {
        title: "Doanh thu tháng này",
        value: "15.2M₫",
        change: "+8%",
        changeType: "positive" as const,
        icon: DollarSign,
      },
      {
        title: "Đơn hàng chờ",
        value: "3",
        change: "+1",
        changeType: "positive" as const,
        icon: Users,
      },
      {
        title: "Sản phẩm hoạt động",
        value: "150",
        change: "+6",
        changeType: "positive" as const,
        icon: Package,
      },
      {
        title: "Đánh giá TB",
        value: "4.7",
        change: "+0.1",
        changeType: "positive" as const,
        icon: BarChart2,
      },
    ],
    [],
  );

  const recentActivities = [
    { id: 1, action: "Tạo sản phẩm mới", time: "2 phút trước", type: "product" },
    { id: 2, action: "Cập nhật tồn kho", time: "10 phút trước", type: "inventory" },
    { id: 3, action: "Có đánh giá mới", time: "15 phút trước", type: "review" },
    { id: 4, action: "Đơn hàng hoàn tất", time: "30 phút trước", type: "order" },
  ];

  return (
    <div className="space-y-6 container py-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tổng quan Shop</h2>
        <p className="text-muted-foreground">
          Chào mừng quay lại, {shopInfo.name}. Đây là tình hình gần đây của cửa hàng bạn.
        </p>
      </div>

      {/* Stats Grid (mirrors Admin) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> so với tháng trước
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Các hành động mới nhất của shop</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex h-2 w-2 rounded-full bg-rose-600" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Các tác vụ thường dùng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <RouterLink to="/seller/products/create" className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
              <Package className="h-4 w-4" />
              <span className="text-sm">Tạo sản phẩm mới</span>
            </RouterLink>
            <RouterLink to="/seller/products" className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Quản lý sản phẩm</span>
            </RouterLink>
            <RouterLink to="/seller/shop-management" className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
              <Box className="h-4 w-4" />
              <span className="text-sm">Quản lý Shop</span>
            </RouterLink>
            <RouterLink to="/seller/orders" className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Xem đơn hàng</span>
            </RouterLink>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
