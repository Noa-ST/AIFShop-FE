export type ServiceResponse<T> = {
  Succeeded: boolean;
  Data: T | null | undefined;
  Message?: string | null;
  StatusCode: number;
};

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Shipped"
  | "Delivered"
  | "Canceled";

export type PaymentStatus = "Pending" | "Paid" | "Failed";

export type PaymentMethod = "COD" | "Wallet" | "Bank" | "Cash";

// Extended Order Response DTO to match full API specification
export type OrderItemResponseDTO = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderResponseDTO = {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  promotionCodeUsed?: string | null;
  customerName?: string | null;
  shopName?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponseDTO[];
  // New field: paid state (true khi PaymentStatus == Paid)
  isPaid?: boolean | null;
  // Backward compatibility fields
  paymentId?: string | null;
};

// Payment DTOs to match API specification
export type PaymentDto = {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentLinkId?: string | null;
  orderCode?: number | null;
  createdAt: string;
  // Backward compatibility
  paymentId?: string;
};

export type PayOSCreatePaymentResponse = {
  code: number;
  desc: string;
  data?: PayOSData;
};

export type PayOSData = {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  expiredAt?: number;
  checkoutUrl?: string;
  qrCode: string;
};

export type PaymentHistory = {
  id: string;
  paymentId: string;
  status: string;
  changedBy: string;
  reason: string;
  createdAt: string;
};

// Order Filter DTO
export type OrderFilterDto = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: OrderStatus;
  shopId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// Paged Result
export type PagedResult<T> = {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

const DEFAULT_ERROR_MESSAGE = "Đã có lỗi xảy ra. Vui lòng thử lại sau.";

export function assertServiceSuccess<T>(
  response: ServiceResponse<T>,
  fallbackMessage: string = DEFAULT_ERROR_MESSAGE,
): T {
  const succeeded = Boolean(response?.Succeeded);
  const data = response?.Data;

  if (!succeeded || data === null || typeof data === "undefined") {
    const message = (response?.Message || fallbackMessage).trim();
    const error = new Error(message.length ? message : fallbackMessage);
    (error as any).serviceResponse = response;
    throw error;
  }

  return data;
}

