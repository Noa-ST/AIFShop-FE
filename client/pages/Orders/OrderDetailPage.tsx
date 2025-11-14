import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  OrderStatusBadge,
  PaymentMethodBadge,
  PaymentStatusBadge,
} from "@/components/orders/StatusBadges";
import { formatCurrencyVND } from "@/lib/utils";
import {
  getOrderById,
  updateTrackingNumber,
  updateOrderAddress,
  confirmDelivery,
} from "@/services/orders";
import { getPaymentByOrder } from "@/services/payments";
import { addressService, type GetAddressDto } from "@/services/addressService";
import type {
  OrderStatus,
  PaymentDto,
  PaymentMethod,
  OrderResponseDTO,
  PaymentStatus,
} from "@/services/types";
import { useOrderMutation } from "@/hooks/use-orders";
import { usePaymentMutation } from "@/hooks/use-payments";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "@/constants/order-status";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { OrderExpirationWarning } from "@/components/orders/OrderExpirationWarning";
import { PaymentLinkTimer } from "@/components/payments/PaymentLinkTimer";
import {
  MoveLeft,
  ClipboardList,
  Truck,
  CheckCircle,
  FileClock,
  MapPin,
  Edit,
  Loader2,
  Package,
  CreditCard,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { productService } from "@/services/productService";
import { getProductImageUrl } from "@/utils/imageUrl";
import reviewsService, { ReviewStatus } from "@/services/reviews";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Star } from "lucide-react";

type PaymentFormValues = {
  method: PaymentMethod;
};

