import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrderById } from "@/services/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orderId = searchParams.get("orderId");
  const rawStatusParam = searchParams.get("status");

  const [paymentStatus, setPaymentStatus] = useState<string>("");

  // Fetch order and payment status
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId!),
    enabled: !!orderId,
  });
  // Polling payment status via shared hook
  const enabled = !!orderId;
  const { paymentStatus: polledStatus, loading: pollingLoading } = usePaymentStatus(orderId || "", enabled);

  useEffect(() => {
    // ✅ Ưu tiên hiển thị theo tham số status từ URL nếu có
    if (rawStatusParam) {
      const up = rawStatusParam.toUpperCase();
      if (up === "PAID") setPaymentStatus("Paid");
      else if (up === "FAILED" || up === "CANCELED") setPaymentStatus("Failed");
      else setPaymentStatus("Pending");
    }
  }, [rawStatusParam]);

  useEffect(() => {
    // ✅ Đồng bộ theo hook polling nếu URL không cung cấp trạng thái cuối cùng
    if (!rawStatusParam && polledStatus) {
      setPaymentStatus(polledStatus);
    }

    // ✅ COD orders có thể không có payment record; suy đoán theo trạng thái đơn
    if (!rawStatusParam && !polledStatus && order) {
      if (order.status === "Confirmed" || order.status === "Pending") {
        setPaymentStatus("Paid");
      }
    }
  }, [polledStatus, rawStatusParam, order]);

  // ✅ Toast + invalidate khi status chuyển sang trạng thái cuối (Paid/Failed)
  useEffect(() => {
    if (paymentStatus === "Paid") {
      toast({
        title: "Thanh toán thành công!",
        description: "Đơn hàng của bạn đã được thanh toán thành công.",
      });
      if (orderId) {
        // ✅ Invalidate các key mà Order Detail và Payment sử dụng
        queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
        queryClient.invalidateQueries({ queryKey: ["payments", "order", orderId] });
        // ✅ Invalidate các key cục bộ của Return (nếu có)
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        queryClient.invalidateQueries({ queryKey: ["payment", orderId] });
      }
    } else if (paymentStatus === "Failed") {
      toast({
        title: "Thanh toán thất bại",
        description: "Vui lòng thử lại hoặc chọn phương thức thanh toán khác.",
        variant: "destructive",
      });
      if (orderId) {
        // ✅ Invalidate các key mà Order Detail và Payment sử dụng
        queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
        queryClient.invalidateQueries({ queryKey: ["payments", "order", orderId] });
        // ✅ Invalidate các key cục bộ của Return (nếu có)
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        queryClient.invalidateQueries({ queryKey: ["payment", orderId] });
      }
    }
  }, [paymentStatus, orderId, queryClient]);

  if (!orderId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Không tìm thấy thông tin đơn hàng</p>
            <Button onClick={() => navigate("/orders/my")} className="mt-4">
              Xem đơn hàng của tôi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderLoading || pollingLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Đang kiểm tra trạng thái thanh toán...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case "Paid":
        return <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />;
      case "Failed":
        return <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />;
      default:
        return <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-4" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case "Paid":
        return {
          title: "Thanh toán thành công!",
          description: "Đơn hàng của bạn đã được thanh toán thành công và đang được xử lý.",
        };
      case "Failed":
        return {
          title: "Thanh toán thất bại",
          description: "Đơn hàng của bạn chưa được thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
        };
      default:
        return {
          title: "Đang xử lý thanh toán...",
          description: "Vui lòng đợi trong giây lát. Chúng tôi đang xác nhận thanh toán của bạn.",
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Kết quả thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {getStatusIcon()}
          <div>
            <h2 className="text-2xl font-semibold mb-2">{statusMessage.title}</h2>
            <p className="text-muted-foreground">{statusMessage.description}</p>
          </div>

          {order && (
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Mã đơn hàng:</span>
                <span className="font-medium">{order.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng tiền:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(order.totalAmount)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/orders/my")}
            >
              Xem đơn hàng của tôi
            </Button>
            {paymentStatus === "Failed" && order && (
              <Button onClick={() => navigate(`/orders/${order.orderId}`)}>
                Thử lại thanh toán
              </Button>
            )}
            <Button onClick={() => navigate("/")}>
              Về trang chủ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


