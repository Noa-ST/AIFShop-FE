import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_META,
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
} from "@/constants/order-status";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/services/types";

type BadgeProps = ComponentProps<typeof Badge>;

const fallbackLabel = "Không xác định";

const renderBadge = (
  meta: { label: string; badgeVariant: BadgeProps["variant"] } | undefined,
  fallback: string,
) => {
  if (!meta) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {fallback}
      </Badge>
    );
  }

  return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>;
};

export const OrderStatusBadge = ({
  status,
}: {
  status?: OrderStatus | null;
}) => {
  const meta = status ? ORDER_STATUS_META[status] : undefined;
  return renderBadge(meta, fallbackLabel);
};

export const PaymentStatusBadge = ({
  status,
  isPaid,
}: {
  status?: PaymentStatus | null;
  isPaid?: boolean | null;
}) => {
  // Preserve explicit Failed state
  if (status === "Failed") {
    const failedMeta = PAYMENT_STATUS_META.Failed;
    return renderBadge(failedMeta, fallbackLabel);
  }

  // Determine paid state using isPaid first, then fallback to paymentStatus
  const paid = typeof isPaid === "boolean" ? isPaid : status === "Paid";

  const paidMeta = {
    label: paid ? "Đã thanh toán" : "Chưa thanh toán",
    badgeVariant: paid ? ("default" as BadgeProps["variant"]) : ("secondary" as BadgeProps["variant"]),
  };

  return renderBadge(paidMeta, fallbackLabel);
};

export const PaymentMethodBadge = ({
  method,
}: {
  method?: PaymentMethod | null;
}) => {
  const meta = method ? PAYMENT_METHOD_META[method] : undefined;
  return renderBadge(meta, fallbackLabel);
};

