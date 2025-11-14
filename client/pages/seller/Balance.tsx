import React, { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchShopBySeller } from "@/lib/api";
import shopService, {
  RevenueSummaryParams,
  RevenueSummaryData,
} from "@/services/shopService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
// Tạm thời dùng native <select> để tránh lỗi runtime từ Radix Select trên trang này
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

function formatCurrency(n?: number) {
  const val = typeof n === "number" ? n : 0;
  return val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

function formatCompact(n?: number) {
  const val = typeof n === "number" ? n : 0;
  return new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(val);
}

type Methods = Array<"Bank" | "Wallet" | "Cash" | "COD">;
const ALL_METHODS: Methods = ["Bank", "Wallet", "Cash", "COD"];

function RevenueTrendChart({ data }: { data: RevenueSummaryData["timeseries"] }) {
  const config: ChartConfig = {
    revenue: {
      label: "Doanh thu",
      color: "hsl(var(--chart-1))",
    },
    orders: {
      label: "Đơn hàng",
      color: "hsl(var(--chart-2))",
    },
    ma7: {
      label: "MA7",
      color: "hsl(var(--chart-3))",
    },
  };

  const chartData = useMemo(() => {
    const arr = Array.isArray(data) ? [...data] : [];
    // Tính MA7 cho doanh thu
    let windowSum = 0;
    const result = arr.map((pt, idx) => {
      windowSum += Number(pt.revenue || 0);
      if (idx >= 7) {
        windowSum -= Number(arr[idx - 7].revenue || 0);
      }
      const count = idx + 1 < 7 ? idx + 1 : 7;
      const ma7 = idx + 1 < 7 ? null : Number((windowSum / count).toFixed(2));
      return { ...pt, ma7 } as any;
    });
    return result;
  }, [data]);
  return (
    <ChartContainer config={config} className="w-full h-[220px]">
      <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 6 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(Number(v))} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="revenue"
          type="monotone"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          dataKey="orders"
          type="monotone"
          stroke="var(--color-orders)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          dataKey="ma7"
          type="monotone"
          stroke="var(--color-ma7)"
          strokeWidth={2}
          opacity={0.85}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Legend wrapperStyle={{ paddingTop: 8 }} />
      </AreaChart>
    </ChartContainer>
  );
}

export default function SellerBalancePage() {
  const { user } = useAuth();
  const sellerId = user?.id;

  const { data: shop } = useQuery({
    queryKey: ["shopBySeller", sellerId],
    queryFn: async () => {
      if (!sellerId) return null;
      return await fetchShopBySeller(sellerId);
    },
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });

  const shopId = useMemo(() => {
    if (!shop) return null as string | null;
    if (Array.isArray(shop)) return shop[0]?.id || shop[0]?._id || null;
    return shop.id || shop._id || shop.shopId || null;
  }, [shop]);

  // Filters
  const [from, setFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState<"day" | "week">("day");
  const [onlyPaid, setOnlyPaid] = useState<boolean>(false);

  const { data: revenueResp, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "revenueSummary",
      shopId,
      { from, to, groupBy, onlyPaid },
    ],
    queryFn: async () => {
      if (!shopId) return null as any;
      const params: RevenueSummaryParams = {
        from,
        to,
        groupBy,
        onlyPaid,
        status: undefined,
        // Không truyền paymentMethod để mặc định lấy tất cả, đúng với backend
        paymentMethod: undefined,
      };
      return await shopService.getRevenueSummary(shopId, params);
    },
    enabled: !!shopId,
  });

  const summary: RevenueSummaryData | null = useMemo(() => {
    const d = revenueResp?.data as RevenueSummaryData | undefined;
    return d ? d : null;
  }, [revenueResp]);

  const computedLocally = useMemo(() => {
    const msg = (revenueResp as any)?.message || "";
    return typeof msg === "string" && msg.toLowerCase().includes("computed locally");
  }, [revenueResp]);

  const totalRevenue = summary?.totalRevenue ?? 0;
  const aov = summary?.aov ?? 0;
  const orders = summary?.orders ?? { totalOrders: 0, paidOrders: 0, refundedOrders: 0 };
  const successRate = orders.totalOrders
    ? Math.round((orders.paidOrders / orders.totalOrders) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Doanh thu cửa hàng</h2>
        <p className="text-muted-foreground">
          Tổng hợp doanh thu, AOV và xu hướng theo ngày/tuần.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Tối giản: ngày, nhóm, đã thanh toán</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm">Từ ngày</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Đến ngày</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className="text-sm" htmlFor="groupBy">Nhóm theo</label>
            <select
              id="groupBy"
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="onlyPaid" checked={onlyPaid} onCheckedChange={(c) => setOnlyPaid(Boolean(c))} />
            <label htmlFor="onlyPaid" className="text-sm">Chỉ đơn đã thanh toán</label>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tổng doanh thu</CardTitle>
            <CardDescription>Trong khoảng thời gian đã chọn</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AOV</CardTitle>
            <CardDescription>Giá trị trung bình mỗi đơn</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(aov)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tỉ lệ thành công</CardTitle>
            <CardDescription>Đơn đã thanh toán / tổng đơn</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{successRate}%</div>
            )}
          </CardContent>
        </Card>
        {/* Đã lược bỏ thẻ "Theo phương thức" để đơn giản hóa giao diện */}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Xu hướng doanh thu</CardTitle>
          <CardDescription>
            {groupBy === "day" ? "Theo ngày" : "Theo tuần"}
            {computedLocally && (
              <span className="ml-2 text-xs text-muted-foreground">(Tính từ dữ liệu đơn hàng)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}
          {isError && (
            <div className="text-sm text-red-600">
              {(error as any)?.message || "Không thể tải doanh thu"}
            </div>
          )}
          {!isLoading && !isError && summary && (
            <RevenueTrendChart data={summary.timeseries} />
          )}
        </CardContent>
      </Card>

      {/* Orders brief */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng quan đơn hàng</CardTitle>
          <CardDescription>Số lượng đơn trong khoảng lọc</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Tổng đơn</div>
                <Skeleton className="mx-auto mt-2 h-6 w-16" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Đã thanh toán</div>
                <Skeleton className="mx-auto mt-2 h-6 w-16" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Hoàn tiền</div>
                <Skeleton className="mx-auto mt-2 h-6 w-16" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Tổng đơn</div>
                <div className="text-xl font-bold">{orders.totalOrders}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Đã thanh toán</div>
                <div className="text-xl font-bold">{orders.paidOrders}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Hoàn tiền</div>
                <div className="text-xl font-bold">{orders.refundedOrders}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}