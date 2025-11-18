import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Filter, Eye, X, Loader2, CheckCircle, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

import { OrdersTable } from "@/components/orders/OrdersTable";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { reviewsService } from "@/services/reviews";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ORDER_STATUS_OPTIONS } from "@/constants/order-status";
import { useOrderList, useOrderMutation } from "@/hooks/use-orders";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import type { OrderResponseDTO, OrderStatus } from "@/services/types";

type FilterFormValues = {
  status: OrderStatus | "all";
};

const DEFAULT_FILTER: FilterFormValues = {
  status: "all",
};

const statusOptions: { label: string; value: OrderStatus | "all" }[] = [
  { label: "Tất cả", value: "all" },
  ...ORDER_STATUS_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value as OrderStatus,
  })),
];

const fallbackErrorMessage = "Không thể tải danh sách đơn hàng";

function MyOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();

  const form = useForm<FilterFormValues>({
    defaultValues: DEFAULT_FILTER,
  });

  const status = form.watch("status");

  // Search & filter UI state — đặt TRƯỚC useOrderList để kết nối server-side
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  useEffect(() => {
      const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
      return () => clearTimeout(t);
  }, [keyword]);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"createdAt" | "totalAmount" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [onlyCancelable, setOnlyCancelable] = useState(false);
  const [groupByShop, setGroupByShop] = useState(false);

  const selectedStatus = useMemo(
    () => (status && status !== "all" ? (status as OrderStatus) : undefined),
    [status],
  );

  // Server-side filter object
  const serverFilter = useMemo(() => ({
    keyword: debouncedKeyword || undefined,
    status: selectedStatus,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    page: 1,
    pageSize: 100,
  }), [debouncedKeyword, selectedStatus, startDate, endDate, sortBy, sortOrder]);
  const serverFilterKey = useMemo(() => JSON.stringify(serverFilter), [serverFilter]);

  const { data, isLoading, isFetching, isError, error, refetch } = useOrderList({
    scope: "customer",
    id: user?.id,
    status: selectedStatus,
    filter: serverFilter,
  });

  // Refetch when server-side filter changes
  useEffect(() => {
    refetch();
  }, [serverFilterKey, refetch]);

  const { cancelOrderMutation, confirmDeliveryMutation } = useOrderMutation();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<OrderResponseDTO | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [confirmStepChecked, setConfirmStepChecked] = useState(false);

  // Trạng thái cho nút "Mua lại"
  const [reorderLoadingId, setReorderLoadingId] = useState<string | null>(null);

  // Hydrate from query/localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ls = (k: string) => window.localStorage.getItem(k) ?? undefined;
    const st = params.get("status") ?? ls("orders_status");
    if (st && statusOptions.some((s) => String(s.value) === st)) {
      form.setValue("status", st as any);
    }
    setKeyword(params.get("q") ?? ls("orders_q") ?? "");
    const sbRaw = params.get("sortBy") ?? ls("orders_sortBy") ?? "createdAt";
    const sb = ["createdAt", "totalAmount", "status"].includes(String(sbRaw))
      ? (sbRaw as "createdAt" | "totalAmount" | "status")
      : "createdAt";
    setSortBy(sb);
    const soRaw = (params.get("sortOrder") as string | undefined) ?? ls("orders_sortOrder") ?? "desc";
    const so = ["asc", "desc"].includes(String(soRaw)) ? (soRaw as "asc" | "desc") : "desc";
    setSortOrder(so);
    const s = params.get("start") ?? ls("orders_start") ?? undefined;
    const e = params.get("end") ?? ls("orders_end") ?? undefined;
    setStartDate(s || undefined);
    setEndDate(e || undefined);
    setOnlyCancelable((params.get("onlyCancelable") ?? ls("orders_onlyCancelable") ?? "false") === "true");
    setGroupByShop((params.get("groupByShop") ?? ls("orders_groupByShop") ?? "true") === "true");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters to query/localStorage
  useEffect(() => {
    const params = new URLSearchParams();
    const st = form.getValues("status");
    if (st) params.set("status", String(st));
    if (debouncedKeyword) params.set("q", debouncedKeyword);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    params.set("onlyCancelable", String(onlyCancelable));
    params.set("groupByShop", String(groupByShop));
    navigate({ search: `?${params.toString()}` }, { replace: true });

    window.localStorage.setItem("orders_status", String(st));
    window.localStorage.setItem("orders_q", debouncedKeyword);
    window.localStorage.setItem("orders_sortBy", sortBy);
    window.localStorage.setItem("orders_sortOrder", sortOrder);
    startDate
      ? window.localStorage.setItem("orders_start", startDate)
      : window.localStorage.removeItem("orders_start");
    endDate
      ? window.localStorage.setItem("orders_end", endDate)
      : window.localStorage.removeItem("orders_end");
    window.localStorage.setItem("orders_onlyCancelable", String(onlyCancelable));
    window.localStorage.setItem("orders_groupByShop", String(groupByShop));
  }, [form, debouncedKeyword, sortBy, sortOrder, startDate, endDate, onlyCancelable, groupByShop, navigate]);

  // Helper: đơn có thể hủy khi Pending hoặc Confirmed
  const canCancelOrder = (order: OrderResponseDTO) =>
    order.status === "Pending" || order.status === "Confirmed";

  // Trạng thái loading tổng hợp
  const loadingState = isLoading || isFetching;

  // Lọc client-side theo tùy chọn "chỉ đơn có thể hủy"
  const filteredOrders = useMemo(() => {
    const arr = (data ?? []) as OrderResponseDTO[];
    return onlyCancelable ? arr.filter((o) => canCancelOrder(o)) : arr;
  }, [data, onlyCancelable]);

  // Nhóm theo cửa hàng
  const groupedByShopEntries = useMemo(() => {
    const map = new Map<string, OrderResponseDTO[]>();
    filteredOrders.forEach((o) => {
      const key = o.shopName || "Khác";
      map.set(key, [...(map.get(key) || []), o]);
    });
    return Array.from(map.entries());
  }, [filteredOrders]);

  // Đếm nhanh theo trạng thái
  const counts = useMemo(() => {
    const arr = (data ?? []) as OrderResponseDTO[];
    return {
      all: arr.length,
      confirmed: arr.filter((o) => o.status === "Confirmed").length,
      shipped: arr.filter((o) => o.status === "Shipped").length,
      delivered: arr.filter((o) => o.status === "Delivered").length,
      canceled: arr.filter((o) => o.status === "Canceled").length,
    };
  }, [data]);

  // Mở dialog hủy đơn
  const handleOpenCancelDialog = (order: OrderResponseDTO) => {
    setOrderToCancel(order);
    setCancelDialogOpen(true);
    setCancelReason("");
    setConfirmStepChecked(false);
  };

  // Thực hiện hủy đơn
  const handleCancelOrder = () => {
    if (!orderToCancel) return;
    if (!confirmStepChecked) {
      toast({
        title: "Vui lòng xác nhận",
        description: "Bạn cần tích xác nhận trước khi hủy.",
        variant: "destructive",
      });
      return;
    }
    cancelOrderMutation.mutate(orderToCancel.orderId, {
      onSuccess: () => {
        toast({
          title: "Đã hủy đơn hàng",
          description: `Đơn ${orderToCancel.orderId} đã được hủy.`,
        });
        setCancelDialogOpen(false);
        setOrderToCancel(null);
        setCancelReason("");
        setConfirmStepChecked(false);
      },
      onError: (error: any) => {
        const errorMessage =
          error?.message ||
          error?.response?.data?.message ||
          error?.response?.data?.Message ||
          "Không thể hủy đơn hàng";
        toast({ title: "Lỗi", description: errorMessage, variant: "destructive" });
      },
    });
  };

  // "Mua lại": thêm lại toàn bộ sản phẩm của đơn vào giỏ
  const handleReorder = async (order: OrderResponseDTO) => {
    if (!order?.items || order.items.length === 0) return;
    setReorderLoadingId(order.orderId);
    try {
      for (const item of order.items) {
        // Thêm từng sản phẩm với số lượng đã mua
        await addItem(item.productId, Math.max(1, item.quantity));
      }
      toast({
        title: "Đã thêm vào giỏ",
        description: `Đã thêm lại ${order.items.length} sản phẩm từ đơn ${order.orderId}.`,
      });
      // Điều hướng sang trang Giỏ hàng sau khi thêm xong
      navigate("/cart");
    } catch (e: any) {
      const msg = e?.message || e?.response?.data?.message || "Không thể mua lại";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    } finally {
      setReorderLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Đơn hàng của tôi
        </h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi trạng thái đơn hàng và cập nhật thông tin thanh toán.
        </p>
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
            {/* Tìm kiếm */}
            <div className="flex flex-col gap-2">
              <FormLabel>Tìm kiếm</FormLabel>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Mã đơn hoặc tên shop"
                />
              </div>
            </div>

            {/* Khoảng thời gian */}
            <div className="flex flex-col gap-2">
              <FormLabel>Khoảng thời gian</FormLabel>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  const now = new Date();
                  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  setStartDate(start.toISOString());
                  setEndDate(now.toISOString());
                }}>7 ngày gần đây</Button>
                <Button type="button" variant="outline" onClick={() => {
                  const now = new Date();
                  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                  setStartDate(start.toISOString());
                  setEndDate(now.toISOString());
                }}>30 ngày</Button>
                <Input type="date" value={startDate ? startDate.slice(0,10) : ""} onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value).toISOString() : undefined)} />
                <Input type="date" value={endDate ? endDate.slice(0,10) : ""} onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value).toISOString() : undefined)} />
              </div>
            </div>

            {/* Sắp xếp */}
            <div className="flex flex-col gap-2">
              <FormLabel>Sắp xếp</FormLabel>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as "createdAt" | "totalAmount" | "status")}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Ngày tạo</SelectItem>
                    <SelectItem value="totalAmount">Tổng tiền</SelectItem>
                    <SelectItem value="status">Trạng thái</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Tăng dần</SelectItem>
                    <SelectItem value="desc">Giảm dần</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(DEFAULT_FILTER);
                  setKeyword("");
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setSortBy("createdAt");
                  setSortOrder("desc");
                  setOnlyCancelable(false);
                  setGroupByShop(true);
                }}
              >
                Đặt lại
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => refetch()}
                disabled={loadingState}
              >
                Làm mới
              </Button>
            </div>
          </form>
        </Form>

        {/* Bộ lọc nhanh dạng chip */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => form.setValue("status", "all")}>Tất cả ({counts.all})</Button>
          <Button variant="outline" size="sm" onClick={() => form.setValue("status", "Confirmed")}>Đang xử lý ({counts.confirmed})</Button>
          <Button variant="outline" size="sm" onClick={() => form.setValue("status", "Shipped")}>Đang giao ({counts.shipped})</Button>
          <Button variant="outline" size="sm" onClick={() => form.setValue("status", "Delivered")}>Đã giao ({counts.delivered})</Button>
          <Button variant="outline" size="sm" onClick={() => form.setValue("status", "Canceled")}>Đã hủy ({counts.canceled})</Button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyCancelable} onChange={(e) => setOnlyCancelable(e.target.checked)} />
            Chỉ đơn có thể hủy
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={groupByShop} onChange={(e) => setGroupByShop(e.target.checked)} />
            Nhóm theo cửa hàng
          </label>
        </div>
      </div>

      {groupByShop ? (
        filteredOrders.length === 0 ? (
          <OrdersTable
            orders={filteredOrders}
            isLoading={loadingState}
            emptyTitle="Bạn chưa có đơn hàng nào"
            emptyDescription="Tiếp tục mua sắm và quay lại đây để theo dõi trạng thái đơn hàng."
            emptyCtaHref="/products"
            emptyCtaLabel="Khám phá sản phẩm"
            showShopColumn
            renderReviewColumn={(order) => <OrderReviewStatusCell order={order} />}
            renderActionsColumn={(order) => (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/orders/${order.orderId}`);
                  }}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Chi tiết
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReorder(order);
                  }}
                  disabled={reorderLoadingId === order.orderId}
                  className="flex items-center gap-1"
                >
                  {reorderLoadingId === order.orderId ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-3 w-3" />
                  )}
                  Mua lại
                </Button>
                {order.status === "Shipped" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeliveryMutation.mutate(order.orderId);
                    }}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Đã nhận hàng
                  </Button>
                )}
                {canCancelOrder(order) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCancelDialog(order);
                    }}
                    disabled={cancelOrderMutation.isPending}
                    className="flex items-center gap-1"
                  >
                    {cancelOrderMutation.isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Đang hủy...
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        Hủy đơn
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          />
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {groupedByShopEntries.map(([shop, list]) => (
              <AccordionItem key={shop} value={shop} className="border rounded-md">
                <AccordionTrigger className="px-4">
                  {shop}
                  <span className="ml-2 text-xs text-muted-foreground">({list.length} đơn)</span>
                </AccordionTrigger>
                <AccordionContent>
                  <OrdersTable
                    orders={list}
                    isLoading={loadingState}
                    emptyTitle="Bạn chưa có đơn hàng nào"
                    emptyDescription="Tiếp tục mua sắm và quay lại đây để theo dõi trạng thái đơn hàng."
                    emptyCtaHref="/products"
                    emptyCtaLabel="Khám phá sản phẩm"
                    renderReviewColumn={(order) => <OrderReviewStatusCell order={order} />}
                    renderActionsColumn={(order) => (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/orders/${order.orderId}`);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Chi tiết
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorder(order);
                          }}
                          disabled={reorderLoadingId === order.orderId}
                          className="flex items-center gap-1"
                        >
                          {reorderLoadingId === order.orderId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ShoppingCart className="h-3 w-3" />
                          )}
                          Mua lại
                        </Button>
                        {order.status === "Shipped" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeliveryMutation.mutate(order.orderId);
                            }}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Đã nhận hàng
                          </Button>
                        )}
                        {canCancelOrder(order) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCancelDialog(order);
                            }}
                            disabled={cancelOrderMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            {cancelOrderMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Đang hủy...
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3" />
                                Hủy đơn
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )
      ) : (
        <OrdersTable
          orders={filteredOrders}
          isLoading={loadingState}
          emptyTitle="Bạn chưa có đơn hàng nào"
          emptyDescription="Tiếp tục mua sắm và quay lại đây để theo dõi trạng thái đơn hàng."
          emptyCtaHref="/products"
          emptyCtaLabel="Khám phá sản phẩm"
          showShopColumn
          renderReviewColumn={(order) => <OrderReviewStatusCell order={order} />}
          renderActionsColumn={(order) => (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/orders/${order.orderId}`);
                }}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                Chi tiết
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder(order);
                }}
                disabled={reorderLoadingId === order.orderId}
                className="flex items-center gap-1"
              >
                {reorderLoadingId === order.orderId ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ShoppingCart className="h-3 w-3" />
                )}
                Mua lại
              </Button>
              {order.status === "Shipped" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDeliveryMutation.mutate(order.orderId);
                  }}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Đã nhận hàng
                </Button>
              )}
              {canCancelOrder(order) && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCancelDialog(order);
                  }}
                  disabled={cancelOrderMutation.isPending}
                  className="flex items-center gap-1"
                >
                  {cancelOrderMutation.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Đang hủy...
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3" />
                      Hủy đơn
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        />
      )}

      {/* Dialog xác nhận hủy đơn */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng{" "}
              <strong className="text-primary">{orderToCancel?.orderId}</strong>
              ?
              <br />
              <br />
              Đơn hàng từ cửa hàng <strong>
                {orderToCancel?.shopName}
              </strong>{" "}
              với tổng giá trị{" "}
              <strong className="text-primary">
                {orderToCancel?.totalAmount?.toLocaleString("vi-VN")}₫
              </strong>{" "}
              sẽ bị hủy.
              <br />
              <br />
              <span className="text-destructive font-medium">
                Hành động này không thể hoàn tác.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCancelDialogOpen(false);
                setOrderToCancel(null);
              }}
            >
              Không, giữ lại đơn hàng
            </AlertDialogCancel>
            <div className="space-y-3 py-2">
              <div>
              <FormLabel htmlFor="cancel-reason">Lý do hủy</FormLabel>
                <Textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng nhập lý do hủy để cửa hàng có thể cải thiện"
                  className="mt-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="confirm-step"
                  type="checkbox"
                  checked={confirmStepChecked}
                  onChange={(e) => setConfirmStepChecked(e.target.checked)}
                />
              <FormLabel htmlFor="confirm-step">
                Tôi xác nhận đã kiểm tra tình trạng đơn và muốn hủy
              </FormLabel>
              </div>
            </div>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận hủy đơn"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Hiển thị trạng thái đánh giá của đơn hàng
const OrderReviewStatusCell = ({ order }: { order: OrderResponseDTO }) => {
  const navigate = useNavigate();
  const eligible =
    order.status === "Delivered" &&
    ((order.isPaid ?? false) || order.paymentStatus === "Paid");

  const firstProductId = order.items?.[0]?.productId;

  const { data: myReview, isLoading } = useQuery({
    queryKey: ["my-review", firstProductId],
    queryFn: () =>
      firstProductId
        ? reviewsService.getMyReview(firstProductId)
        : Promise.resolve(null),
    enabled: eligible && !!firstProductId,
    staleTime: 2 * 60 * 1000,
  });

  if (!eligible) {
    return (
      <span className="text-sm text-muted-foreground">
        Chỉ đánh giá khi đơn đã giao & đã thanh toán
      </span>
    );
  }

  if (isLoading) {
    return (
      <span className="text-sm text-muted-foreground">Đang kiểm tra...</span>
    );
  }

  const reviewed = !!myReview?.review;
  const productId = firstProductId;

  return (
    <div className="flex items-center gap-2">
      {reviewed ? (
        <Badge variant="default">Đã đánh giá</Badge>
      ) : (
        <Badge variant="outline">Chưa đánh giá</Badge>
      )}
      {!reviewed ? (
        <Button
          size="sm"
          variant="secondary"
          className="h-7"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${order.orderId}?openReview=1`);
          }}
        >
          Viết đánh giá
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-7"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${order.orderId}`);
          }}
        >
          Xem
        </Button>
      )}
    </div>
  );
};

export default MyOrdersPage;
