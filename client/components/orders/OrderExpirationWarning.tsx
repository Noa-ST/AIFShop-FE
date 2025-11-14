import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { OrderResponseDTO, PaymentMethod } from "@/services/types";

interface Props {
  order: OrderResponseDTO;
  createdAt: Date;
}

const EXPIRATION_TIME_MS = 30 * 60 * 1000; // 30 minutes

export function OrderExpirationWarning({ order, createdAt }: Props) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Only show for online payment methods
  const isOnlinePayment = order.paymentMethod === "Wallet" || order.paymentMethod === "Bank";
  const isPending = order.status === "Pending" && order.paymentStatus === "Pending";

  useEffect(() => {
    if (!isOnlinePayment || !isPending) return;

    const elapsed = Date.now() - createdAt.getTime();
    const remaining = EXPIRATION_TIME_MS - elapsed;

    if (remaining <= 0) {
      setTimeRemaining(0);
      return;
    }

    setTimeRemaining(remaining);

    const interval = setInterval(() => {
      const newElapsed = Date.now() - createdAt.getTime();
      const newRemaining = EXPIRATION_TIME_MS - newElapsed;
      
      if (newRemaining <= 0) {
        setTimeRemaining(0);
        clearInterval(interval);
      } else {
        setTimeRemaining(newRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnlinePayment, isPending, createdAt]);

  if (!isOnlinePayment || !isPending || timeRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        ⚠️ Đơn hàng sẽ tự động hủy sau{" "}
        <strong>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </strong>{" "}
        nếu chưa thanh toán
      </AlertDescription>
    </Alert>
  );
}

