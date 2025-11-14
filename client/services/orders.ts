import axiosClient from "@/services/axiosClient";
import {
  assertServiceSuccess,
  type OrderResponseDTO,
  type OrderStatus,
  type ServiceResponse,
  type OrderFilterDto,
  type PagedResult,
} from "@/services/types";

// Types matching API specification
export type OrderItemCreateDTO = {
  productId: string;
  quantity: number;
};

export type OrderCreateDTO = {
  shopId: string;
  addressId: string;
  items: OrderItemCreateDTO[];
  paymentMethod: string;
  shippingFee: number;
  promotionCode?: string;
  discountAmount: number;
};

export type OrderUpdateStatusDTO = {
  status: OrderStatus;
};

export type UpdateTrackingNumberDto = {
  trackingNumber: string;
};

// Helper: Normalize isPaid with backward compatibility
function withPaidFlag(order: OrderResponseDTO): OrderResponseDTO {
  const hasIsPaid = typeof order.isPaid === "boolean";
  const inferredPaid = order.paymentStatus === "Paid";
  return { ...order, isPaid: hasIsPaid ? order.isPaid : inferredPaid };
}

function withPaidFlagList(orders: OrderResponseDTO[]): OrderResponseDTO[] {
  return Array.isArray(orders) ? orders.map(withPaidFlag) : [];
}

// Create order
export const createOrder = async (
  payload: OrderCreateDTO,
): Promise<OrderResponseDTO[]> => {
  // ✅ Log request payload
  console.log("📤 POST /api/Order/create", {
    shopId: payload.shopId,
    addressId: payload.addressId,
    paymentMethod: payload.paymentMethod,
    shippingFee: payload.shippingFee,
    discountAmount: payload.discountAmount,
    itemsCount: payload.items.length,
    items: payload.items,
  });

  try {
    const response = await axiosClient.post<
      ServiceResponse<OrderResponseDTO[]>
    >("/api/Order/create", payload);

    // ✅ Log response đầy đủ để debug
    console.log("📥 Order create response:", response);
    console.log("📥 Response data:", response.data);
    console.log("📥 Response data type:", typeof response.data);
    console.log("📥 Response data keys:", Object.keys(response.data || {}));

    // ✅ Kiểm tra format response (có thể backend trả về format khác)
    const responseData: any = response.data;

    // Normalize response format (hỗ trợ cả Succeeded và succeeded)
    const normalizedResponse: ServiceResponse<OrderResponseDTO[]> = {
      Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
      Data: responseData?.Data ?? responseData?.data ?? null,
      Message: responseData?.Message ?? responseData?.message,
      StatusCode:
        responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
    };

    console.log("📥 Normalized response:", normalizedResponse);
    console.log("📥 Normalized Succeeded:", normalizedResponse.Succeeded);
    console.log("📥 Normalized Data:", normalizedResponse.Data);
    console.log(
      "📥 Normalized Data is array:",
      Array.isArray(normalizedResponse.Data),
    );

    const data = assertServiceSuccess(
      normalizedResponse,
      "Tạo đơn hàng thất bại",
    );
    return withPaidFlagList(data);
  } catch (error: any) {
    // ✅ Log error chi tiết
    console.error("❌ Order create error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      },
    });
    throw error;
  }
};

