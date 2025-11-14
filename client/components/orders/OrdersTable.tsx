import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { format } from "date-fns";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
                <Link to={`/orders/${orderId}`} className="font-medium text-primary">
                  {orderId}
                </Link>
              </TableCell>
              {showCustomerColumn && (
                <TableCell>{order.customerName || "--"}</TableCell>
              )}
              {showShopColumn && <TableCell>{order.shopName || "--"}</TableCell>}
              <TableCell className="text-right font-medium">
                {formatCurrencyVND(order.totalAmount)}
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
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

