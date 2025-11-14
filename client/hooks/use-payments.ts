import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  processPayment,
  updatePaymentStatus,
  cancelPaymentLink,
  retryPayment,
  refundPayment,
} from "@/services/payments";
import type {
  PaymentMethod,
  PaymentStatus,
  RefundRequest,
} from "@/services/types";

const baseKey = ["payments"] as const;

export const usePaymentMutation = () => {
  const queryClient = useQueryClient();

  const invalidateOrderRelatedQueries = (orderId?: string) => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: baseKey });
    if (orderId) {
      queryClient.invalidateQueries({
        queryKey: ["payments", "order", orderId],
      });
    }
  };

  const processPaymentMutation = useMutation({
    mutationKey: [...baseKey, "process"],
    mutationFn: ({
      orderId,
      method,
    }: {
      orderId: string;
      method: string;
    }) => processPayment(orderId, method),
    onSuccess: (_data, variables) => invalidateOrderRelatedQueries(variables.orderId),
  });

  const updatePaymentStatusMutation = useMutation({
    mutationKey: [...baseKey, "update-status"],
    mutationFn: ({
      paymentId,
      status,
      reason,
    }: {
      paymentId: string;
      status: string;
      reason?: string;
    }) => updatePaymentStatus(paymentId, status, reason),
    onSuccess: () => invalidateOrderRelatedQueries(),
  });

  const cancelPaymentLinkMutation = useMutation({
    mutationKey: [...baseKey, "cancel"],
    mutationFn: (paymentId: string) => cancelPaymentLink(paymentId),
    onSuccess: () => invalidateOrderRelatedQueries(),
  });

  const retryPaymentMutation = useMutation({
    mutationKey: [...baseKey, "retry"],
    mutationFn: (paymentId: string) => retryPayment(paymentId),
    onSuccess: () => invalidateOrderRelatedQueries(),
  });

  const refundMutation = useMutation({
    mutationKey: [...baseKey, "refund"],
    mutationFn: (request: RefundRequest) => refundPayment(request),
    onSuccess: () => invalidateOrderRelatedQueries(),
  });

  return {
    processPaymentMutation,
    updatePaymentStatusMutation,
    cancelPaymentLinkMutation,
    retryPaymentMutation,
    refundMutation,
  };
};