// Get my orders with pagination and filtering
export const getMyOrders = async (
  filter?: OrderFilterDto,
): Promise<PagedResult<OrderResponseDTO>> => {
  console.log(`📤 GET /api/Order/myOrders?${buildFilterParams(filter)}`);
  try {
    const params = buildFilterParams(filter);
    const response = await axiosClient.get<
      ServiceResponse<PagedResult<OrderResponseDTO>>
    >(`/api/Order/myOrders?${params}`);

    console.log(`📥 MyOrders response:`, response.data);

    // ✅ Normalize response format (hỗ trợ cả Succeeded và succeeded)
    const responseData: any = response.data;
    const normalizedResponse: ServiceResponse<PagedResult<OrderResponseDTO>> = {
      Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
      Data: responseData?.Data ?? responseData?.data ?? null,
      Message: responseData?.Message ?? responseData?.message,
      StatusCode:
        responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
    };

    console.log(`📥 Normalized response:`, normalizedResponse);

    const result = assertServiceSuccess(
      normalizedResponse,
      "Không thể tải danh sách đơn hàng",
    );
    return { ...result, data: withPaidFlagList(result.data) };
  } catch (error: any) {
    console.error(`❌ MyOrders error:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// Get shop orders (Seller) with pagination and filtering
export const getShopOrders = async (
  shopId: string,
  filter?: OrderFilterDto,
): Promise<PagedResult<OrderResponseDTO>> => {
  console.log(
    `📤 GET /api/Order/shopOrders?shopId=${shopId}&${buildFilterParams(filter)}`,
  );
  try {
    const params = buildFilterParams(filter);
    const response = await axiosClient.get<
      ServiceResponse<PagedResult<OrderResponseDTO>>
    >(`/api/Order/shopOrders?shopId=${shopId}&${params}`);

    console.log(`📥 ShopOrders response:`, response.data);

    // ✅ Normalize response format (hỗ trợ cả Succeeded và succeeded)
    const responseData: any = response.data;
    const normalizedResponse: ServiceResponse<PagedResult<OrderResponseDTO>> = {
      Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
      Data: responseData?.Data ?? responseData?.data ?? null,
      Message: responseData?.Message ?? responseData?.message,
      StatusCode:
        responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
    };

    console.log(`📥 Normalized response:`, normalizedResponse);

    const result = assertServiceSuccess(
      normalizedResponse,
      "Không thể tải đơn hàng cửa hàng",
    );
    return { ...result, data: withPaidFlagList(result.data) };
  } catch (error: any) {
    console.error(`❌ ShopOrders error:`, {
      shopId,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// Get all orders (Admin) with pagination and filtering
export const getAllOrders = async (
  filter?: OrderFilterDto,
): Promise<PagedResult<OrderResponseDTO>> => {
  console.log(`📤 GET /api/Order/all?${buildFilterParams(filter)}`);
  try {
    const params = buildFilterParams(filter);
    const response = await axiosClient.get<
      ServiceResponse<PagedResult<OrderResponseDTO>>
    >(`/api/Order/all?${params}`);

    console.log(`📥 AllOrders response:`, response.data);

    // ✅ Normalize response format (hỗ trợ cả Succeeded và succeeded)
    const responseData: any = response.data;
    const normalizedResponse: ServiceResponse<PagedResult<OrderResponseDTO>> = {
      Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
      Data: responseData?.Data ?? responseData?.data ?? null,
      Message: responseData?.Message ?? responseData?.message,
      StatusCode:
        responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
    };

    console.log(`📥 Normalized response:`, normalizedResponse);

    const result = assertServiceSuccess(
      normalizedResponse,
      "Không thể tải danh sách đơn hàng",
    );
    return { ...result, data: withPaidFlagList(result.data) };
  } catch (error: any) {
    console.error(`❌ AllOrders error:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// Search and filter orders
export const searchAndFilterOrders = async (
  filter: OrderFilterDto,
): Promise<PagedResult<OrderResponseDTO>> => {
  const params = buildFilterParams(filter);
  const response = await axiosClient.get<
    ServiceResponse<PagedResult<OrderResponseDTO>>
  >(`/api/Order/search?${params}`);
  const result = assertServiceSuccess(
    response.data,
    "Không thể tìm kiếm đơn hàng",
  );
  return { ...result, data: withPaidFlagList(result.data) };
};

// Get order by ID
export const getOrderById = async (
  orderId: string,
): Promise<OrderResponseDTO> => {
  console.log(`📤 GET /api/Order/${orderId}`);

  try {
    const response = await axiosClient.get<ServiceResponse<OrderResponseDTO>>(
      `/api/Order/${orderId}`,
    );

    console.log(`📥 Order get response:`, response.data);

    // ✅ Normalize response format (hỗ trợ cả Succeeded và succeeded)
    const responseData: any = response.data;
    const normalizedResponse: ServiceResponse<OrderResponseDTO> = {
      Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
      Data: responseData?.Data ?? responseData?.data ?? null,
      Message: responseData?.Message ?? responseData?.message,
      StatusCode:
        responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
    };

    console.log(`📥 Normalized response:`, normalizedResponse);

    const data = assertServiceSuccess(
      normalizedResponse,
      "Không thể tải chi tiết đơn hàng",
    );
    return withPaidFlag(data);
  } catch (error: any) {
    console.error(`❌ Order get error:`, {
      orderId,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// Cancel order
export const cancelOrder = async (orderId: string): Promise<boolean> => {
  console.log(`📤 POST /api/Order/${orderId}/cancel`);

  try {
    const response = await axiosClient.post<ServiceResponse<boolean>>(
      `/api/Order/${orderId}/cancel`,
    );

    console.log(`📥 CancelOrder response:`, response.data);

    // ✅ Normalize response format (hỗ trợ cả Succeeded và succeeded)
    const responseData: any = response.data;
    const normalizedResponse: ServiceResponse<boolean> = {
      Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
      Data: responseData?.Data ?? responseData?.data ?? null,
      Message: responseData?.Message ?? responseData?.message,
      StatusCode:
        responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
    };

    console.log(`📥 Normalized response:`, normalizedResponse);

    return assertServiceSuccess(normalizedResponse, "Hủy đơn hàng thất bại");
  } catch (error: any) {
    console.error(`❌ CancelOrder error:`, {
      orderId,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
): Promise<boolean> => {
  console.log(`📤 PUT /api/Order/updateStatus/${orderId}`, { status });

  try {
    const response = await axiosClient.put<ServiceResponse<boolean>>(
      `/api/Order/updateStatus/${orderId}`,
      { status },
    );

    console.log(`📥 UpdateStatus response:`, response.data);

    // ✅ Normalize response format (hỗ trợ cả Succeeded và succeeded)
    const responseData: any = response.data;
    const normalizedResponse: ServiceResponse<boolean> = {
      Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
      Data: responseData?.Data ?? responseData?.data ?? null,
      Message: responseData?.Message ?? responseData?.message,
      StatusCode:
        responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
    };

    console.log(`📥 Normalized response:`, normalizedResponse);

    return assertServiceSuccess(
      normalizedResponse,
      "Cập nhật trạng thái đơn hàng thất bại",
    );
  } catch (error: any) {
    console.error(`❌ UpdateStatus error:`, {
      orderId,
      status,
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      serviceResponse: (error as any).serviceResponse,
    });
    throw error;
  }
};

// Update tracking number (Seller/Admin)
export const updateTrackingNumber = async (
  orderId: string,
  trackingNumber: string,
): Promise<boolean> => {
  const response = await axiosClient.put<ServiceResponse<boolean>>(
    `/api/Order/${orderId}/tracking-number`,
    { trackingNumber },
  );
  return assertServiceSuccess(response.data, "Cập nhật mã vận chuyển thất bại");
};

// Update order address (Customer)
export const updateOrderAddress = async (
  orderId: string,
  addressId: string,
): Promise<boolean> => {
  console.log(`📤 PUT /api/Order/${orderId}/update-address`, { addressId });
  try {
    const response = await axiosClient.put<ServiceResponse<boolean>>(
      `/api/Order/${orderId}/update-address`,
      { addressId },
    );

    console.log(`📥 Update order address response:`, response.data);

    // ✅ Normalize response format
  const responseData: any = response.data;
    const normalizedResponse: ServiceResponse<boolean> = {
      Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
      Data: responseData?.Data ?? responseData?.data ?? false,
      Message: responseData?.Message ?? responseData?.message,
      StatusCode:
        responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
    };

    return assertServiceSuccess(
      normalizedResponse,
      "Cập nhật địa chỉ giao hàng thất bại",
    );
  } catch (error: any) {
    console.error(`❌ Update order address error:`, {
      orderId,
      addressId,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// ✅ New: Customer Confirm Delivery
export const confirmDelivery = async (orderId: string): Promise<boolean> => {
  console.log(`📤 POST /api/Order/${orderId}/confirm-delivery`);

  try {
    const response = await axiosClient.post<ServiceResponse<boolean>>(
      `/api/Order/${orderId}/confirm-delivery`,
    );

    console.log(`📥 Confirm delivery response:`, response.data);

    // ✅ Normalize response format (hỗ trợ cả Succeeded và succeeded)
  const responseData: any = response.data;
    const normalizedResponse: ServiceResponse<boolean> = {
      Succeeded: responseData?.Succeeded ?? responseData?.succeeded ?? false,
      Data: responseData?.Data ?? responseData?.data ?? null,
      Message: responseData?.Message ?? responseData?.message,
      StatusCode:
        responseData?.StatusCode ?? responseData?.statusCode ?? response.status,
    };

    console.log(`📥 Normalized response:`, normalizedResponse);

    return assertServiceSuccess(
      normalizedResponse,
      "Xác nhận nhận hàng thất bại",
    );
  } catch (error: any) {
    console.error(`❌ Confirm delivery error:`, {
      orderId,
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      serviceResponse: (error as any).serviceResponse,
    });
    throw error;
  }
};

// Get statistics (Admin)
export const getOrderStatistics = async (
  startDate?: string,
  endDate?: string,
): Promise<any> => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await axiosClient.get<ServiceResponse<any>>(
    `/api/Order/admin/statistics?${params.toString()}`,
  );
  return assertServiceSuccess(response.data, "Không thể tải thống kê đơn hàng");
};

// Helper: Build filter params
function buildFilterParams(filter?: OrderFilterDto): string {
  if (!filter) return "";

  const params = new URLSearchParams();
  if (filter.page) params.append("page", filter.page.toString());
  if (filter.pageSize) params.append("pageSize", filter.pageSize.toString());
  if (filter.keyword) params.append("keyword", filter.keyword);
  if (filter.status) params.append("status", filter.status);
  if (filter.shopId) params.append("shopId", filter.shopId);
  if (filter.startDate) params.append("startDate", filter.startDate);
  if (filter.endDate) params.append("endDate", filter.endDate);
  if (filter.minAmount) params.append("minAmount", filter.minAmount.toString());
  if (filter.maxAmount) params.append("maxAmount", filter.maxAmount.toString());
  if (filter.sortBy) params.append("sortBy", filter.sortBy);
  if (filter.sortOrder) params.append("sortOrder", filter.sortOrder);

  return params.toString();
}

// Helper: Format price in VND
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Helper: Get status label
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    Pending: "Chờ xử lý",
    Confirmed: "Đã xác nhận",
    Shipped: "Đang giao hàng",
    Delivered: "Đã giao hàng",
    Canceled: "Đã hủy",
  };
  return labels[status] || status;
}
