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
  className?: string;
};

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta<OrderStatus>> = {
  Pending: {
    label: "Chờ xác nhận",
    badgeVariant: "secondary",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    value: "Pending",
  },
  Confirmed: {
    label: "Đã xác nhận",
    badgeVariant: "default",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    value: "Confirmed",
  },
  Shipped: {
    label: "Đang giao",
    badgeVariant: "default",
    className: "bg-green-100 text-green-800 border-green-200",
    value: "Shipped",
  },
  Delivered: {
    label: "Đã giao",
    badgeVariant: "default",
    className: "bg-emerald-600 text-white border-emerald-600",
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
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
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