const transitionMap: Record<OrderStatus, OrderStatus[]> = {
  Pending: ["Confirmed", "Canceled"],
  Confirmed: ["Shipped", "Canceled"],
  Shipped: ["Delivered", "Canceled"],
  Delivered: [],
  Canceled: [],
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  try {
    const date = new Date(value);
    // ✅ Check for invalid dates (null, undefined, or DateTime.MinValue from C#)
    if (isNaN(date.getTime()) || date.getFullYear() < 1900) {
      return "--";
    }
    return format(date, "dd/MM/yyyy HH:mm");
  } catch {
    return "--";
  }
};

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const paymentForm = useForm<PaymentFormValues>({
    defaultValues: { method: "COD" },
  });
  const statusForm = useForm<{ status: OrderStatus | "" }>({
    defaultValues: { status: "" },
  });
  const trackingForm = useForm<{ trackingNumber: string }>({
    defaultValues: { trackingNumber: "" },
  });

  const [isStatusDialogOpen, setStatusDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isTrackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [isAddressDialogOpen, setAddressDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [justConfirmedPayment, setJustConfirmedPayment] = useState(false);

  const orderQuery = useQuery<OrderResponseDTO>({
    queryKey: ["orders", "detail", id],
    queryFn: () => getOrderById(id as string),
    enabled: Boolean(id),
  });

  const paymentQuery = useQuery<PaymentDto | null>({
    queryKey: ["payments", "order", id],
    queryFn: () => getPaymentByOrder(id as string),
    enabled: Boolean(id) && !isProcessingPayment, // ✅ Disable khi đang process payment
    retry: false,
    // ✅ Không throw error nếu 404 (bình thường cho COD)
    throwOnError: false,
    // ✅ Tắt refetch khi đang process payment (sẽ tự động bị vô hiệu hóa vì enabled = false)
    refetchOnWindowFocus: false, // Tắt để tránh refetch không mong muốn
    refetchOnMount: false, // Tắt để tránh refetch không mong muốn
    refetchOnReconnect: false, // Tắt để tránh refetch không mong muốn
  });

  const { updateStatusMutation, cancelOrderMutation } = useOrderMutation();
  const { processPaymentMutation, retryPaymentMutation } = usePaymentMutation();

  const order = orderQuery.data;
  const payment = paymentQuery.data;
  const isPaid = (order?.isPaid ?? order?.paymentStatus === "Paid") || false;

  // Check if user is seller/admin (can update status and tracking)
  // ✅ Define these BEFORE useQuery hooks to avoid initialization errors
  const canManageOrder = user?.role === "Seller" || user?.role === "Admin";
  const isCustomer = user?.role === "Customer";
  const orderCreatedAt = order ? new Date(order.createdAt) : new Date();

  // Fetch addresses for address change (only fetch if dialog is open and user is customer)
  const { data: addressesResponse } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const response = await addressService.getList();
      if (response.Succeeded && response.Data) {
        return response.Data;
      }
      return [];
    },
    enabled: isAddressDialogOpen && isCustomer, // ✅ Use isCustomer after it's defined above
  });

  const addresses = addressesResponse || [];

  const availableStatuses = useMemo(() => {
    if (!order) return [] as OrderStatus[];
    return transitionMap[order.status] || [];
  }, [order]);

  const handleOpenStatusDialog = () => {
    if (!availableStatuses.length) return;
    statusForm.reset({ status: availableStatuses[0] ?? "" });
    setStatusDialogOpen(true);
  };

  useEffect(() => {
    if (orderQuery.isError) {
      const err = orderQuery.error as any;
      let errorMessage = err.message || "Không thể tải chi tiết đơn hàng";

      // ✅ Cải thiện error message cho connection errors
      if (
        err.code === "ERR_NETWORK" ||
        err.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        errorMessage =
          "Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối mạng hoặc đảm bảo backend đang chạy.";
      } else if (err.response?.status === 404) {
        errorMessage =
          "Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      toast({
        title: "Không thể tải đơn hàng",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [orderQuery.isError, orderQuery.error, toast]);

  useEffect(() => {
    // ✅ Chỉ hiển thị error nếu không phải 404 (404 là bình thường cho COD orders)
    // ✅ VÀ không đang process payment (tránh hiển thị error khi đang redirect)
    if (paymentQuery.isError && paymentQuery.error && !isProcessingPayment) {
      const err = paymentQuery.error as any;
      // Bỏ qua 404 errors (bình thường cho COD orders)
      if (err?.response?.status === 404) {
        return;
      }

      // ✅ Fix: Không hiển thị error ngay nếu vừa confirm payment thành công (tránh race condition)
      // Nếu payment vừa được tạo, có thể cần thời gian để backend commit transaction
      if (justConfirmedPayment) {
        // Bỏ qua error toast trong khoảng thời gian ngắn sau khi confirm payment
        // Payment query sẽ được refetch sau 500ms và có thể thành công
        return;
      }

      // ✅ Cải thiện error message cho các trường hợp khác
      let errorMessage = err.message || "Không thể tải thông tin thanh toán";
      if (err?.response?.status === 403) {
        errorMessage = "Bạn không có quyền xem thông tin thanh toán này.";
      } else if (err?.response?.status === 500) {
        errorMessage =
          "Lỗi server khi tải thông tin thanh toán. Vui lòng thử lại sau.";
      }
      toast({
        title: "Không có thông tin thanh toán",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [
    paymentQuery.isError,
    paymentQuery.error,
    toast,
    justConfirmedPayment,
    isProcessingPayment,
  ]); // ✅ Thêm isProcessingPayment vào dependencies

  useEffect(() => {
    if (updateStatusMutation.isError) {
      const err = updateStatusMutation.error as Error;
      toast({
        title: "Không thể cập nhật",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [updateStatusMutation.isError, updateStatusMutation.error, toast]);

  useEffect(() => {
    if (updateStatusMutation.isSuccess) {
      toast({
        title: "Cập nhật thành công",
        description: "Trạng thái đơn hàng đã được cập nhật.",
      });
      setStatusDialogOpen(false);
      // ✅ Invalidate order and payment queries để cập nhật UI (đặc biệt khi chuyển sang Delivered)
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["payments", "order", id] });
      // ✅ Invalidate order list queries để cập nhật danh sách
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  }, [updateStatusMutation.isSuccess, toast, queryClient, id]);

  useEffect(() => {
    if (processPaymentMutation.isError) {
      const err = processPaymentMutation.error as Error;
      toast({
        title: "Thanh toán thất bại",
        description:
          err.message || "Không thể xử lý thanh toán. Vui lòng thử lại.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  }, [processPaymentMutation.isError, processPaymentMutation.error, toast]);

  useEffect(() => {
    if (processPaymentMutation.isSuccess) {
      const paymentData = processPaymentMutation.data;

      // ✅ Bank/Wallet: Redirect đã được xử lý trong handleProcessPayment
      // Chỉ xử lý COD/Cash ở đây
      if (paymentData?.data?.checkoutUrl) {
        // Nếu có checkoutUrl nhưng chưa redirect (có thể là lỗi), redirect bây giờ
        const checkoutUrl = paymentData.data.checkoutUrl;
        if (typeof checkoutUrl === "string" && checkoutUrl.startsWith("http")) {
          window.location.href = checkoutUrl;
          return; // Redirect, không cần xử lý tiếp
        }
      }

      // ✅ COD/Cash: Hiển thị toast thành công và invalidate queries
      toast({
        title: "Thanh toán thành công",
        description: "Đơn hàng đã được đánh dấu là đã thanh toán.",
      });
      setPaymentDialogOpen(false);

      // ✅ Fix: Đánh dấu vừa confirm payment để tránh hiển thị error toast ngay
      setJustConfirmedPayment(true);

      queryClient.invalidateQueries({ queryKey: ["orders", "detail", id] });

      // ✅ Fix: Thêm delay nhỏ trước khi refetch payment query để tránh race condition
      // Backend transaction cần thời gian để commit, nếu refetch ngay có thể chưa tìm thấy payment
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["payments", "order", id] });
        // Reset flag sau khi refetch
        setTimeout(() => {
          setJustConfirmedPayment(false);
        }, 1500); // Reset sau 1.5 giây
      }, 500); // Delay 500ms để đảm bảo transaction đã commit

      setIsProcessingPayment(false);
    }
  }, [
    processPaymentMutation.isSuccess,
    processPaymentMutation.data,
    toast,
    id,
    queryClient,
  ]);

  // Handle tracking number update
  const handleUpdateTracking = async (values: { trackingNumber: string }) => {
    if (!order || !values.trackingNumber.trim()) return;

    try {
      await updateTrackingNumber(order.orderId, values.trackingNumber.trim());
      toast({
        title: "Thành công",
        description: "Đã cập nhật mã vận chuyển.",
      });
      setTrackingDialogOpen(false);
      trackingForm.reset();
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", id] });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật mã vận chuyển.",
        variant: "destructive",
      });
    }
  };

  // Handle customer confirm delivery
  const handleConfirmDelivery = async () => {
    if (!order) return;

    if (!confirm("Bạn đã nhận được hàng? Xác nhận để hoàn tất đơn hàng.")) {
      return;
    }

    try {
      // ✅ Sử dụng endpoint riêng cho Customer confirm delivery
      await confirmDelivery(order.orderId);
      toast({
        title: "Thành công",
        description: "Đã xác nhận nhận hàng.",
      });
      // ✅ Invalidate queries để cập nhật UI
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["payments", "order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (error: any) {
      // ✅ Kiểm tra lỗi và thông báo rõ ràng
      let errorMessage = error.message || "Không thể xác nhận nhận hàng.";
      if (error.response?.status === 403) {
        errorMessage =
          "Bạn không có quyền xác nhận nhận hàng cho đơn hàng này. Chỉ khách hàng sở hữu đơn hàng mới có thể xác nhận.";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message ||
          "Không thể xác nhận nhận hàng. Vui lòng kiểm tra lại trạng thái đơn hàng.";
      } else if (error.response?.status === 404) {
        errorMessage = "Không tìm thấy đơn hàng.";
      }
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle payment for COD/Cash/Bank/Wallet
  const handleProcessPayment = async (method: PaymentMethod) => {
    if (!order) return;

    setIsProcessingPayment(true);

    // ✅ Disable paymentQuery refetch khi đang process payment
    queryClient.cancelQueries({ queryKey: ["payments", "order", id] });

    try {
      const response = await processPaymentMutation.mutateAsync({
        orderId: order.orderId,
        method,
      });

      // ✅ Nếu là Bank/Wallet và có checkoutUrl, redirect đến PayOS
      if (
        (method === "Bank" || method === "Wallet") &&
        response?.data?.checkoutUrl
      ) {
        let checkoutUrl: string | null = null;
        const url = response.data.checkoutUrl;

        // Kiểm tra type của checkoutUrl
        if (
          typeof url === "string" &&
          (url.startsWith("http") || url.startsWith("https"))
        ) {
          checkoutUrl = url;
        } else if (typeof url === "number" && response.data.paymentLinkId) {
          // Nếu là number (timestamp), construct URL từ PayOS
          checkoutUrl = `https://pay.payos.vn/web/${response.data.paymentLinkId}`;
        }

        if (checkoutUrl) {
          // ✅ Redirect ngay, không cần đợi refetch paymentQuery
          window.location.href = checkoutUrl;
          return; // Không cần hiển thị toast vì sẽ redirect
        }
      }

      // ✅ COD/Cash: Chỉ hiển thị toast thành công (không redirect)
      // Toast sẽ được hiển thị trong useEffect khi processPaymentMutation.isSuccess
    } catch (error: any) {
      setIsProcessingPayment(false);
      // ✅ Error đã được xử lý trong useEffect ở dòng 274-285
      // Thêm log để debug nếu cần
      console.error("Payment process error:", {
        orderId: order.orderId,
        method,
        error: error.message,
        status: error.response?.status,
      });
    }
  };

  // Handle retry payment
  const handleRetryPayment = async () => {
    if (!payment?.id) return;

    try {
      const response = await retryPaymentMutation.mutateAsync(payment.id);
      if (response?.data?.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thử lại thanh toán.",
        variant: "destructive",
      });
    }
  };

  // Handle address update
  const handleUpdateAddress = async () => {
    if (!order || !selectedAddressId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn địa chỉ giao hàng",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingAddress(true);
    try {
      await updateOrderAddress(order.orderId, selectedAddressId);
      toast({
        title: "Thành công",
        description: "Đã cập nhật địa chỉ giao hàng",
      });
      setAddressDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", id] });
    } catch (error: any) {
      // ✅ Improve error message for 404 (backend endpoint not available)
      let errorMessage = error.message || "Không thể cập nhật địa chỉ";
      if (error.response?.status === 404) {
        errorMessage =
          "Tính năng đổi địa chỉ đơn hàng chưa được hỗ trợ. Vui lòng liên hệ bộ phận hỗ trợ để được hỗ trợ.";
      }
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  // Open address dialog and set current address if available
  const handleOpenAddressDialog = () => {
    // Assume order has addressId field (may need to check actual API response)
    const currentAddressId = (order as any)?.addressId;
    if (currentAddressId) {
      setSelectedAddressId(currentAddressId);
    } else if (addresses.length > 0) {
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      setSelectedAddressId(defaultAddress?.id || addresses[0].id);
    }
    setAddressDialogOpen(true);
  };

  if (orderQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">
            Không tìm thấy thông tin đơn hàng
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Đơn hàng có thể đã bị xóa hoặc bạn không có quyền truy cập.
          </p>
          <Button className="mt-6" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Expiration Warning */}
      {order && (
        <OrderExpirationWarning order={order} createdAt={orderCreatedAt} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            className="mb-2 px-0 text-muted-foreground hover:text-primary"
            onClick={() => navigate(-1)}
          >
            <MoveLeft className="mr-2 h-4 w-4" /> Trở về
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Đơn hàng {order.orderId || "--"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo lúc {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canManageOrder && (
            <>
              <Button
                variant="outline"
                onClick={handleOpenStatusDialog}
                disabled={!availableStatuses.length}
              >
                <ClipboardList className="mr-2 h-4 w-4" /> Cập nhật trạng thái
              </Button>
              {order.status === "Confirmed" && (
                <Button
                  variant="outline"
                  onClick={() => setTrackingDialogOpen(true)}
                >
                  <Truck className="mr-2 h-4 w-4" /> Cập nhật mã vận chuyển
                </Button>
              )}
            </>
          )}
          {isCustomer && (
            <Button
              variant="outline"
              onClick={handleOpenAddressDialog}
              disabled={
                order.status === "Shipped" ||
                order.status === "Delivered" ||
                order.status === "Canceled"
              }
            >
              <MapPin className="mr-2 h-4 w-4" /> Đổi địa chỉ
            </Button>
          )}
          {isCustomer &&
            order.status === "Delivered" &&
            (payment?.status || order.paymentStatus) === "Paid" && (
              <Button
                variant="default"
                onClick={() => {
                  const firstProductId = order.items?.[0]?.productId;
                  if (firstProductId) {
                    navigate(`/products/${firstProductId}?tab=reviews`);
                  } else {
                    const el = document.getElementById(
                      "order-products-section",
                    );
                    el?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Đánh giá
              </Button>
            )}
          {isCustomer && order.status === "Shipped" && isPaid && (
            <Button onClick={handleConfirmDelivery}>
              <CheckCircle className="mr-2 h-4 w-4" /> Xác nhận đã nhận hàng
            </Button>
          )}
        </div>
      </div>

      {/* Payment Section */}
      {order && !isPaid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Thanh toán
            </CardTitle>
            <CardDescription>
              {order.paymentMethod === "COD" || order.paymentMethod === "Cash"
                ? "Thanh toán khi nhận hàng"
                : "Thanh toán trực tuyến"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {payment && payment.status === "Pending" && (
              <>
                <PaymentLinkTimer
                  payment={payment}
                  createdAt={orderCreatedAt}
                />
                {payment.orderCode && (
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      Mã đơn hàng PayOS:
                    </p>
                    <p className="text-lg font-semibold">{payment.orderCode}</p>
                  </div>
                )}
                {payment.status === "Pending" &&
                  Date.now() - orderCreatedAt.getTime() > 15 * 60 * 1000 && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRetryPayment}
                        disabled={retryPaymentMutation.isPending}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Tạo lại link thanh toán
                      </Button>
                    </div>
                  )}
              </>
            )}
            {/* Chỉ hiển thị nút xác nhận thanh toán khi đơn hàng đã được xác nhận và chưa thanh toán */}
            {/* ✅ COD/Cash: Chỉ cho phép thanh toán khi Seller đã cập nhật đơn hàng sang "Đã giao" (Delivered) */}
            {isCustomer &&
              (order.paymentMethod === "COD" ||
                order.paymentMethod === "Cash") &&
              order.status === "Delivered" && // ✅ Chỉ cho phép khi Seller đã cập nhật sang "Đã giao"
              (order.paymentStatus === "Pending" ||
                payment?.status === "Pending") && (
                <Button
                  onClick={() =>
                    handleProcessPayment(order.paymentMethod as PaymentMethod)
                  }
                  disabled={
                    isProcessingPayment || processPaymentMutation.isPending
                  }
                  className="w-full"
                >
                  {isProcessingPayment || processPaymentMutation.isPending ? (
                    <>Đang xử lý...</>
                  ) : (
                    <>
                      Xác nhận đã thanh toán{" "}
                      {order.paymentMethod === "COD" ? "COD" : "tiền mặt"}
                    </>
                  )}
                </Button>
              )}
            {/* ✅ Bank/Wallet: Hiển thị button khi order đã Confirmed và payment status là Pending */}
            {isCustomer &&
              (order.paymentMethod === "Bank" ||
                order.paymentMethod === "Wallet") &&
              order.status === "Confirmed" && // ✅ Chỉ cho phép khi Seller đã xác nhận đơn hàng
              order.paymentStatus === "Pending" && // ✅ Payment chưa được thanh toán
              (!payment || payment.status === "Pending") && ( // ✅ Chưa có payment hoặc payment đang pending
                <Button
                  onClick={() => {
                    if (payment?.orderCode) {
                      // Retry payment nếu đã có payment record
                      handleRetryPayment();
                    } else {
                      // Process payment (tạo payment link mới)
                      handleProcessPayment(
                        order.paymentMethod as PaymentMethod,
                      );
                    }
                  }}
                  disabled={
                    isProcessingPayment ||
                    processPaymentMutation.isPending ||
                    retryPaymentMutation.isPending
                  }
                  className="w-full"
                >
                  {isProcessingPayment ||
                  processPaymentMutation.isPending ||
                  retryPaymentMutation.isPending ? (
                    <>Đang xử lý...</>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Thanh toán{" "}
                      {order.paymentMethod === "Bank"
                        ? "chuyển khoản"
                        : "ví điện tử"}
                    </>
                  )}
                </Button>
              )}
          </CardContent>
        </Card>
      )}

      {/* Order Information - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin đơn hàng</CardTitle>
          <CardDescription>
            Tổng quan về khách hàng, cửa hàng và trạng thái xử lý.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Khách hàng</p>
            <p className="font-medium">{order.customerName || "--"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Cửa hàng</p>
            <p className="font-medium">{order.shopName || "--"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Tổng tiền</p>
            <p className="font-medium">
              {formatCurrencyVND(order.totalAmount)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Trạng thái</p>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Thanh toán</p>
            <PaymentStatusBadge
              status={payment?.status || order.paymentStatus}
              isPaid={isPaid}
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Phương thức</p>
            <PaymentMethodBadge
              method={payment?.method || order.paymentMethod}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
            <p className="text-sm flex items-center gap-2">
              <FileClock className="h-3 w-3 text-muted-foreground" />
              {formatDate(order.updatedAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Products Section - With Images and Links */}
      <Card id="order-products-section">
        <CardHeader>
          <CardTitle>Sản phẩm</CardTitle>
          <CardDescription>Danh sách sản phẩm trong đơn hàng.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {order?.items && order.items.length > 0 ? (
            order.items.map((item) => (
              <ProductItemWithImage
                key={item.productId}
                item={item}
                quantity={item.quantity}
                unitPrice={item.unitPrice}
                lineTotal={item.lineTotal}
                orderStatus={order.status}
                paymentStatus={payment?.status || order.paymentStatus}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Chưa có sản phẩm trong đơn hàng
            </p>
          )}
        </CardContent>
      </Card>

      {/* Address Change Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi địa chỉ giao hàng</DialogTitle>
            <DialogDescription>
              Chọn địa chỉ giao hàng mới cho đơn hàng này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={selectedAddressId}
              onValueChange={setSelectedAddressId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn địa chỉ giao hàng" />
              </SelectTrigger>
              <SelectContent>
                {addresses.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {address.recipientName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {address.phoneNumber} -{" "}
                        {addressService.formatFullAddress(address)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/addresses")}
            >
              <MapPin className="mr-2 h-4 w-4" /> Quản lý địa chỉ
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddressDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateAddress}
              disabled={isUpdatingAddress || !selectedAddressId}
            >
              {isUpdatingAddress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
            <DialogDescription>
              Chọn trạng thái tiếp theo cho đơn hàng {order.orderId || "--"}.
            </DialogDescription>
          </DialogHeader>
          <Form {...statusForm}>
            <form
              className="space-y-4"
              onSubmit={statusForm.handleSubmit((values) => {
                const nextStatus = values.status;
                if (!nextStatus) return;
                updateStatusMutation.mutate({
                  orderId: order.orderId,
                  status: nextStatus as OrderStatus,
                });
              })}
            >
              <FormField
                control={statusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái mới</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        disabled={
                          !availableStatuses.length ||
                          updateStatusMutation.isPending
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStatuses.map((statusOption) => {
                            const meta = ORDER_STATUS_OPTIONS.find(
                              (item) => item.value === statusOption,
                            );
                            return (
                              <SelectItem
                                key={statusOption}
                                value={statusOption}
                              >
                                {meta?.label || statusOption}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={updateStatusMutation.isPending}>
                  Xác nhận
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xử lý thanh toán</DialogTitle>
            <DialogDescription>
              Chọn phương thức thanh toán được khách hàng xác nhận.
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form
              className="space-y-4"
              onSubmit={paymentForm.handleSubmit((values) => {
                processPaymentMutation.mutate({
                  orderId: order.orderId,
                  method: values.method,
                });
              })}
            >
              <FormField
                control={paymentForm.control}
                name="method"
                rules={{ required: "Vui lòng chọn phương thức" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phương thức thanh toán</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={processPaymentMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phương thức" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHOD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={processPaymentMutation.isPending}
                >
                  Xác nhận
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTrackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật mã vận chuyển</DialogTitle>
            <DialogDescription>
              Nhập mã vận chuyển từ đơn vị vận chuyển cho đơn hàng{" "}
              {order.orderId || "--"}.
            </DialogDescription>
          </DialogHeader>
          <Form {...trackingForm}>
            <form
              className="space-y-4"
              onSubmit={trackingForm.handleSubmit(handleUpdateTracking)}
            >
              <FormField
                control={trackingForm.control}
                name="trackingNumber"
                rules={{ required: "Vui lòng nhập mã vận chuyển" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã vận chuyển</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: VN123456789" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTrackingDialogOpen(false);
                    trackingForm.reset();
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit">Cập nhật</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Component to render product item with image
const ProductItemWithImage = ({
  item,
  quantity,
  unitPrice,
  lineTotal,
  orderStatus,
  paymentStatus,
}: {
  item: { productId: string; productName: string };
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [aspects, setAspects] = useState<string[]>([]);

  // Fetch product detail to get image
  const { data: product } = useQuery({
    queryKey: ["product", item.productId],
    queryFn: () => productService.getDetailById(item.productId),
    enabled: !!item.productId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  useEffect(() => {
    const url = getProductImageUrl(product);
    setProductImage(url);
  }, [product]);

  const {
    data: myReview,
    refetch: refetchMyReview,
    isLoading: loadingMyReview,
  } = useQuery({
    queryKey: ["order-product-my-review", item.productId, user?.id],
    queryFn: () => reviewsService.getMyReview(String(item.productId)),
    enabled: !!item.productId && !!user,
  });

  const hasReviewed = Boolean(myReview?.hasReviewed);

  // Convert paymentStatus number to string if needed (backend returns enum number)
  const normalizedPaymentStatus =
    typeof paymentStatus === "number"
      ? ["Pending", "Paid", "Failed"][paymentStatus] || "Pending"
      : paymentStatus;

  const canReview =
    user?.role === "Customer" &&
    orderStatus === "Delivered" &&
    normalizedPaymentStatus === "Paid";

  // Logging để kiểm tra điều kiện review
  // eslint-disable-next-line no-console
  console.log("[Review Button] canReview check:", {
    userRole: user?.role,
    orderStatus,
    paymentStatusRaw: paymentStatus,
    paymentStatusNormalized: normalizedPaymentStatus,
    canReview,
  });
  const existing = myReview?.review ?? null;
  const reviewStatus: ReviewStatus | null = (myReview?.status ??
    existing?.status ??
    null) as any;
  const rejectionReason =
    myReview?.rejectionReason ?? existing?.rejectionReason ?? null;

  useEffect(() => {
    if (existing) {
      setRating(existing.rating ?? 5);
      setComment(existing.comment ?? "");
    } else {
      setRating(5);
      setComment("");
    }
  }, [existing?.id]);

  const toggleAspect = (label: string, checked: boolean) => {
    setAspects((prev) => {
      const set = new Set(prev);
      if (checked) set.add(label);
      else set.delete(label);
      return Array.from(set);
    });
  };

  const buildComment = () => {
    const prefix = aspects.length ? `[Khía cạnh: ${aspects.join(", ")}] ` : "";
    return `${prefix}${comment.trim()}`.trim();
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const payload = {
        productId: String(item.productId),
        rating,
        comment: buildComment(),
      };
      // eslint-disable-next-line no-console
      console.log("[Review] Sending payload:", payload);

      const resp = await reviewsService.create(payload);
      // eslint-disable-next-line no-console
      console.log("[Review] Response:", resp);

      if (resp?.Succeeded) {
        setShowForm(false);
        toast({ title: "Đánh giá của bạn đang chờ duyệt" });
        await refetchMyReview();
      } else {
        // eslint-disable-next-line no-console
        console.error("[Review] Failed Response:", resp);
        // eslint-disable-next-line no-console
        console.error("[Review] Failed Message:", resp?.Message || "Undefined");
        toast({ title: resp?.Message || "Không thể gửi đánh giá" });
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[Review] Full Error Object:", e);
      // eslint-disable-next-line no-console
      console.error("[Review] Error Details:", {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message,
        axiosData: e?.data,
      });

      const status = e?.response?.status;
      if (status === 401) toast({ title: "Bạn cần đăng nhập để đánh giá" });
      else if (status === 403) {
        const errMsg =
          e?.response?.data?.message || "Bạn chưa đủ điều kiện để đánh giá";
        // eslint-disable-next-line no-console
        console.error("[Review] 403 Forbidden:", errMsg);
        toast({ title: errMsg });
      } else if (status === 400) {
        const errMsg =
          e?.response?.data?.message ||
          e?.data?.message ||
          "Dữ liệu đánh giá không hợp lệ";
        // eslint-disable-next-line no-console
        console.error("[Review] 400 Bad Request:", errMsg);
        toast({
          title: errMsg,
        });
      } else {
        toast({ title: "Đã có lỗi xảy ra, vui lòng thử lại" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!existing) return;
    setSubmitting(true);
    try {
      const resp = await reviewsService.update(existing.id, {
        rating,
        comment: buildComment(),
      });
      if (resp?.Succeeded) {
        setShowForm(false);
        toast({ title: "Cập nhật review thành công, chờ duyệt" });
        await refetchMyReview();
      } else {
        toast({ title: resp?.Message || "Không thể cập nhật đánh giá" });
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) toast({ title: "Bạn cần đăng nhập" });
      else if (status === 400)
        toast({ title: e?.response?.data?.message || "Dữ liệu không hợp lệ" });
      else toast({ title: "Đã có lỗi xảy ra, vui lòng thử lại" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setSubmitting(true);
    try {
      const resp = await reviewsService.remove(existing.id);
      if (resp?.Succeeded) {
        toast({ title: "Đã xóa đánh giá" });
        await refetchMyReview();
      } else {
        toast({ title: resp?.Message || "Không thể xóa đánh giá" });
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) toast({ title: "Bạn cần đăng nhập" });
      else toast({ title: "Đã có lỗi xảy ra, vui lòng thử lại" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex gap-4 rounded-md border p-3 hover:bg-muted/40 transition-colors items-center">
        <Link
          to={`/products/${item.productId}`}
          className="flex gap-4 flex-1 items-center"
        >
          <div className="flex-shrink-0">
            <img
              src={productImage || "/placeholder.svg"}
              alt={item.productName}
              className="w-20 h-20 rounded-md object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium line-clamp-2">{item.productName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Số lượng: {quantity}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="font-semibold">{formatCurrencyVND(lineTotal)}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrencyVND(unitPrice)} x {quantity}
            </p>
          </div>
        </Link>
        <div className="flex-shrink-0">
          <Button
            size="sm"
            variant={canReview ? "default" : "outline"}
            disabled={!canReview}
            onClick={() => setShowForm((s) => !s)}
          >
            {showForm ? "Đóng" : "Đánh giá"}
          </Button>
        </div>
      </div>
      {showForm && (
        <div className="mt-3 w-full rounded-md border p-3">
          <div className="flex items-start justify-between">
            <div className="font-medium">Đánh giá sản phẩm</div>
            {hasReviewed && (
              <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                Đã đánh giá
              </span>
            )}
          </div>
          {loadingMyReview ? (
            <div className="text-sm text-muted-foreground mt-2">
              Đang tải...
            </div>
          ) : hasReviewed && reviewStatus === "Pending" ? (
            <div className="text-sm text-amber-600 mt-2">
              Đánh giá của bạn đang chờ duyệt
            </div>
          ) : hasReviewed && reviewStatus === "Rejected" ? (
            <div className="text-sm text-red-600 mt-2">
              Bị từ chối{rejectionReason ? `: ${rejectionReason}` : ""}. Bạn có
              thể sửa và gửi lại.
            </div>
          ) : null}

          <div className="mt-3 grid gap-3">
            {/* Stars */}
            <div>
              <label className="text-sm text-slate-700">Đánh giá sao</label>
              <div className="mt-1 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    className="p-1"
                    aria-label={`Chọn ${i} sao`}
                  >
                    <Star
                      className={
                        i <= rating
                          ? "w-5 h-5 fill-yellow-400 text-yellow-400"
                          : "w-5 h-5 text-gray-300"
                      }
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs text-muted-foreground">
                  {rating} / 5
                </span>
              </div>
            </div>

            {/* Aspects */}
            <div>
              <label className="text-sm text-slate-700">Khía cạnh</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {[
                  "Chất lượng sản phẩm",
                  "Dịch vụ giao hàng",
                  "Giá cả",
                  "Đóng gói",
                  "Mô tả đúng",
                ].map((label) => (
                  <div key={label} className="flex items-center gap-2">
                    <Checkbox
                      checked={aspects.includes(label)}
                      onCheckedChange={(v) => toggleAspect(label, Boolean(v))}
                      id={`aspect-${item.productId}-${label}`}
                    />
                    <label
                      htmlFor={`aspect-${item.productId}-${label}`}
                      className="text-sm"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm text-slate-700">Nhận xét</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                className="mt-1"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!hasReviewed ? (
                <Button disabled={submitting} onClick={handleCreate}>
                  Gửi đánh giá
                </Button>
              ) : (
                <>
                  <Button disabled={submitting} onClick={handleUpdate}>
                    Cập nhật
                  </Button>
                  <Button
                    variant="outline"
                    disabled={submitting}
                    onClick={handleDelete}
                  >
                    Xóa
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetailPage;
