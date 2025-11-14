import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";
import { PaymentDto } from "@/services/types";

interface Props {
  payment: PaymentDto;
  createdAt: Date;
}

const PAYMENT_LINK_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

export function PaymentLinkTimer({ payment, createdAt }: Props) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (payment.status !== "Pending") return;

    const elapsed = Date.now() - createdAt.getTime();
    const remaining = PAYMENT_LINK_EXPIRATION_MS - elapsed;

    if (remaining <= 0) {
      setTimeRemaining(0);
      return;
    }

    setTimeRemaining(remaining);

    const interval = setInterval(() => {
      const newElapsed = Date.now() - createdAt.getTime();
      const newRemaining = PAYMENT_LINK_EXPIRATION_MS - newElapsed;
      
      if (newRemaining <= 0) {
        setTimeRemaining(0);
        clearInterval(interval);
      } else {
        setTimeRemaining(newRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [payment.status, createdAt]);

  if (payment.status !== "Pending" || timeRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <Alert>
      <Clock className="h-4 w-4" />
      <AlertDescription>
        Link thanh toán sẽ hết hạn sau{" "}
        <strong>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </strong>
      </AlertDescription>
    </Alert>
  );
}

