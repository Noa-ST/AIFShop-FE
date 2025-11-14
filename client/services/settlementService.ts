import axiosClient from "@/services/axiosClient";
import {
  assertServiceSuccess,
  type ServiceResponse,
} from "@/services/types";

// Types
export type SettlementMethod = "BankTransfer" | "Cash";

export type SettlementStatus = 
  | "Pending" 
  | "Approved" 
  | "Processing" 
  | "Completed" 
  | "Cancelled" 
  | "Rejected";

export interface SellerBalanceDto {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalPendingWithdrawal: number;
}

export interface SettlementRequestDto {
  amount: number;
  method: SettlementMethod;
  bankAccount?: string;
  bankName?: string;
  accountHolderName?: string;
  notes?: string;
}

export interface SettlementDto {
  id: string;
  shopId: string;
  shopName?: string;
  amount: number;
  method: SettlementMethod;
  status: SettlementStatus;
  bankAccount?: string;
  bankName?: string;
  accountHolderName?: string;
  requestDate: string;
  approvedDate?: string;
  processedDate?: string;
  completedDate?: string;
  notes?: string;
}

export interface SettlementStatisticsDto {
  totalPending: number;
  totalApproved: number;
  totalProcessing: number;
  totalCompleted: number;
  totalAmountPending: number;
  totalAmountCompleted: number;
}

// Seller APIs
export const getMyBalance = async (): Promise<SellerBalanceDto> => {
  const response = await axiosClient.get<ServiceResponse<SellerBalanceDto>>(
    "/api/Settlement/my-balance"
  );
  return assertServiceSuccess(response.data, "Không thể tải số dư");
};

export const requestWithdrawal = async (
  request: SettlementRequestDto
): Promise<SettlementDto> => {
  const response = await axiosClient.post<ServiceResponse<SettlementDto>>(
    "/api/Settlement/request",
    request
  );
  return assertServiceSuccess(response.data, "Tạo yêu cầu giải ngân thất bại");
};

export const getMySettlements = async (
  status?: SettlementStatus
): Promise<SettlementDto[]> => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  
  const response = await axiosClient.get<ServiceResponse<SettlementDto[]>>(
    `/api/Settlement/my-settlements?${params.toString()}`
  );
  return assertServiceSuccess(response.data, "Không thể tải lịch sử giải ngân");
};

// Admin APIs
export const getPendingSettlements = async (): Promise<SettlementDto[]> => {
  const response = await axiosClient.get<ServiceResponse<SettlementDto[]>>(
    "/api/Settlement/admin/pending"
  );
  return assertServiceSuccess(response.data, "Không thể tải danh sách chờ duyệt");
};

export const approveSettlement = async (
  settlementId: string
): Promise<boolean> => {
  const response = await axiosClient.post<ServiceResponse<boolean>>(
    `/api/Settlement/admin/${settlementId}/approve`
  );
  return assertServiceSuccess(response.data, "Duyệt yêu cầu giải ngân thất bại");
};

export const processSettlement = async (
  settlementId: string
): Promise<boolean> => {
  const response = await axiosClient.post<ServiceResponse<boolean>>(
    `/api/Settlement/admin/${settlementId}/process`
  );
  return assertServiceSuccess(response.data, "Xử lý giải ngân thất bại");
};

export const completeSettlement = async (
  settlementId: string
): Promise<boolean> => {
  const response = await axiosClient.post<ServiceResponse<boolean>>(
    `/api/Settlement/admin/${settlementId}/complete`
  );
  return assertServiceSuccess(response.data, "Hoàn tất giải ngân thất bại");
};

export const rejectSettlement = async (
  settlementId: string,
  reason?: string
): Promise<boolean> => {
  const response = await axiosClient.post<ServiceResponse<boolean>>(
    `/api/Settlement/admin/${settlementId}/reject`,
    { reason }
  );
  return assertServiceSuccess(response.data, "Từ chối yêu cầu giải ngân thất bại");
};

export const getAllSettlements = async (
  status?: SettlementStatus
): Promise<SettlementDto[]> => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  
  const response = await axiosClient.get<ServiceResponse<SettlementDto[]>>(
    `/api/Settlement/admin/all?${params.toString()}`
  );
  return assertServiceSuccess(response.data, "Không thể tải danh sách giải ngân");
};

export const getSettlementStatistics = async (): Promise<SettlementStatisticsDto> => {
  const response = await axiosClient.get<ServiceResponse<SettlementStatisticsDto>>(
    "/api/Settlement/admin/statistics"
  );
  return assertServiceSuccess(response.data, "Không thể tải thống kê giải ngân");
};

// Helper: Format price in VND
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Helper: Get status label
export function getStatusLabel(status: SettlementStatus): string {
  const labels: Record<SettlementStatus, string> = {
    Pending: "Chờ duyệt",
    Approved: "Đã duyệt",
    Processing: "Đang xử lý",
    Completed: "Hoàn tất",
    Cancelled: "Đã hủy",
    Rejected: "Đã từ chối",
  };
  return labels[status] || status;
}

