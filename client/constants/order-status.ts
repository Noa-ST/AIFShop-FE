import type { BadgeProps } from "@/components/ui/badge";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/services/types";

type BadgeVariant = BadgeProps["variant"];

type StatusMeta<TValue> = {
  label: string;
  badgeVariant: BadgeVariant;
  description?: string;
  value: TValue;
};

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta<OrderStatus>> = {
  Pending: {
    label: "Chờ xác nhận",
    badgeVariant: "secondary",
    value: "Pending",
  },
  Confirmed: {
    label: "Đã xác nhận",
    badgeVariant: "default",
    value: "Confirmed",
  },
  Shipped: {
    label: "Đang giao",
    badgeVariant: "default",
    value: "Shipped",
  },
  Delivered: {
    label: "Đã giao",
    badgeVariant: "default",
    value: "Delivered",
  },
  Canceled: {
    label: "Đã hủy",
    badgeVariant: "destructive",
    value: "Canceled",
  },
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  StatusMeta<PaymentStatus>
> = {
  Pending: {
    label: "Chờ thanh toán",
    badgeVariant: "secondary",
    value: "Pending",
  },
  Paid: {
    label: "Đã thanh toán",
    badgeVariant: "default",
    value: "Paid",
  },
  Failed: {
    label: "Thanh toán thất bại",
    badgeVariant: "destructive",
    value: "Failed",
  },
};

export const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  StatusMeta<PaymentMethod>
> = {
  COD: {
    label: "Thanh toán khi nhận hàng",
    badgeVariant: "outline",
    value: "COD",
  },
  Wallet: {
    label: "Ví điện tử",
    badgeVariant: "outline",
    value: "Wallet",
  },
  Bank: {
    label: "Chuyển khoản ngân hàng",
    badgeVariant: "outline",
    value: "Bank",
  },
  Cash: {
    label: "Tiền mặt",
    badgeVariant: "outline",
    value: "Cash",
  },
};

export const ORDER_STATUS_OPTIONS = Object.values(ORDER_STATUS_META);
export const PAYMENT_STATUS_OPTIONS = Object.values(PAYMENT_STATUS_META);
export const PAYMENT_METHOD_OPTIONS = Object.values(PAYMENT_METHOD_META);

