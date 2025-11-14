import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyVND } from "@/lib/utils";
import type {
  MessageAttachmentOrder,
  MessageAttachmentProduct,
} from "@/types/chat";
import { ExternalLink } from "lucide-react";

type OrderAttachmentCardProps = {
  order: MessageAttachmentOrder;
  onViewOrder?: (orderId: string) => void;
};

export const OrderAttachmentCard = ({ order, onViewOrder }: OrderAttachmentCardProps) => {
  const statusColorMap: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Confirmed: "bg-blue-100 text-blue-700",
    Shipped: "bg-indigo-100 text-indigo-700",
    Delivered: "bg-emerald-100 text-emerald-700",
    Canceled: "bg-rose-100 text-rose-700",
  };

  const paymentColorMap: Record<string, string> = {
    Paid: "bg-emerald-100 text-emerald-700",
    Pending: "bg-amber-100 text-amber-700",
    Failed: "bg-rose-100 text-rose-700",
  };

  const statusClass = statusColorMap[order.status] ?? "bg-gray-100 text-gray-700";
  const isPaid = order.paymentStatus === "Paid";
  const paymentLabel = order.paymentStatus === "Failed"
    ? "Thanh toán thất bại"
    : isPaid
      ? "Đã thanh toán"
      : "Chưa thanh toán";
  const paymentClass = order.paymentStatus
    ? paymentColorMap[order.paymentStatus] ?? "bg-gray-100 text-gray-700"
    : (isPaid ? paymentColorMap.Paid : paymentColorMap.Pending);

  return (
    <Card className="border-rose-100 bg-rose-50/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-rose-700">
          Đơn hàng #{order.orderId.slice(0, 8)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusClass}>{order.status}</Badge>
          {order.paymentStatus && (
            <Badge className={paymentClass}>{paymentLabel}</Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Tổng tiền</span>
          <span className="font-semibold text-rose-700">
            {formatCurrencyVND(order.totalAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Tạo lúc</span>
          <span>{new Date(order.createdAt).toLocaleString("vi-VN")}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-rose-200 text-rose-600 hover:bg-rose-100"
          onClick={() => onViewOrder?.(order.orderId)}
        >
          <ExternalLink className="mr-2 h-4 w-4" /> Xem chi tiết đơn hàng
        </Button>
      </CardContent>
    </Card>
  );
};

type ProductAttachmentCardProps = {
  product: MessageAttachmentProduct;
  onViewProduct?: (productId: string) => void;
};

export const ProductAttachmentCard = ({ product, onViewProduct }: ProductAttachmentCardProps) => {
  return (
    <Card className="border-sky-100 bg-sky-50/40">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-white shadow">
          {product.thumbnailUrl ? (
            <img
              src={product.thumbnailUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
              Không có ảnh
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1 text-sm">
          <p className="font-semibold text-sky-700">{product.name}</p>
          <p className="text-gray-500">{formatCurrencyVND(product.price)}</p>
          {product.shopName && (
            <p className="text-xs text-gray-400">{product.shopName}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-sky-200 text-sky-600 hover:bg-sky-100"
            onClick={() => onViewProduct?.(product.productId)}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Xem sản phẩm
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


