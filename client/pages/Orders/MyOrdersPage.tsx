import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Filter, Eye, X, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

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

const MyOrdersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<FilterFormValues>({
    defaultValues: DEFAULT_FILTER,
  });

  const status = form.watch("status");

  const selectedStatus = useMemo(
    () => (status && status !== "all" ? (status as OrderStatus) : undefined),
    [status],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useOrderList(
    {
      scope: "customer",
      id: user?.id,
      status: selectedStatus,
    },
  );

  const { cancelOrderMutation } = useOrderMutation();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<OrderResponseDTO | null>(
    null,
  );

  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Lỗi",
        description: error.message || fallbackErrorMessage,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  useEffect(() => {
    if (cancelOrderMutation.isSuccess) {
      toast({
        title: "Thành công",
        description: "Đơn hàng đã được hủy thành công",
      });
      setCancelDialogOpen(false);
      setOrderToCancel(null);
    }
  }, [cancelOrderMutation.isSuccess, toast]);

  useEffect(() => {
    if (cancelOrderMutation.isError) {
      toast({
        title: "Lỗi",
        description:
          cancelOrderMutation.error?.message || "Không thể hủy đơn hàng",
        variant: "destructive",
      });
    }
  }, [cancelOrderMutation.isError, cancelOrderMutation.error, toast]);

  const orders = data ?? [];
  const loadingState = isLoading || isFetching;

  // Kiểm tra đơn hàng có thể hủy không
  const canCancelOrder = (order: OrderResponseDTO): boolean => {
    // Chỉ có thể hủy khi: chưa thanh toán và trạng thái là Pending hoặc Confirmed
    const canCancelStatus =
      order.status === "Pending" || order.status === "Confirmed";
    const isNotPaid = order.paymentStatus === "Pending";
    const isNotCancelled = order.status !== "Canceled";
    return canCancelStatus && isNotPaid && isNotCancelled;
  };

  const handleOpenCancelDialog = (order: OrderResponseDTO) => {
    setOrderToCancel(order);
    setCancelDialogOpen(true);
  };

  const handleCancelOrder = () => {
    if (orderToCancel?.orderId) {
      cancelOrderMutation.mutate(orderToCancel.orderId);
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
                disabled={loadingState}
              >
                Làm mới
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <OrdersTable
        orders={orders}
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
    </div>
  );
};

export default MyOrdersPage;
