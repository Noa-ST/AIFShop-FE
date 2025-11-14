import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useOrderMutation } from "@/hooks/use-orders";
import type { OrderResponseDTO, OrderStatus } from "@/services/types";
import { ORDER_STATUS_OPTIONS } from "@/constants/order-status";
import {
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2,
  ClipboardList,
  Eye,
} from "lucide-react";

const transitionMap: Record<OrderStatus, OrderStatus[]> = {
  Pending: ["Confirmed", "Canceled"],
  Confirmed: ["Shipped", "Canceled"],
  Shipped: ["Delivered", "Canceled"],
  Delivered: [],
  Canceled: [],
};

type SellerOrderActionsProps = {
  order: OrderResponseDTO;
  onStatusChange?: () => void;
};

export const SellerOrderActions = ({
  order,
  onStatusChange,
}: SellerOrderActionsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isStatusDialogOpen, setStatusDialogOpen] = useState(false);
  const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { updateStatusMutation, cancelOrderMutation } = useOrderMutation();

  const statusForm = useForm<{ status: OrderStatus }>({
    defaultValues: { status: "Confirmed" },
  });

  const availableStatuses = transitionMap[order.status] || [];

  const canConfirm = order.status === "Pending";
  const canCancel =
    order.status === "Pending" || order.status === "Confirmed";

  const handleQuickConfirm = () => {
    if (!canConfirm) return;
    updateStatusMutation.mutate(
      {
        orderId: order.orderId,
        status: "Confirmed",
      },
      {
        onSuccess: () => {
          toast({
            title: "Đã xác nhận đơn hàng",
            description: `Đơn hàng ${order.orderId} đã được xác nhận thành công.`,
          });
          // Note: useOrderMutation hook already invalidates queries automatically
          // onStatusChange callback is optional for additional actions
          onStatusChange?.();
        },
        onError: (error: any) => {
          console.error("Error confirming order:", error);
          const errorMessage =
            error?.message ||
            error?.response?.data?.message ||
            error?.response?.data?.Message ||
            "Không thể xác nhận đơn hàng";
          toast({
            title: "Lỗi",
            description: errorMessage,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleStatusChange = (status: OrderStatus) => {
    statusForm.setValue("status", status);
    setStatusDialogOpen(true);
  };

  const onSubmitStatus = (data: { status: OrderStatus }) => {
    updateStatusMutation.mutate(
      {
        orderId: order.orderId,
        status: data.status,
      },
      {
        onSuccess: () => {
          toast({
            title: "Đã cập nhật trạng thái",
            description: `Đơn hàng ${order.orderId} đã được cập nhật thành ${ORDER_STATUS_OPTIONS.find((s) => s.value === data.status)?.label}.`,
          });
          setStatusDialogOpen(false);
          // Note: useOrderMutation hook already invalidates queries automatically
          onStatusChange?.();
        },
        onError: (error: any) => {
          console.error("Error updating order status:", error);
          const errorMessage =
            error?.message ||
            error?.response?.data?.message ||
            error?.response?.data?.Message ||
            "Không thể cập nhật trạng thái";
          toast({
            title: "Lỗi",
            description: errorMessage,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCancel = () => {
    cancelOrderMutation.mutate(order.orderId, {
      onSuccess: () => {
        toast({
          title: "Đã hủy đơn hàng",
          description: `Đơn hàng ${order.orderId} đã được hủy thành công.`,
        });
        setCancelDialogOpen(false);
        // Note: useOrderMutation hook already invalidates queries automatically
        onStatusChange?.();
      },
      onError: (error: any) => {
        console.error("Error canceling order:", error);
        const errorMessage =
          error?.message ||
          error?.response?.data?.message ||
          error?.response?.data?.Message ||
          "Không thể hủy đơn hàng";
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });
      },
    });
  };

  const handleViewDetail = () => {
    navigate(`/orders/${order.orderId}`);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Quick Confirm Button */}
        {canConfirm && (
          <Button
            size="sm"
            variant="default"
            onClick={handleQuickConfirm}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Xác nhận
          </Button>
        )}

        {/* Quick Actions Menu - Always show (at least has View Detail) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* View Detail - Always available */}
            <DropdownMenuItem onClick={handleViewDetail}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết đơn
            </DropdownMenuItem>
            {availableStatuses.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {availableStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status)}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    {ORDER_STATUS_OPTIONS.find((s) => s.value === status)?.label ||
                      status}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {canCancel && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setCancelDialogOpen(true)}
                  className="text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Hủy đơn hàng
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
            <DialogDescription>
              Đơn hàng {order.orderId} - Hiện tại:{" "}
              {ORDER_STATUS_OPTIONS.find((s) => s.value === order.status)?.label}
            </DialogDescription>
          </DialogHeader>
          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(onSubmitStatus)}>
              <FormField
                control={statusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái mới</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value as OrderStatus)}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {ORDER_STATUS_OPTIONS.find((s) => s.value === status)?.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={updateStatusMutation.isPending}>
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng {order.orderId}? Hành động này
              không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận hủy"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

