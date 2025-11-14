import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Thanh toán đã bị hủy</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <XCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <div>
            <h2 className="text-2xl font-semibold mb-2">Bạn đã hủy thanh toán</h2>
            <p className="text-muted-foreground">
              Đơn hàng của bạn vẫn được lưu. Bạn có thể thanh toán lại bất cứ lúc nào.
            </p>
          </div>

          {orderId && (
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Mã đơn hàng:</span>
                <span className="font-medium">{orderId}</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center pt-4">
            {orderId && (
              <Button onClick={() => navigate(`/orders/${orderId}`)}>
                Xem chi tiết đơn hàng
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/orders/my")}>
              Xem đơn hàng của tôi
            </Button>
            <Button onClick={() => navigate("/")}>
              Về trang chủ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


