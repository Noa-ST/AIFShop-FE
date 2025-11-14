import axiosClient from "@/services/axiosClient";
import {
  assertServiceSuccess,
  type PaymentDto,
  type PaymentMethod,
  type PaymentStatus,
  type ServiceResponse,
  type PayOSCreatePaymentResponse,
  type PaymentHistory,
} from "@/services/types";

export type ProcessPaymentRequest = {
  method: string;
};

export type UpdatePaymentStatusRequest = {
  status: string;
  reason?: string;
};

export type RefundRequest = {
  paymentId: string;
  amount: number;
  reason: string;
};

// Process payment
export const processPayment = async (
  orderId: string,
  method: string,
): Promise<PayOSCreatePaymentResponse> => {
  console.log(`📤 Processing payment for order ${orderId} with method ${method}`);
  
  try {
    const response = await axiosClient.post<ServiceResponse<PayOSCreatePaymentResponse>>(
      `/api/Payment/${orderId}/process`,
      { method },
    );
    
    console.log(`📥 Payment process response:`, response.data);
    
    // ✅ Normalize response format (hỗ trợ cả Succeeded và succeeded)
  const responseData: any = response.data;
    const normalizedResponse: ServiceResponse<PayOSCreatePaymentResponse> = {
      Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
      Data: responseData?.Data ?? responseData?.data ?? null,
      Message: responseData?.Message ?? responseData?.message,
      StatusCode: responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
    };
    
    // ✅ Extract error message từ backend nếu có
    if (!normalizedResponse.Succeeded) {
      const errorMessage = normalizedResponse.Message || "Xử lý thanh toán thất bại";
      const error = new Error(errorMessage);
      (error as any).serviceResponse = normalizedResponse;
      throw error;
    }
    
    return normalizedResponse.Data!;
  } catch (error: any) {
    console.error(`❌ Payment process error:`, {
      orderId,
      method,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    
    // ✅ Extract error message từ backend response
    if (error.response?.data?.message) {
      const backendError = new Error(error.response.data.message);
      (backendError as any).response = error.response;
      throw backendError;
    }
    
    throw error;
  }
};

// Get payment by order ID
export const getPaymentByOrder = async (
  orderId: string,
): Promise<PaymentDto | null> => {
  try {
    const response = await axiosClient.get<ServiceResponse<PaymentDto>>(
      `/api/Payment/order/${orderId}`,
    );
    const responseData: any = response.data;
    const normalizedResponse: ServiceResponse<PaymentDto> = {
      Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
      Data: responseData?.Data ?? responseData?.data ?? null,
      Message: responseData?.Message ?? responseData?.message,
      StatusCode:
        responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
    };
    return assertServiceSuccess(
      normalizedResponse,
      "Không thể tải thông tin thanh toán",
    );
  } catch (error: any) {
    // ✅ Nếu 404, trả về null thay vì throw (404 là bình thường cho COD orders)
    if (error?.response?.status === 404) {
      console.log(`Payment not found for order ${orderId} (this is normal for COD orders)`);
      return null;
    }
    throw error;
  }
};

// Cancel payment link
export const cancelPaymentLink = async (
  paymentId: string,
): Promise<boolean> => {
  const response = await axiosClient.post<ServiceResponse<boolean>>(
    `/api/Payment/${paymentId}/cancel`,
  );
  const responseData: any = response.data;
  const normalizedResponse: ServiceResponse<boolean> = {
    Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
    Data: responseData?.Data ?? responseData?.data ?? null,
    Message: responseData?.Message ?? responseData?.message,
    StatusCode:
      responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
  };
  return assertServiceSuccess(normalizedResponse, "Hủy payment link thất bại");
};

// Retry payment
export const retryPayment = async (
  paymentId: string,
): Promise<PayOSCreatePaymentResponse> => {
  const response = await axiosClient.post<ServiceResponse<PayOSCreatePaymentResponse>>(
    `/api/Payment/${paymentId}/retry`,
  );
  const responseData: any = response.data;
  const normalizedResponse: ServiceResponse<PayOSCreatePaymentResponse> = {
    Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
    Data: responseData?.Data ?? responseData?.data ?? null,
    Message: responseData?.Message ?? responseData?.message,
    StatusCode:
      responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
  };
  return assertServiceSuccess(normalizedResponse, "Thử lại thanh toán thất bại");
};

// Get payment history
export const getPaymentHistory = async (
  paymentId: string,
): Promise<PaymentHistory[]> => {
  const response = await axiosClient.get<ServiceResponse<PaymentHistory[]>>(
    `/api/Payment/${paymentId}/history`,
  );
  const responseData: any = response.data;
  const normalizedResponse: ServiceResponse<PaymentHistory[]> = {
    Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
    Data: responseData?.Data ?? responseData?.data ?? null,
    Message: responseData?.Message ?? responseData?.message,
    StatusCode:
      responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
  };
  return assertServiceSuccess(
    normalizedResponse,
    "Không thể tải lịch sử thanh toán",
  );
};

// Update payment status (Admin only)
export const updatePaymentStatus = async (
  paymentId: string,
  status: string,
  reason?: string,
): Promise<boolean> => {
  const response = await axiosClient.put<ServiceResponse<boolean>>(
    `/api/Payment/${paymentId}/status`,
    { status, reason },
  );
  const responseData: any = response.data;
  const normalizedResponse: ServiceResponse<boolean> = {
    Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
    Data: responseData?.Data ?? responseData?.data ?? null,
    Message: responseData?.Message ?? responseData?.message,
    StatusCode:
      responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
  };
  return assertServiceSuccess(
    normalizedResponse,
    "Cập nhật trạng thái thanh toán thất bại",
  );
};

// Refund (Admin/Seller)
export const refundPayment = async (
  request: RefundRequest,
): Promise<boolean> => {
  const response = await axiosClient.post<ServiceResponse<boolean>>(
    "/api/Payment/refund",
    request,
  );
  const responseData: any = response.data;
  const normalizedResponse: ServiceResponse<boolean> = {
    Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
    Data: responseData?.Data ?? responseData?.data ?? null,
    Message: responseData?.Message ?? responseData?.message,
    StatusCode:
      responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
  };
  return assertServiceSuccess(normalizedResponse, "Hoàn tiền thất bại");
};

// Get statistics (Admin)
export const getPaymentStatistics = async (
  startDate?: string,
  endDate?: string,
): Promise<any> => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const response = await axiosClient.get<ServiceResponse<any>>(
    `/api/Payment/admin/statistics?${params.toString()}`,
  );
  const responseData: any = response.data;
  const normalizedResponse: ServiceResponse<any> = {
    Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
    Data: responseData?.Data ?? responseData?.data ?? null,
    Message: responseData?.Message ?? responseData?.message,
    StatusCode:
      responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
  };
  return assertServiceSuccess(normalizedResponse, "Không thể tải thống kê thanh toán");
};

// Helper: Get payment status label
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    Pending: "Chờ thanh toán",
    Paid: "Đã thanh toán",
    Failed: "Thanh toán thất bại",
  };
  return labels[status] || status;
}

// Helper: Check if payment link expired
export function isPaymentLinkExpired(expiredAt?: number): boolean {
  if (!expiredAt) return false;
  return Date.now() / 1000 > expiredAt;
}

