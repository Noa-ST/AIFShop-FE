import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
  cancelOrder,
  type OrderCreateDTO,
} from "@/services/orders";
import type { OrderResponseDTO, OrderStatus } from "@/services/types";

export type OrderListScope = "customer" | "shop" | "all";

const baseKey = ["orders"] as const;

type UseOrderListParams = {
  scope: OrderListScope;
  id?: string;
  status?: OrderStatus;
  filter?: any;
};

export const useOrderList = ({
  scope,
  id,
  status,
  filter,
}: UseOrderListParams) => {
  const enabled = scope === "all" ? true : Boolean(id);

  return useQuery<OrderResponseDTO[], Error>({
    queryKey: [...baseKey, scope, id ?? "*", status ?? "*"] as const,
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      let result: any;

      if (scope === "all") {
        result = await getAllOrders(filter);
      } else if (scope === "customer") {
        result = await getMyOrders(filter);
      } else if (scope === "shop" && id) {
        result = await getShopOrders(id, filter);
      }

      // Handle pagination response
      // result is PagedResult<OrderResponseDTO> which has structure:
      // { data: OrderResponseDTO[], totalCount, page, pageSize, ... }
      const orders = Array.isArray(result?.data) ? result.data : [];

      console.log(`📦 useOrderList:`, {
        scope,
        resultType: typeof result,
        hasData: !!result?.data,
        isDataArray: Array.isArray(result?.data),
        ordersCount: orders.length,
        status,
      });

      // Filter by status if provided
      if (status && orders.length > 0) {
        const filtered = orders.filter(
          (order: OrderResponseDTO) => order.status === status,
        );
        console.log(`📦 Filtered by status "${status}":`, filtered.length);
        return filtered;
      }

      return orders;
    },
  });
};

export const useOrderMutation = () => {
  const queryClient = useQueryClient();

  const invalidateOrderQueries = (orderId?: string) => {
    // ✅ Invalidate all order queries (using prefix matching)
    queryClient.invalidateQueries({ 
      queryKey: baseKey,
      exact: false, // Match all queries starting with ["orders"]
    });
    if (orderId) {
      queryClient.invalidateQueries({
        queryKey: [...baseKey, "detail", orderId],
      });
    }
  };

  const createOrderMutation = useMutation({
    mutationKey: [...baseKey, "create"],
    mutationFn: (payload: OrderCreateDTO) => createOrder(payload),
    onSuccess: () => invalidateOrderQueries(),
  });

  const updateStatusMutation = useMutation({
    mutationKey: [...baseKey, "update-status"],
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => updateOrderStatus(orderId, status),
    onSuccess: (_data, variables) => invalidateOrderQueries(variables.orderId),
  });

  const cancelOrderMutation = useMutation({
    mutationKey: [...baseKey, "cancel"],
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (_data, orderId) => invalidateOrderQueries(orderId),
  });

  return {
    createOrderMutation,
    updateStatusMutation,
    cancelOrderMutation,
  };
};
