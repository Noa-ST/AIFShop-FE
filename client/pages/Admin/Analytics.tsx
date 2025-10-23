import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
  Eye,
  Star,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// Mock data interfaces
interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
  };
  orders: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  products: {
    total: number;
    active: number;
    pending: number;
    growth: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    growth: number;
  }>;
  topSellers: Array<{
    id: string;
    name: string;
    shop: string;
    sales: number;
    revenue: number;
    growth: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "order" | "user" | "product" | "shop";
    description: string;
    timestamp: string;
    value?: number;
  }>;
  chartData: Array<{
    date: string;
    revenue: number;
    orders: number;
    users: number;
  }>;
}

// Mock data
const mockAnalytics: AnalyticsData = {
  revenue: {
    total: 125000000,
    monthly: 15000000,
    growth: 12.5,
  },
  orders: {
    total: 2847,
    completed: 2654,
    pending: 156,
    cancelled: 37,
    growth: 8.3,
  },
  users: {
    total: 12456,
    active: 8934,
    new: 234,
    growth: 15.2,
  },
  products: {
    total: 5678,
    active: 5234,
    pending: 444,
    growth: 6.7,
  },
  topProducts: [
    {
      id: "1",
      name: "iPhone 15 Pro Max",
      sales: 1250,
      revenue: 37500000,
      growth: 18.5,
    },
    {
      id: "2",
      name: "Samsung Galaxy S24 Ultra",
      sales: 890,
      revenue: 23100000,
      growth: 12.3,
    },
    {
      id: "3",
      name: "MacBook Pro M3",
      sales: 567,
      revenue: 26000000,
      growth: 8.9,
    },
  ],
  topSellers: [
    {
      id: "1",
      name: "Nguyễn Văn A",
      shop: "TechStore",
      sales: 2340,
      revenue: 85000000,
      growth: 22.1,
    },
    {
      id: "2",
      name: "Trần Thị B",
      shop: "MobileWorld",
      sales: 1890,
      revenue: 62000000,
      growth: 15.7,
    },
    {
      id: "3",
      name: "Lê Văn C",
      shop: "FashionStore",
      sales: 1456,
      revenue: 45000000,
      growth: 9.3,
    },
  ],
  recentActivity: [
    {
      id: "1",
      type: "order",
      description: "Đơn hàng mới từ TechStore",
      timestamp: "2024-01-20T10:30:00Z",
      value: 2500000,
    },
    {
      id: "2",
      type: "user",
      description: "Người dùng mới đăng ký",
      timestamp: "2024-01-20T09:15:00Z",
    },
    {
      id: "3",
      type: "product",
      description: "Sản phẩm mới được thêm",
      timestamp: "2024-01-20T08:45:00Z",
    },
    {
      id: "4",
      type: "shop",
      description: "Shop mới được duyệt",
      timestamp: "2024-01-20T07:20:00Z",
    },
  ],
  chartData: [
    { date: "2024-01-01", revenue: 12000000, orders: 120, users: 45 },
    { date: "2024-01-02", revenue: 13500000, orders: 135, users: 52 },
    { date: "2024-01-03", revenue: 11000000, orders: 110, users: 38 },
    { date: "2024-01-04", revenue: 14500000, orders: 145, users: 61 },
    { date: "2024-01-05", revenue: 16000000, orders: 160, users: 68 },
    { date: "2024-01-06", revenue: 18000000, orders: 180, users: 75 },
    { date: "2024-01-07", revenue: 20000000, orders: 200, users: 82 },
  ],
};

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState("7d");

  // Mock query - replace with actual API call
  const { data: analytics = mockAnalytics, isLoading } = useQuery({
    queryKey: ["adminAnalytics", timeRange],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockAnalytics;
    },
  });

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + "₫";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case "user":
        return <Users className="w-4 h-4 text-green-500" />;
      case "product":
        return <Package className="w-4 h-4 text-purple-500" />;
      case "shop":
        return <Activity className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Tổng quan về hiệu suất và thống kê của nền tảng.
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn khoảng thời gian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 ngày qua</SelectItem>
            <SelectItem value="30d">30 ngày qua</SelectItem>
            <SelectItem value="90d">90 ngày qua</SelectItem>
            <SelectItem value="1y">1 năm qua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng doanh thu
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.revenue.total)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.revenue.growth > 0 ? (
                <ArrowUpRight className="w-3 h-3 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-600 mr-1" />
              )}
              <span
                className={
                  analytics.revenue.growth > 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {analytics.revenue.growth}%
              </span>
              <span className="ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.orders.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.orders.growth > 0 ? (
                <ArrowUpRight className="w-3 h-3 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-600 mr-1" />
              )}
              <span
                className={
                  analytics.orders.growth > 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {analytics.orders.growth}%
              </span>
              <span className="ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng người dùng
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.users.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.users.growth > 0 ? (
                <ArrowUpRight className="w-3 h-3 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-600 mr-1" />
              )}
              <span
                className={
                  analytics.users.growth > 0 ? "text-green-600" : "text-red-600"
                }
              >
                {analytics.users.growth}%
              </span>
              <span className="ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng sản phẩm</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.products.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.products.growth > 0 ? (
                <ArrowUpRight className="w-3 h-3 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-600 mr-1" />
              )}
              <span
                className={
                  analytics.products.growth > 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {analytics.products.growth}%
              </span>
              <span className="ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Doanh thu theo thời gian</CardTitle>
            <CardDescription>
              Biểu đồ doanh thu trong{" "}
              {timeRange === "7d"
                ? "7 ngày"
                : timeRange === "30d"
                  ? "30 ngày"
                  : timeRange === "90d"
                    ? "90 ngày"
                    : "1 năm"}{" "}
              qua
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Biểu đồ doanh thu</p>
                <p className="text-sm text-gray-400">
                  Tích hợp với thư viện chart (Chart.js, Recharts, etc.)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>
              Các hoạt động mới nhất trên nền tảng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(activity.timestamp)}
                    </p>
                    {activity.value && (
                      <p className="text-xs text-green-600 font-medium">
                        {formatCurrency(activity.value)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm bán chạy</CardTitle>
            <CardDescription>Top sản phẩm có doanh số cao nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.sales} đơn hàng •{" "}
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {product.growth}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Sellers */}
        <Card>
          <CardHeader>
            <CardTitle>Seller hàng đầu</CardTitle>
            <CardDescription>Top seller có doanh số cao nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topSellers.map((seller, index) => (
                <div key={seller.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {seller.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {seller.shop} • {seller.sales} đơn hàng
                    </p>
                    <p className="text-xs text-green-600 font-medium">
                      {formatCurrency(seller.revenue)}
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {seller.growth}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Phân tích đơn hàng</CardTitle>
          <CardDescription>Chi tiết về trạng thái các đơn hàng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.orders.completed}
              </div>
              <p className="text-sm text-muted-foreground">Hoàn thành</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.orders.pending}
              </div>
              <p className="text-sm text-muted-foreground">Đang xử lý</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {analytics.orders.cancelled}
              </div>
              <p className="text-sm text-muted-foreground">Đã hủy</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.orders.total}
              </div>
              <p className="text-sm text-muted-foreground">Tổng cộng</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

