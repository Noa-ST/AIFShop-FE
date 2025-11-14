import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { ORDER_STATUS_OPTIONS } from "@/constants/order-status";
import { useOrderList, useOrderMutation } from "@/hooks/use-orders";
import type { OrderResponseDTO, OrderStatus } from "@/services/types";
import { Filter } from "lucide-react";

type FilterFormValues = {
  status: OrderStatus | "all";
};

type UpdateFormValues = {
  status: OrderStatus;
};

const DEFAULT_FILTER: FilterFormValues = {
  status: "all",
};

const statusOptions = [{ label: "Tất cả", value: "all" as const }].concat(
  ORDER_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value })),
);

const transitionMap: Record<OrderStatus, OrderStatus[]> = {
  Pending: ["Confirmed", "Canceled"],
  Confirmed: ["Shipped", "Canceled"],
  Shipped: ["Delivered", "Canceled"],
  Delivered: [],
  Canceled: [],
};

const AdminOrdersPage = () => {
  const { toast } = useToast();

  const filterForm = useForm<FilterFormValues>({
    defaultValues: DEFAULT_FILTER,
  });

  const updateForm = useForm<UpdateFormValues>({
    defaultValues: { status: "Pending" },
  });

  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDTO | null>(
    null,
  );

  const status = filterForm.watch("status");
  const selectedStatus = useMemo(
    () => (status && status !== "all" ? (status as OrderStatus) : undefined),
    [status],
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOrderList({
    scope: "all",
    status: selectedStatus,
  });

  const { updateStatusMutation } = useOrderMutation();

  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Không thể tải đơn hàng",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  useEffect(() => {
    if (updateStatusMutation.isError) {
      const mutationError = updateStatusMutation.error as Error;
      toast({
        title: "Không thể cập nhật",
        description: mutationError.message,
        variant: "destructive",
      });
    }
  }, [updateStatusMutation.isError, updateStatusMutation.error, toast]);

  useEffect(() => {
    if (updateStatusMutation.isSuccess) {
      toast({
        title: "Cập nhật thành công",
        description: "Trạng thái đơn hàng đã được cập nhật.",
      });
      setSelectedOrder(null);
    }
  }, [updateStatusMutation.isSuccess, toast]);

  const orders = data ?? [];
  const loadingState = isLoading || isFetching;

  const openUpdateDialog = (order: OrderResponseDTO) => {
    setSelectedOrder(order);
    const available = transitionMap[order.status] ?? [];
    updateForm.reset({ status: available[0] || order.status });
  };

  const closeDialog = () => {
    setSelectedOrder(null);
  };

  const availableOptions = selectedOrder
    ? transitionMap[selectedOrder.status] || []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Quản lý đơn hàng
        </h1>
        <p className="text-sm text-muted-foreground">
          Xem và cập nhật trạng thái đơn hàng trên toàn hệ thống.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium uppercase text-muted-foreground">
            Bộ lọc
          </h2>
        </div>

        <Form {...filterForm}>
          <form className="grid gap-4 md:grid-cols-3">
            <FormField
              control={filterForm.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái đơn hàng</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  filterForm.reset(DEFAULT_FILTER);
                  refetch();
                }}
              >
                Đặt lại
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => refetch()}
                disabled={loadingState}
              >
                Làm mới
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <OrdersTable
        orders={orders}
        isLoading={loadingState}
        emptyTitle="Chưa có đơn hàng nào"
        emptyDescription="Khi có giao dịch mới, đơn hàng sẽ được hiển thị ở đây."
        showCustomerColumn
        showShopColumn
        renderActionsColumn={(order) => {
          const transitions = transitionMap[order.status] || [];
          const disabled = transitions.length === 0;
          return (
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => openUpdateDialog(order)}
            >
              Cập nhật
            </Button>
          );
        }}
      />

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
            <DialogDescription>
              Vui lòng chọn trạng thái tiếp theo cho đơn hàng
              {selectedOrder?.orderId ? (
                <Badge variant="outline" className="ml-2">
                  {selectedOrder.orderId}
                </Badge>
              ) : null}
              .
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <Form {...updateForm}>
              <form
                className="space-y-4"
                onSubmit={updateForm.handleSubmit((values) => {
                  updateStatusMutation.mutate({
                    orderId: selectedOrder.orderId,
                    status: values.status,
                  });
                })}
              >
                <FormField
                  control={updateForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái mới</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!availableOptions.length}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableOptions.map((option) => {
                              const meta = ORDER_STATUS_OPTIONS.find(
                                (item) => item.value === option,
                              );
                              return (
                                <SelectItem key={option} value={option}>
                                  {meta?.label || option}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateStatusMutation.isPending}
                  >
                    Xác nhận
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrdersPage;

