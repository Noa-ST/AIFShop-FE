import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchProductsByShop, fetchShopBySeller } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, ShoppingCart, Star, TrendingUp, Settings } from "lucide-react";

export default function SellerDashboard() {
  const { user } = useAuth();
  const sellerId = user?.id;

  const { data: shop } = useQuery({
    queryKey: ["shopBySeller", sellerId],
    queryFn: async () => {
      if (!sellerId) return null;
      return await fetchShopBySeller(sellerId);
    },
    enabled: !!sellerId,
  });

  const shopId = useMemo(() => {
    if (!shop) return null;
    if (Array.isArray(shop)) return shop[0]?.id || shop[0]?._id || null;
    return shop.id || shop._id || shop.shopId || null;
  }, [shop]);

  const { data: products = [] } = useQuery({
    queryKey: ["productsByShop", shopId],
    queryFn: async () => {
      if (!shopId) return [] as any[];
      return await fetchProductsByShop(shopId);
    },
    enabled: !!shopId,
  });

  const stats = [
    { title: "Doanh thu (tháng)", value: "15.200.000₫", change: "+12%", positive: true, icon: DollarSign },
    { title: "Sản phẩm đang hoạt động", value: String((products as any[]).length || 0), change: "+3", positive: true, icon: Package },
    { title: "Đơn hàng chờ xử lý", value: "3", change: "+1", positive: true, icon: ShoppingCart },
    { title: "Đánh giá trung bình", value: "4.7", change: "+0.1", positive: true, icon: Star },
  ];

  const recentActivities = [
    { id: 1, action: "Đơn hàng mới #A123", time: "2 phút trước" },
    { id: 2, action: "Cập nhật tồn kho 2 sản phẩm", time: "10 phút trước" },
    { id: 3, action: "Sản phẩm mới được duyệt", time: "20 phút trước" },
    { id: 4, action: "Khách hàng gửi đánh giá 5★", time: "35 phút trước" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tổng quan Seller</h2>
        <p className="text-muted-foreground">Tình hình cửa hàng và hoạt động gần đây.</p>
      </div>

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
                <span className={stat.positive ? "text-green-600" : "text-red-600"}>{stat.change}</span> so với tháng trước
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Các sự kiện mới trong cửa hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex h-2 w-2 rounded-full bg-blue-600" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Tác vụ thường dùng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/seller/products/create" className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Tạo sản phẩm mới</span>
            </Link>
            <Link to="/seller/products" className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
              <Package className="h-4 w-4" />
              <span className="text-sm">Quản lý sản phẩm</span>
            </Link>
            <Link to="/seller/orders" className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm">Xem đơn hàng</span>
            </Link>
            <Link to="/seller/shop-management" className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Quản lý thông tin shop</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm gần đây</CardTitle>
          <CardDescription>Hiển thị một vài sản phẩm mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {Array.isArray(products) && products.length > 0
              ? `Có ${products.length} sản phẩm đang hoạt động.`
              : "Chưa có sản phẩm."}
          </p>
          <div className="mt-4">
            <Link to="/seller/products">
              <Button variant="outline">Xem tất cả sản phẩm</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
