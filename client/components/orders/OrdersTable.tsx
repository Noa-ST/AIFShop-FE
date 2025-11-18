import { Link } from "react-router-dom";
import { PackageSearch, Copy } from "lucide-react";
import { format } from "date-fns";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/StatusBadges";
import { formatCurrencyVND } from "@/lib/utils";
import type { OrderResponseDTO } from "@/services/types";

type OrdersTableProps = {
  orders: OrderResponseDTO[];
  isLoading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyCtaLabel?: string;
  emptyCtaHref?: string;
  showShopColumn?: boolean;
  showCustomerColumn?: boolean;
  renderPaymentColumn?: (order: OrderResponseDTO) => ReactNode;
  renderReviewColumn?: (order: OrderResponseDTO) => ReactNode;
  renderActionsColumn?: (order: OrderResponseDTO) => ReactNode;
};

// Compact status timeline for quick visual progress
const STATUS_STEPS = ["Pending", "Confirmed", "Shipped", "Delivered"] as const;

function OrderStatusTimeline({ status }: { status: OrderResponseDTO["status"] }) {
  if (status === "Canceled") {
    return (
      <div className="text-[11px] text-destructive">Đã hủy</div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(status as any);
  return (
    <div className="flex items-center gap-1.5">
      {STATUS_STEPS.map((_, idx) => (
        <div key={idx} className="flex items-center">
          <div className={`h-1.5 w-1.5 rounded-full ${idx <= currentIndex ? "bg-primary" : "bg-muted"}`} />
          {idx < STATUS_STEPS.length - 1 && (
            <div className={`h-0.5 w-6 ${idx < currentIndex ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

const formatDate = (value?: string) => {
  if (!value) return "--";
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm");
  } catch {
    return value;
  }
};

const TableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, index) => (
      <Skeleton key={index} className="h-12 w-full" />
    ))}
  </div>
);

const shortenId = (id: string) => {
  if (!id || id.length <= 8) return id;
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
};

export const OrdersTable = ({
  orders,
  isLoading,
  emptyTitle,
  emptyDescription,
  emptyCtaHref = "/",
  emptyCtaLabel = "Quay lại mua sắm",
  showShopColumn,
  showCustomerColumn,
  renderPaymentColumn,
  renderReviewColumn,
  renderActionsColumn,
}: OrdersTableProps) => {
  const { toast } = useToast();

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!orders.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <PackageSearch className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{emptyTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {emptyDescription}
            </p>
          </div>
          {emptyCtaHref && (
            <Button asChild>
              <Link to={emptyCtaHref}>{emptyCtaLabel}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã đơn</TableHead>
          {showCustomerColumn && <TableHead>Khách hàng</TableHead>}
          {showShopColumn && <TableHead>Cửa hàng</TableHead>}
          <TableHead className="text-right">Tổng tiền</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày tạo</TableHead>
          <TableHead>Thanh toán</TableHead>
          {renderReviewColumn && <TableHead>Đánh giá</TableHead>}
          {renderActionsColumn && <TableHead className="w-[120px]">Thao tác</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const orderId = order.orderId || "--";
          return (
            <TableRow key={orderId} className="cursor-pointer hover:bg-muted/40">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link to={`/orders/${orderId}`} className="font-medium text-primary">
                    {shortenId(orderId)}
                  </Link>
                  {orderId !== "--" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard
                                .writeText(orderId)
                                .then(() =>
                                  toast({
                                    title: "Đã sao chép",
                                    description: `Mã đơn ${orderId} đã được sao chép`,
                                  }),
                                )
                                .catch(() =>
                                  toast({
                                    title: "Không thể sao chép",
                                    description: "Vui lòng thử lại",
                                    variant: "destructive",
                                  }),
                                );
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sao chép mã đơn đầy đủ</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              {showCustomerColumn && (
                <TableCell>{order.customerName || "--"}</TableCell>
              )}
              {showShopColumn && <TableCell>{order.shopName || "--"}</TableCell>}
              <TableCell className="text-right font-medium">
                {formatCurrencyVND(order.totalAmount)}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <OrderStatusBadge status={order.status} />
                  <OrderStatusTimeline status={order.status} />
                </div>
              </TableCell>
              <TableCell>{formatDate(order.createdAt)}</TableCell>
              <TableCell>
                {renderPaymentColumn ? (
                  renderPaymentColumn(order)
                ) : (
                  <PaymentStatusBadge status={order.paymentStatus} isPaid={order.isPaid} />
                )}
              </TableCell>
              {renderReviewColumn && (
                <TableCell>{renderReviewColumn(order)}</TableCell>
              )}
              {renderActionsColumn && (
                <TableCell>{renderActionsColumn(order)}</TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

