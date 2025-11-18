import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  FolderTree,
  TrendingUp,
  Activity,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminAnalyticsService,
  AdminOverview,
  RecentActivity,
  AdminTimeseriesPoint,
  AdminAlerts,
} from "@/services/adminAnalytics";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const { data: overview, isLoading: loadingOverview } = useQuery<AdminOverview>({
    queryKey: ["admin-overview"],
    queryFn: adminAnalyticsService.getOverview,
  });

  const { data: activities, isLoading: loadingActivities } = useQuery<RecentActivity[]>({
    queryKey: ["admin-recent-activities"],
    queryFn: adminAnalyticsService.getRecentActivities,
  });

  // Bộ lọc thời gian cho biểu đồ
  const [preset, setPreset] = useState<"7d" | "30d" | "custom">("7d");
  const [customFrom, setCustomFrom] = useState<string>(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState<string>(new Date().toISOString().slice(0, 10));

  const now = new Date();
  const rangeFrom = preset === "7d"
    ? new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : preset === "30d"
    ? new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : customFrom;
  const rangeTo = preset === "custom" ? customTo : new Date().toISOString().slice(0, 10);

  const { data: series, isLoading: loadingSeries } = useQuery<AdminTimeseriesPoint[]>({
    queryKey: ["admin-timeseries", rangeFrom, rangeTo],
    queryFn: () => adminAnalyticsService.getTimeseries({ from: rangeFrom, to: rangeTo, granularity: "day" }),
  });

  const { data: alerts } = useQuery<AdminAlerts>({
    queryKey: ["admin-alerts"],
    queryFn: adminAnalyticsService.getAlerts,
  });

  const points: AdminTimeseriesPoint[] = Array.isArray(series) ? series : [];
  const totalOrders = points.reduce((s, p) => s + (p.orders ?? 0), 0);
  const totalUsers = points.reduce((s, p) => s + (p.users ?? 0), 0);
  const avgRatingValues = points.map((p) => p.avgRating).filter((v): v is number => typeof v === "number");
  const avgRating = avgRatingValues.length
    ? +(avgRatingValues.reduce((s, v) => s + v, 0) / avgRatingValues.length).toFixed(2)
    : undefined;
  const conversion = totalUsers > 0 ? +(((totalOrders / totalUsers) * 100).toFixed(1)) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Tổng quan Bảng điều khiển
        </h2>
        <p className="text-muted-foreground">
          Chào mừng đến với trang quản trị. Đây là tình hình nền tảng của bạn.
        </p>
      </div>

      {/* Lưới số liệu */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingOverview ? "—" : overview?.totals?.users}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingOverview ? "" : overview?.changes?.users}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingOverview ? "—" : overview?.totals?.products}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingOverview ? "" : overview?.changes?.products}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Danh mục toàn cục</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingOverview ? "—" : overview?.totals?.globalCategories}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingOverview ? "" : overview?.changes?.globalCategories}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingOverview ? "—" : overview?.totals?.revenue}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingOverview ? "" : overview?.changes?.revenue}
            </p>
          </CardContent>
        </Card>
      </div>

          {/* Bộ lọc thời gian + Biểu đồ */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Biểu đồ theo thời gian</CardTitle>
                  <CardDescription>Đường đơn hàng và doanh thu theo ngày</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={preset === "7d" ? "default" : "outline"} onClick={() => setPreset("7d")}>7 ngày</Button>
                  <Button variant={preset === "30d" ? "default" : "outline"} onClick={() => setPreset("30d")}>30 ngày</Button>
                  <Button variant={preset === "custom" ? "default" : "outline"} onClick={() => setPreset("custom")}>Tùy chỉnh</Button>
                </div>
              </div>
              {preset === "custom" && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-10 rounded-md border px-3 text-sm"
                  />
                  <span className="text-sm text-muted-foreground">đến</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-10 rounded-md border px-3 text-sm"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loadingSeries ? (
                <div className="text-sm text-muted-foreground">Đang tải biểu đồ…</div>
              ) : !points.length ? (
                <div className="text-sm text-muted-foreground">Chưa có dữ liệu cho khoảng này.</div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="orders" name="Đơn hàng" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thống kê bổ sung */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tỉ lệ chuyển đổi</CardTitle>
                <CardDescription>Tổng đơn / tổng người dùng mới</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {conversion !== undefined ? `${conversion}%` : "—"}
                </div>
                <p className="text-sm text-muted-foreground">Đơn: {totalOrders} • Người dùng mới: {totalUsers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá trung bình</CardTitle>
                <CardDescription>Điểm trung bình theo ngày</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{avgRating !== undefined ? `${avgRating}★` : "—"}</div>
                <p className="text-sm text-muted-foreground">Nguồn: dữ liệu đánh giá theo ngày</p>
              </CardContent>
            </Card>
          </div>

          {/* Cảnh báo hệ thống */}
          <Card>
            <CardHeader>
              <CardTitle>Cảnh báo</CardTitle>
              <CardDescription>Những mục cần chú ý</CardDescription>
            </CardHeader>
            <CardContent>
              {!alerts ? (
                <div className="text-sm text-muted-foreground">Đang tải cảnh báo…</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md border p-4">
                    <div className="text-sm font-medium">Đơn đang pending lâu</div>
                    <div className="text-2xl font-bold mt-1">{alerts.longPendingOrders}</div>
                  </div>
                  <div className="rounded-md border p-4">
                    <div className="text-sm font-medium">Sản phẩm chờ duyệt</div>
                    <div className="text-2xl font-bold mt-1">{alerts.productsWaitingApproval}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hoạt động gần đây */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>Những hành động mới nhất trên hệ thống</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <div className="text-sm text-muted-foreground">Đang tải...</div>
                ) : !activities?.length ? (
                  <div className="text-sm text-muted-foreground">Chưa có hoạt động nào.</div>
                ) : (
                  <ul className="space-y-2">
                    {activities.map((a) => (
                      <li key={a.id} className="text-sm">
                        <span className="font-medium">{a.action}</span>
                        <span className="text-muted-foreground"> • {a.time}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Thao tác nhanh */}
            <Card>
              <CardHeader>
                <CardTitle>Thao tác nhanh</CardTitle>
                <CardDescription>Các tác vụ quản trị thường dùng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  to="/admin/global-categories"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  aria-label="Quản lý Danh mục Toàn cục"
                >
                  <FolderTree className="h-4 w-4" />
                  <span className="text-sm">Quản lý Danh mục Toàn cục</span>
                </Link>
                <Link
                  to="/admin/users"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  aria-label="Xem tất cả Người dùng"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Xem tất cả Người dùng</span>
                </Link>
                <Link
                  to="/admin/products"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  aria-label="Duyệt Sản phẩm"
                >
                  <Package className="h-4 w-4" />
                  <span className="text-sm">Duyệt Sản phẩm</span>
                </Link>
                <Link
                  to="/admin/analytics"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  aria-label="Xem Phân tích"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Xem Phân tích</span>
                </Link>
              </CardContent>
            </Card>
          </div>
      </div>
    );
}
