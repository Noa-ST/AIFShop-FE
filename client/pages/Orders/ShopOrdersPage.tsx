import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Building2, Filter, Download } from "lucide-react";

import { OrdersTable } from "@/components/orders/OrdersTable";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ORDER_STATUS_OPTIONS } from "@/constants/order-status";
import { useOrderList } from "@/hooks/use-orders";
import { useAuth } from "@/contexts/AuthContext";
import type { OrderStatus } from "@/services/types";
import { fetchShopBySeller } from "@/lib/api";
import { SellerOrderActions } from "@/components/orders/SellerOrderActions";

// ===== Filter types & defaults (fix: ensure declared before usage) =====
type FilterFormValues = {
  status: OrderStatus | "all";
  keyword?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const DEFAULT_FILTER: FilterFormValues = {
  status: "all",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const statusOptions: { label: string; value: OrderStatus | "all" }[] = [
  { label: "Tất cả", value: "all" },
  ...ORDER_STATUS_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value as OrderStatus,
  })),
];

function ShopOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // ✅ Log component render
  console.log("🔍 ShopOrdersPage rendered:", { user, userId: user?.id });

  const form = useForm<FilterFormValues>({
    defaultValues: DEFAULT_FILTER,
  });

  const sellerId = user?.id;
  
  // ✅ Log sellerId state
  console.log("🔍 ShopOrdersPage - sellerId:", sellerId, "user:", user);
  console.log("🔍 Query enabled:", Boolean(sellerId));

  const {
    data: shop,
    isLoading: isShopLoading,
    isFetching: isShopFetching,
    isError: isShopError,
    error: shopError,
    status: shopQueryStatus,
  } = useQuery({
    queryKey: ["shops", "by-seller", sellerId],
    queryFn: async () => {
      console.log("🔍 [QueryFn] Fetching shop for seller:", sellerId);
      try {
        const result = await fetchShopBySeller(sellerId as string);
        console.log("✅ [QueryFn] Shop fetched:", result);
        return result;
      } catch (error: any) {
        console.error("❌ [QueryFn] Error fetching shop:", error);
        throw error;
      }
    },
    enabled: Boolean(sellerId),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 5, // ✅ Cache for 5 minutes
  });
  
  // ✅ Log query state
  console.log("🔍 Shop query state:", {
    isShopLoading,
    isShopFetching,
    isShopError,
    shopQueryStatus,
    hasShop: !!shop,
    shopId: shop?.id || shop?.shopId,
  });

  // ✅ Timeout detection - show error if loading takes too long
  useEffect(() => {
    if (isShopLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
        console.error("⏱️ Shop loading timeout after 10 seconds");
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isShopLoading]);

  useEffect(() => {
    if (isShopError && shopError) {
      toast({
        title: "Không thể tải thông tin cửa hàng",
        description: shopError.message,
        variant: "destructive",
      });
    }
  }, [isShopError, shopError, toast]);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [intervalMs, setIntervalMs] = useState<number>(30000); // 30s

  const status = form.watch("status");
  const values = form.watch();
  const selectedStatus = useMemo(
    () => (status && status !== "all" ? (status as OrderStatus) : undefined),
    [status],
  );

  // ✅ Build filter object from form values
  const computedFilter = useMemo(() => {
    return {
      keyword: values.keyword?.trim() || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      minAmount:
        typeof values.minAmount === "number"
          ? values.minAmount
          : values.minAmount
          ? Number(values.minAmount)
          : undefined,
      maxAmount:
        typeof values.maxAmount === "number"
          ? values.maxAmount
          : values.maxAmount
          ? Number(values.maxAmount)
          : undefined,
      sortBy: values.sortBy || "createdAt",
      sortOrder: values.sortOrder || "desc",
      page: 1,
      pageSize: 50,
    };
  }, [values]);

  const shopId = useMemo(() => {
    if (!shop) {
      console.log("🔍 shopId: shop is null/undefined");
      return undefined;
    }
    if (Array.isArray(shop) && shop.length) {
      const id = shop[0]?.id || shop[0]?.shopId;
      console.log("🔍 shopId from array:", id);
      return id;
    }
    if (typeof shop === "object") {
      const id = (shop as any).id || (shop as any).shopId;
      console.log("🔍 shopId from object:", id, "shop:", shop);
      return id;
    }
    console.log("🔍 shopId: shop type is not array or object:", typeof shop);
    return undefined;
  }, [shop]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOrderList({
    scope: "shop",
    id: shopId,
    status: selectedStatus,
    filter: computedFilter,
    refetchIntervalMs: autoRefresh ? intervalMs : undefined,
  });

  // ✅ Log order list state
  useEffect(() => {
    console.log("🔍 OrderList state:", {
      shopId,
      enabled: Boolean(shopId),
      isLoading,
      isFetching,
      isError,
      dataCount: data?.length ?? 0,
      error: error?.message,
    });
  }, [shopId, isLoading, isFetching, isError, data, error]);

  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Không thể tải đơn hàng",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // ✅ Debug logging - MUST BE BEFORE EARLY RETURNS (Rules of Hooks)
  useEffect(() => {
    console.log("🔍 ShopOrdersPage Debug:", {
      sellerId,
      shopId,
      isShopLoading,
      isLoading,
      isFetching,
      shop,
      ordersCount: data?.length ?? 0,
    });
  }, [sellerId, shopId, isShopLoading, isLoading, isFetching, shop, data?.length]);

  if (!sellerId) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Chưa đăng nhập</h2>
            <p className="text-sm text-muted-foreground">
              Vui lòng đăng nhập bằng tài khoản người bán để xem đơn hàng cửa hàng.
            </p>
          </div>
          <Button asChild>
            <a href="/login">Đăng nhập</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!shopId && !isShopLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Bạn chưa có cửa hàng</h2>
            <p className="text-sm text-muted-foreground">
              Tạo cửa hàng để bắt đầu nhận và quản lý đơn hàng từ khách hàng.
            </p>
          </div>
          <Button asChild>
            <a href="/seller/create-shop">Tạo cửa hàng ngay</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ✅ Show loading state when fetching shop data
  if (isShopLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Đang tải thông tin cửa hàng...</p>
          <p className="text-xs text-muted-foreground">sellerId: {sellerId}</p>
          {loadingTimeout && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                Tải quá lâu. Vui lòng kiểm tra kết nối hoặc thử lại.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Tải lại trang
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ✅ Show error state for shop loading
  if (isShopError && shopError) {
    console.error("❌ Shop loading error:", shopError);
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
          <Building2 className="h-10 w-10 text-destructive" />
          <div>
            <h2 className="text-lg font-semibold">Lỗi khi tải cửa hàng</h2>
            <p className="text-sm text-muted-foreground">
              {shopError.message || "Không thể tải thông tin cửa hàng"}
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
        </CardContent>
      </Card>
    );
  }

  const orders = data ?? [];
  const loadingState = isLoading || isFetching || isShopLoading;

  // ✅ Quick actions: set status via chips
  const currentStatus = form.watch("status");
  const handleQuickStatus = (value: FilterFormValues["status"]) => {
    form.setValue("status", value);
    // Refetch to reflect new status immediately
    refetch();
  };

  // ✅ Export CSV of current orders list
  const handleExportCSV = () => {
    if (!orders || orders.length === 0) {
      toast({
        title: "Không có dữ liệu",
        description: "Danh sách đơn hiện tại trống, không thể xuất CSV.",
      });
      return;
    }

    const headers = [
      "MaDon",
      "KhachHang",
      "TongTien",
      "PhiVanChuyen",
      "GiamGia",
      "TrangThai",
      "ThanhToan",
      "PhuongThuc",
      "NgayTao",
      "NgayCapNhat",
      "SoSanPham",
    ];

    const escape = (val: any) => {
      const s = String(val ?? "");
      return '"' + s.replace(/"/g, '""') + '"';
    };

    const rows = orders.map((o) => [
      escape(o.orderId),
      escape(o.customerName ?? ""),
      String(o.totalAmount ?? 0),
      String(o.shippingFee ?? 0),
      String(o.discountAmount ?? 0),
      escape(o.status),
      escape(o.paymentStatus),
      escape(o.paymentMethod),
      escape(o.createdAt),
      escape(o.updatedAt),
      String(o.items?.length ?? 0),
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = `orders_${new Date().toISOString().slice(0,19).replace(/[:T]/g, "-")}.csv`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Đã xuất CSV", description: `Tệp ${fileName} đã được tải xuống.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Đơn hàng cửa hàng
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý trạng thái đơn hàng của cửa hàng và hỗ trợ khách hàng kịp thời.
        </p>
      </div>

      {/* ✅ Quick status chips & Export CSV */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {statusOptions.map((opt) => {
            const selected = currentStatus === opt.value;
            return (
              <Button
                key={opt.value}
                size="sm"
                variant={selected ? "default" : "outline"}
                className="h-8"
                onClick={() => handleQuickStatus(opt.value)}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-9"
          onClick={handleExportCSV}
          disabled={loadingState}
        >
          <Download className="h-4 w-4 mr-2" /> Xuất CSV
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium uppercase text-muted-foreground">
            Bộ lọc
          </h2>
        </div>

        <Form {...form}>
          <form className="grid gap-4 md:grid-cols-3">
            {/* Trạng thái */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái đơn hàng</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Từ khóa */}
            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Từ khóa</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Mã đơn, tên khách hàng..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Ngày bắt đầu */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Từ ngày</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Ngày kết thúc */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đến ngày</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Khoảng tiền từ */}
            <FormField
              control={form.control}
              name="minAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền từ</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={1000} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Khoảng tiền đến */}
            <FormField
              control={form.control}
              name="maxAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền đến</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={1000} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Sắp xếp theo */}
            <FormField
              control={form.control}
              name="sortBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sắp xếp theo</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trường" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Ngày tạo</SelectItem>
                        <SelectItem value="totalAmount">Tổng tiền</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Thứ tự */}
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thứ tự</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Thứ tự" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Giảm dần</SelectItem>
                        <SelectItem value="asc">Tăng dần</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Điều khiển làm mới */}
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(DEFAULT_FILTER);
                  refetch();
                }}
              >
                Đặt lại
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => refetch()}
                disabled={isLoading || isFetching}
              >
                Làm mới
              </Button>
            </div>

            {/* Tự động làm mới */}
            <div className="md:col-span-3 flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <div>
                  <div className="text-sm font-medium">Tự động làm mới</div>
                  <div className="text-xs text-muted-foreground">
                    Tải lại danh sách đơn theo chu kỳ khi bật.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Chu kỳ</span>
                <Select
                  value={String(intervalMs)}
                  onValueChange={(v) => setIntervalMs(Number(v))}
                  disabled={!autoRefresh}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15000">15 giây</SelectItem>
                    <SelectItem value="30000">30 giây</SelectItem>
                    <SelectItem value="60000">60 giây</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </Form>
      </div>

      <OrdersTable
        orders={orders}
        isLoading={loadingState}
        emptyTitle="Chưa có đơn hàng nào"
        emptyDescription="Khi khách hàng đặt mua sản phẩm, đơn hàng sẽ xuất hiện tại đây để bạn xử lý."
        emptyCtaHref="/seller/products"
        emptyCtaLabel="Quản lý sản phẩm"
        showCustomerColumn
        renderActionsColumn={(order) => (
          <SellerOrderActions
            order={order}
            // Note: useOrderMutation hook already invalidates queries automatically
            // onStatusChange callback is optional and can cause double refetch
          />
        )}
      />
    </div>
  );
};

export default ShopOrdersPage;

