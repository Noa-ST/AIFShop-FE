import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyBalance,
  getMySettlements,
  requestWithdrawal,
  formatPrice,
  getStatusLabel,
  type SettlementRequestDto,
  type SettlementStatus,
} from "@/services/settlementService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  ArrowDownCircle,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getShopOrders } from "@/services/orders";
import { fetchShopBySeller } from "@/lib/api";
import { format } from "date-fns";
import shopService, {
  type RevenueSummaryParams,
  type RevenueSummaryData,
} from "@/services/shopService";

const MIN_SETTLEMENT_AMOUNT = 100000; // 100,000 VND

export default function SellerBalancePage() {
  const queryClient = useQueryClient();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | "all">(
    "all",
  );

  const withdrawalForm = useForm<SettlementRequestDto>({
    defaultValues: {
      amount: 0,
      method: "BankTransfer",
      bankAccount: "",
      bankName: "",
      accountHolderName: "",
      notes: "",
    },
  });

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["sellerBalance"],
    queryFn: getMyBalance,
  });

  const { data: settlements = [], isLoading: settlementsLoading } = useQuery({
    queryKey: ["mySettlements", statusFilter],
    queryFn: () =>
      getMySettlements(statusFilter === "all" ? undefined : statusFilter),
  });

  const requestMutation = useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerBalance"] });
      queryClient.invalidateQueries({ queryKey: ["mySettlements"] });
      setShowRequestDialog(false);
      withdrawalForm.reset();
      toast({
        title: "Thành công",
        description: "Đã gửi yêu cầu giải ngân. Vui lòng chờ admin duyệt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo yêu cầu giải ngân.",
        variant: "destructive",
      });
    },
  });

  // Bộ lọc thời gian và tổng hợp doanh thu theo kỳ
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "month",
  );
  const { user } = useAuth();
  const { data: period = { orders: [] }, isLoading: revenueLoading } = useQuery(
    {
      queryKey: ["sellerOrdersForRevenue", user?.id],
      enabled: !!user?.id,
      queryFn: async () => {
        try {
          const shop = await fetchShopBySeller(user!.id!);
          const shopId =
            shop?.id ??
            shop?.shopId ??
            (Array.isArray(shop) ? shop[0]?.id : undefined);
          if (!shopId) return { orders: [] };
          const result = await getShopOrders(String(shopId), {
            page: 1,
            pageSize: 1000,
            sortBy: "createdAt",
            sortOrder: "desc",
          });
          return { orders: result?.data ?? [] };
        } catch {
          return { orders: [] };
        }
      },
    },
  );

  const getStartDate = (range: "today" | "week" | "month") => {
    const now = new Date();
    const d = new Date(now);
    if (range === "today") {
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (range === "week") {
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    // month
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const startDate = getStartDate(timeRange);
  const periodOrders = (period.orders ?? []).filter((o: any) => {
    const created = o.createdAt ? new Date(o.createdAt) : undefined;
    return created ? created >= startDate : false;
  });
  const paidOrders = periodOrders.filter(
    (o: any) => o.isPaid || o.paymentStatus === "Paid",
  );
  const sumBy = (methods: string[]) =>
    paidOrders
      .filter((o: any) => methods.includes(o.paymentMethod))
      .reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);

  const cashRevenue = sumBy(["Cash", "COD"]);
  const transferRevenue = sumBy(["Bank", "Wallet"]);
  const totalRevenue = cashRevenue + transferRevenue;
  const cashShare =
    totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0;
  const transferShare = totalRevenue > 0 ? 100 - cashShare : 0;
  const aov =
    paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
  const successRate =
    periodOrders.length > 0
      ? Math.round((paidOrders.length / periodOrders.length) * 100)
      : 0;

  // Dữ liệu biểu đồ xu hướng theo ngày
  const buckets: { label: string; value: number }[] = (() => {
    const days = timeRange === "today" ? 1 : timeRange === "week" ? 7 : 30;
    const arr: { label: string; value: number }[] = [];
    const map = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const label = format(d, "dd/MM");
      map.set(label, 0);
    }
    paidOrders.forEach((o: any) => {
      const d = o.createdAt ? new Date(o.createdAt) : undefined;
      if (!d) return;
      const label = format(d, "dd/MM");
      if (map.has(label)) {
        map.set(label, (map.get(label) || 0) + (o.totalAmount || 0));
      }
    });
    map.forEach((v, k) => arr.push({ label: k, value: v }));
    return arr;
  })();

  const handleRequestWithdrawal = (values: SettlementRequestDto) => {
    if (values.amount < MIN_SETTLEMENT_AMOUNT) {
      toast({
        title: "Lỗi",
        description: `Số tiền tối thiểu là ${formatPrice(MIN_SETTLEMENT_AMOUNT)}`,
        variant: "destructive",
      });
      return;
    }

    if (values.amount > (balance?.availableBalance || 0)) {
      toast({
        title: "Lỗi",
        description: "Số tiền vượt quá số dư có thể rút.",
        variant: "destructive",
      });
      return;
    }

    if (values.method === "BankTransfer") {
      if (
        !values.bankAccount ||
        !values.bankName ||
        !values.accountHolderName
      ) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin ngân hàng.",
          variant: "destructive",
        });
        return;
      }
    }

    requestMutation.mutate(values);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "--";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  // (Đã loại bỏ khối truy vấn doanh thu trùng lặp)

  if (balanceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Doanh thu & Giải ngân
          </h2>
          <p className="text-muted-foreground">
            Quản lý số dư và yêu cầu giải ngân của bạn.
          </p>
        </div>
        <Button
          onClick={() => setShowRequestDialog(true)}
          disabled={(balance?.availableBalance || 0) < MIN_SETTLEMENT_AMOUNT}
        >
          <ArrowDownCircle className="mr-2 h-4 w-4" />
          Yêu cầu giải ngân
        </Button>
      </div>

      {/* Revenue Cards (old block removed in favor of filtered metrics below) */}

      {/* Revenue by Payment Method */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Doanh thu theo phương thức thanh toán</CardTitle>
              <CardDescription>
                Đơn đã thanh toán trong kỳ (
                {timeRange === "today"
                  ? "Hôm nay"
                  : timeRange === "week"
                    ? "7 ngày"
                    : "30 ngày"}
                )
              </CardDescription>
            </div>
            <Select
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as any)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Chọn kỳ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="week">Tuần</SelectItem>
                <SelectItem value="month">Tháng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tiền mặt
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(cashRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cash + COD
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tiền chuyển khoản
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(transferRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bank + Wallet
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tổng doanh thu
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Đã thanh toán
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Chờ giải ngân
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(balance?.totalPendingWithdrawal || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Yêu cầu đang xử lý
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          {!revenueLoading && (
            <div className="mt-4 text-sm text-muted-foreground">
              Tỷ trọng phương thức: Tiền mặt {cashShare}% · Chuyển khoản{" "}
              {transferShare}%
            </div>
          )}
          {!revenueLoading && (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    AOV (giá trị đơn trung bình)
                  </CardTitle>
                  <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(aov || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tổng doanh thu / số đơn đã thanh toán
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tỷ lệ thanh toán thành công
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{successRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Đơn Paid / tổng đơn trong kỳ
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          {!revenueLoading && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Xu hướng doanh thu theo ngày</CardTitle>
                  <CardDescription>
                    Tổng doanh thu đã thanh toán mỗi ngày trong kỳ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RevenueTrendChart data={buckets} />
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlements List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lịch sử giải ngân</CardTitle>
              <CardDescription>
                Theo dõi các yêu cầu giải ngân của bạn.
              </CardDescription>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as SettlementStatus | "all")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Pending">Chờ duyệt</SelectItem>
                <SelectItem value="Approved">Đã duyệt</SelectItem>
                <SelectItem value="Processing">Đang xử lý</SelectItem>
                <SelectItem value="Completed">Hoàn tất</SelectItem>
                <SelectItem value="Rejected">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {settlementsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có yêu cầu giải ngân nào.
            </div>
          ) : (
            <div className="space-y-4">
              {settlements.map((settlement) => (
                <div
                  key={settlement.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">
                        {formatPrice(settlement.amount)}
                      </span>
                      <Badge variant="outline">
                        {getStatusLabel(settlement.status)}
                      </Badge>
                      {settlement.method === "BankTransfer" && (
                        <Badge variant="secondary">
                          {settlement.bankName || "Ngân hàng"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Yêu cầu: {formatDate(settlement.requestDate)}</p>
                      {settlement.approvedDate && (
                        <p>Duyệt: {formatDate(settlement.approvedDate)}</p>
                      )}
                      {settlement.completedDate && (
                        <p>Hoàn tất: {formatDate(settlement.completedDate)}</p>
                      )}
                      {settlement.notes && <p>Ghi chú: {settlement.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Withdrawal Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yêu cầu giải ngân</DialogTitle>
            <DialogDescription>
              Số dư có thể rút: {formatPrice(balance?.availableBalance || 0)}
              <br />
              Số tiền tối thiểu: {formatPrice(MIN_SETTLEMENT_AMOUNT)}
            </DialogDescription>
          </DialogHeader>
          <Form {...withdrawalForm}>
            <form
              className="space-y-4"
              onSubmit={withdrawalForm.handleSubmit(handleRequestWithdrawal)}
            >
              <FormField
                control={withdrawalForm.control}
                name="amount"
                rules={{
                  required: "Vui lòng nhập số tiền",
                  min: {
                    value: MIN_SETTLEMENT_AMOUNT,
                    message: `Số tiền tối thiểu là ${formatPrice(MIN_SETTLEMENT_AMOUNT)}`,
                  },
                  max: {
                    value: balance?.availableBalance || 0,
                    message: "Số tiền vượt quá số dư có thể rút",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số tiền (VND)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Nhập số tiền"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={withdrawalForm.control}
                name="method"
                rules={{ required: "Vui lòng chọn phương thức" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phương thức</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phương thức" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BankTransfer">
                            Chuyển khoản ngân hàng
                          </SelectItem>
                          <SelectItem value="Cash">Tiền mặt</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {withdrawalForm.watch("method") === "BankTransfer" && (
                <>
                  <FormField
                    control={withdrawalForm.control}
                    name="bankAccount"
                    rules={{ required: "Vui lòng nhập số tài khoản" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số tài khoản</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập số tài khoản" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={withdrawalForm.control}
                    name="bankName"
                    rules={{ required: "Vui lòng nhập tên ngân hàng" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên ngân hàng</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: Vietcombank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={withdrawalForm.control}
                    name="accountHolderName"
                    rules={{ required: "Vui lòng nhập tên chủ tài khoản" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên chủ tài khoản</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập tên chủ tài khoản"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={withdrawalForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú (tùy chọn)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ghi chú thêm (nếu có)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRequestDialog(false);
                    withdrawalForm.reset();
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={requestMutation.isPending}>
                  {requestMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Biểu đồ cột đơn giản hiển thị doanh thu theo ngày
const max = Math.max(0, ...(data ?? []).map((d) => d.value));
const safeMax = max === 0 ? 1 : max;
return (
  <div className="w-full">
    <div className="flex items-end gap-2 h-36">
      {data.map((d, idx) => {
        const height = Math.round((d.value / safeMax) * 100);
        return (
          <div
            key={idx}
            className="flex flex-col items-center"
            style={{ width: "22px" }}
          >
            <div
              className="w-full bg-primary/20 hover:bg-primary/30 transition-colors"
              style={{ height: `${height}%`, minHeight: 2 }}
              title={`${d.label}: ${formatPrice(d.value)}`}
            />
            <span className="mt-1 text-[10px] text-muted-foreground">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
    <div className="mt-2 text-xs text-muted-foreground">
      Tổng theo ngày (VND)
    </div>
  </div>
);

// Bộ lọc cho API doanh thu
const [from, setFrom] = useState<string>("");
const [to, setTo] = useState<string>("");
const [groupBy, setGroupBy] = useState<"day" | "week">("day");
const [onlyPaid, setOnlyPaid] = useState<boolean>(true);
const [status, setStatus] = useState<string>("Delivered");
const [methods, setMethods] = useState<string[]>(["Bank", "Wallet"]); // mặc định giống ví dụ

const { user } = useAuth();

// Lấy shopId của seller
const { data: shopForSeller } = useQuery({
  queryKey: ["sellerShop", user?.id],
  enabled: !!user?.id,
  queryFn: () => fetchShopBySeller(user!.id!),
});
const shopId =
  (shopForSeller as any)?.id ??
  (shopForSeller as any)?.shopId ??
  (Array.isArray(shopForSeller) ? shopForSeller[0]?.id : undefined);

// Gọi API tổng hợp doanh thu
const revenueParams: RevenueSummaryParams = {
  from: from || undefined,
  to: to || undefined,
  groupBy,
  onlyPaid,
  status,
  paymentMethod: methods,
};

const { data: revenueSummaryResp, isLoading: summaryLoading } = useQuery({
  queryKey: ["shopRevenueSummary", shopId, revenueParams],
  enabled: !!shopId,
  queryFn: () => shopService.getRevenueSummary(String(shopId), revenueParams),
  staleTime: 30_000,
});

const summary: RevenueSummaryData | undefined = revenueSummaryResp?.data;

// Tính các chỉ số từ summary (fallback 0 nếu chưa có)
const cashRevenue =
  (summary?.byMethod?.cash ?? 0) + (summary?.byMethod?.cod ?? 0);
const transferRevenue =
  (summary?.byMethod?.bank ?? 0) + (summary?.byMethod?.wallet ?? 0);
const totalRevenue = summary?.totalRevenue ?? 0;
const aov = summary?.aov ?? 0;
const paidOrdersCount = summary?.orders?.paidOrders ?? 0;
const totalOrdersCount = summary?.orders?.totalOrders ?? 0;
const successRate =
  totalOrdersCount > 0
    ? Math.round((paidOrdersCount / totalOrdersCount) * 100)
    : 0;

const cashShare =
  totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0;
const transferShare = totalRevenue > 0 ? 100 - cashShare : 0;

// Dữ liệu biểu đồ từ timeseries của API
const buckets: { label: string; value: number }[] = (
  summary?.timeseries ?? []
).map((p) => ({
  label: (() => {
    try {
      return format(new Date(p.date), "dd/MM");
    } catch {
      return p.date;
    }
  })(),
  value: p.revenue ?? 0,
}));

{
  /* Bộ lọc API doanh thu */
}
<Card>
  <CardHeader>
    <div className="flex items-center justify-between gap-3">
      <div>
        <CardTitle>Tổng hợp doanh thu (từ API)</CardTitle>
        <CardDescription>Chọn phạm vi thời gian và phương thức</CardDescription>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-40"
        />
        <span className="text-muted-foreground">đến</span>
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-40"
        />
        <Select
          value={groupBy}
          onValueChange={(v) => setGroupBy(v as "day" | "week")}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Nhóm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Theo ngày</SelectItem>
            <SelectItem value="week">Theo tuần</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyPaid}
            onChange={(e) => setOnlyPaid(e.target.checked)}
          />
          Chỉ đơn đã thanh toán
        </label>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    {summaryLoading ? (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    ) : (
      <>
        {/* Doanh thu theo phương thức */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tiền mặt (Cash+COD)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(cashRevenue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chuyển khoản (Bank+Wallet)
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(transferRevenue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng doanh thu
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(totalRevenue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AOV</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(aov || 0)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Tỷ trọng phương thức: Tiền mặt {cashShare}% · Chuyển khoản{" "}
          {transferShare}%{" · "}Đơn thanh toán: {paidOrdersCount} / Tổng đơn:{" "}
          {totalOrdersCount}
        </div>

        {/* Biểu đồ xu hướng từ timeseries */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Xu hướng doanh thu ({groupBy === "day" ? "ngày" : "tuần"})
              </CardTitle>
              <CardDescription>
                Tổng doanh thu đã thanh toán mỗi bucket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueTrendChart data={buckets} />
            </CardContent>
          </Card>
        </div>
      </>
    )}
  </CardContent>
</Card>;

{
  /* Khối giải ngân và lịch sử giữ nguyên */
}
<div className="space-y-6">
  {/* Header & Request button giữ nguyên */}
  {/* Settlements List */}
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Lịch sử giải ngân</CardTitle>
          <CardDescription>
            Theo dõi các yêu cầu giải ngân của bạn.
          </CardDescription>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as SettlementStatus | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="Pending">Chờ duyệt</SelectItem>
            <SelectItem value="Approved">Đã duyệt</SelectItem>
            <SelectItem value="Processing">Đang xử lý</SelectItem>
            <SelectItem value="Completed">Hoàn tất</SelectItem>
            <SelectItem value="Rejected">Đã từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardHeader>
    <CardContent>
      {settlementsLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : settlements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Chưa có yêu cầu giải ngân nào.
        </div>
      ) : (
        <div className="space-y-4">
          {settlements.map((settlement) => (
            <div
              key={settlement.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">
                    {formatPrice(settlement.amount)}
                  </span>
                  <Badge variant="outline">
                    {getStatusLabel(settlement.status)}
                  </Badge>
                  {settlement.method === "BankTransfer" && (
                    <Badge variant="secondary">
                      {settlement.bankName || "Ngân hàng"}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Yêu cầu: {formatDate(settlement.requestDate)}</p>
                  {settlement.approvedDate && (
                    <p>Duyệt: {formatDate(settlement.approvedDate)}</p>
                  )}
                  {settlement.completedDate && (
                    <p>Hoàn tất: {formatDate(settlement.completedDate)}</p>
                  )}
                  {settlement.notes && <p>Ghi chú: {settlement.notes}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>

  {/* Request Withdrawal Dialog */}
  <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Yêu cầu giải ngân</DialogTitle>
        <DialogDescription>
          Số dư có thể rút: {formatPrice(balance?.availableBalance || 0)}
          <br />
          Số tiền tối thiểu: {formatPrice(MIN_SETTLEMENT_AMOUNT)}
        </DialogDescription>
      </DialogHeader>
      <Form {...withdrawalForm}>
        <form
          className="space-y-4"
          onSubmit={withdrawalForm.handleSubmit(handleRequestWithdrawal)}
        >
          <FormField
            control={withdrawalForm.control}
            name="amount"
            rules={{
              required: "Vui lòng nhập số tiền",
              min: {
                value: MIN_SETTLEMENT_AMOUNT,
                message: `Số tiền tối thiểu là ${formatPrice(MIN_SETTLEMENT_AMOUNT)}`,
              },
              max: {
                value: balance?.availableBalance || 0,
                message: "Số tiền vượt quá số dư có thể rút",
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số tiền (VND)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Nhập số tiền"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={withdrawalForm.control}
            name="method"
            rules={{ required: "Vui lòng chọn phương thức" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phương thức</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BankTransfer">
                        Chuyển khoản ngân hàng
                      </SelectItem>
                      <SelectItem value="Cash">Tiền mặt</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {withdrawalForm.watch("method") === "BankTransfer" && (
            <>
              <FormField
                control={withdrawalForm.control}
                name="bankAccount"
                rules={{ required: "Vui lòng nhập số tài khoản" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số tài khoản</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập số tài khoản" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={withdrawalForm.control}
                name="bankName"
                rules={{ required: "Vui lòng nhập tên ngân hàng" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên ngân hàng</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Vietcombank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={withdrawalForm.control}
                name="accountHolderName"
                rules={{ required: "Vui lòng nhập tên chủ tài khoản" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên chủ tài khoản</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên chủ tài khoản" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={withdrawalForm.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ghi chú (tùy chọn)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ghi chú thêm (nếu có)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowRequestDialog(false);
                withdrawalForm.reset();
              }}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={requestMutation.isPending}>
              {requestMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
</div>;

// Biểu đồ cột đơn giản hiển thị doanh thu theo ngày
function RevenueTrendChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(0, ...data.map((d) => d.value));
  const safeMax = max === 0 ? 1 : max;
  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-36">
        {data.map((d, idx) => {
          const height = Math.round((d.value / safeMax) * 100);
          return (
            <div
              key={idx}
              className="flex flex-col items-center"
              style={{ width: "22px" }}
            >
              <div
                className="w-full bg-primary/20 hover:bg-primary/30 transition-colors"
                style={{ height: `${height}%`, minHeight: 2 }}
                title={`${d.label}: ${formatPrice(d.value)}`}
              />
              <span className="mt-1 text-[10px] text-muted-foreground">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Tổng theo ngày (VND)
      </div>
    </div>
  );
}

function setShowRequestDialog(arg0: boolean) {
  throw new Error("Function not implemented.");
}
