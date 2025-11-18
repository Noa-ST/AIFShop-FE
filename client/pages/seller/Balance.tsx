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
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Clock } from "lucide-react";
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
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [intervalMs, setIntervalMs] = useState<number>(30000); // 30s

  function setPresetRange(preset: "today" | "7d" | "30d" | "month") {
    const now = new Date();
    const yyyyMmDd = (d: Date) => d.toISOString().slice(0, 10);
    if (preset === "today") {
      const d = new Date(now);
      setFrom(yyyyMmDd(d));
      setTo(yyyyMmDd(d));
      return;
    }
    if (preset === "7d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setFrom(yyyyMmDd(start));
      setTo(yyyyMmDd(now));
      return;
    }
    if (preset === "30d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      setFrom(yyyyMmDd(start));
      setTo(yyyyMmDd(now));
      return;
    }
    // Tháng này
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFrom(yyyyMmDd(start));
    setTo(yyyyMmDd(end));
  }

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
    refetchInterval: autoRefresh ? intervalMs : false,
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

  function exportCsv() {
    if (!summary) return;
    const lines: string[] = [];
    const push = (arr: (string | number | null | undefined)[]) =>
      lines.push(arr.map((x) => (x === null || x === undefined ? "" : String(x))).join(","));
    // Meta
    push(["ShopId", shopId]);
    push(["From", from]);
    push(["To", to]);
    push(["GroupBy", groupBy]);
    push(["OnlyPaid", onlyPaid ? "true" : "false"]);
    push(["TotalRevenue", summary.totalRevenue]);
    push(["AOV", summary.aov]);
    push(["TotalOrders", summary.orders.totalOrders]);
    push(["PaidOrders", summary.orders.paidOrders]);
    push(["RefundedOrders", summary.orders.refundedOrders]);
    lines.push("");
    // Timeseries
    push(["date", "revenue", "orders", "paidOrders"]);
    summary.timeseries.forEach((t) => push([t.date, t.revenue, t.orders, t.paidOrders]));
    const bom = "\ufeff"; // BOM để Excel nhận UTF-8
    const blob = new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = `revenue_${shopId || "shop"}_${from}_${to}_${groupBy}.csv`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

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
          {/* Actions */}
          <div className="md:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Khoảng nhanh:</span>
            <Button variant="secondary" size="sm" onClick={() => setPresetRange("today")}>Hôm nay</Button>
            <Button variant="secondary" size="sm" onClick={() => setPresetRange("7d")}>7 ngày</Button>
            <Button variant="secondary" size="sm" onClick={() => setPresetRange("30d")}>30 ngày</Button>
            <Button variant="secondary" size="sm" onClick={() => setPresetRange("month")}>Tháng này</Button>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1 h-4 w-4" />Làm mới
              </Button>
              <Button size="sm" onClick={exportCsv} disabled={!summary || (summary?.timeseries?.length ?? 0) === 0}>
                <Download className="mr-1 h-4 w-4" />Xuất CSV
              </Button>
            </div>
          </div>
          {/* Auto refresh */}
          <div className="md:col-span-2 lg:col-span-4 flex items-center gap-3">
            <Checkbox id="autoRefresh" checked={autoRefresh} onCheckedChange={(c) => setAutoRefresh(Boolean(c))} />
            <label htmlFor="autoRefresh" className="text-sm">Tự động làm mới</label>
            <select
              className="ml-2 h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              disabled={!autoRefresh}
            >
              <option value={15000}>15s</option>
              <option value={30000}>30s</option>
              <option value={60000}>60s</option>
            </select>
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