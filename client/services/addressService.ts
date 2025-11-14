import axiosClient from "@/services/axiosClient";
import { ServiceResponse } from "@/services/types";

// ✅ Helper to normalize ServiceResponse (handle both camelCase and PascalCase)
function normalizeResponse<T>(response: any): ServiceResponse<T> {
  // Check if response is already in the correct format
  if (response?.succeeded !== undefined || response?.Succeeded !== undefined) {
    return {
      Succeeded: response.succeeded ?? response.Succeeded ?? false,
      Data: response.data ?? response.Data ?? null,
      Message: response.message ?? response.Message ?? null,
      StatusCode: response.statusCode ?? response.StatusCode ?? 200,
    };
  }
  
  // If response is wrapped in a data property
  if (response?.data) {
    return normalizeResponse(response.data);
  }
  
  // Fallback - handle case where API returns array directly
  if (Array.isArray(response)) {
    return {
      Succeeded: true,
      Data: response as T,
      Message: null,
      StatusCode: 200,
    };
  }
  
  // Final fallback
  return {
    Succeeded: true,
    Data: response as T,
    Message: null,
    StatusCode: 200,
  };
}

// Types matching API spec
export interface GetAddressDto {
  id: string; // GUID
  recipientName: string; // Required, max 100 chars - Tên người nhận
  phoneNumber: string; // Required - Số điện thoại (Vietnamese format)
  fullStreet: string; // Required, max 200 chars - Đường + Số nhà
  ward: string; // Required, max 100 chars - Phường/Xã
  district: string; // Required, max 100 chars - Quận/Huyện
  province: string; // Required, max 100 chars - Tỉnh/Thành phố
  country: string; // Required, max 50 chars - Default: "Việt Nam"
  isDefault: boolean; // Địa chỉ mặc định
}

export interface CreateAddress {
  recipientName: string; // Required, max 100 chars
  phoneNumber: string; // Required - Vietnamese phone: 0xxxxxxxxx hoặc +84xxxxxxxxx
  fullStreet: string; // Required, max 200 chars - "358/14/15 Nguyễn Thái Học"
  ward: string; // Required, max 100 chars - "Phường 12"
  district: string; // Required, max 100 chars - "Quận 5"
  province: string; // Required, max 100 chars - "TP. Hồ Chí Minh"
  country?: string; // Optional, default: "Việt Nam", max 50 chars
  isDefault?: boolean; // Optional, default: false
}

export interface UpdateAddress {
  id: string; // Required, GUID - Must match route id
  recipientName: string; // Required, max 100 chars
  phoneNumber: string; // Required - Vietnamese phone format
  fullStreet: string; // Required, max 200 chars
  ward: string; // Required, max 100 chars
  district: string; // Required, max 100 chars
  province: string; // Required, max 100 chars
  country?: string; // Optional, default: "Việt Nam"
  isDefault?: boolean; // Optional
}

class AddressService {
  // Get all user addresses
  async getList(): Promise<ServiceResponse<GetAddressDto[]>> {
    try {
      const response = await axiosClient.get("/api/Address/list");
      
      console.log("🌐 Raw API response:", response.data); // Debug log
      
      // ✅ Normalize response để handle cả camelCase và PascalCase
      const normalized = normalizeResponse<GetAddressDto[]>(response.data);
      
      console.log("🔄 Normalized response:", normalized); // Debug log
      
      // ✅ Return normalized response (empty array is valid)
      // Không reset empty array vì đó là valid state
      return normalized;
    } catch (error: any) {
      console.error("❌ Error in getList:", error);
      // Handle empty list (404) as valid empty response
      if (error.response?.status === 404) {
        return {
          Succeeded: true,
          Data: [],
          Message: null,
          StatusCode: 200,
        };
      }
      throw error;
    }
  }

  // Get address by ID
  async getById(id: string): Promise<ServiceResponse<GetAddressDto>> {
    const response = await axiosClient.get(`/api/Address/${id}`);
    return normalizeResponse<GetAddressDto>(response.data);
  }

  // Get default address
  async getDefault(): Promise<ServiceResponse<GetAddressDto>> {
    const response = await axiosClient.get("/api/Address/default");
    return normalizeResponse<GetAddressDto>(response.data);
  }

  // Create address
  async create(address: CreateAddress): Promise<ServiceResponse<void>> {
    console.log("📝 Creating address:", JSON.stringify(address, null, 2)); // Debug log với format đẹp
    try {
      const response = await axiosClient.post("/api/Address/create", address);
      console.log("📥 Create response (raw):", response.data); // Debug log
      const normalized = normalizeResponse<void>(response.data);
      console.log("🔄 Create normalized:", normalized); // Debug log
      
      // ✅ Check if response indicates success but might have warnings
      if (!normalized.Succeeded && normalized.Message) {
        console.warn("⚠️ Create returned Succeeded=false:", normalized.Message);
      }
      
      return normalized;
    } catch (error: any) {
      console.error("❌ Create error:", error);
      console.error("Error response data:", error?.response?.data);
      console.error("Error status:", error?.response?.status);
      throw error;
    }
  }

  // Update address
  async update(
    id: string,
    address: UpdateAddress
  ): Promise<ServiceResponse<void>> {
    const response = await axiosClient.put(`/api/Address/update/${id}`, address);
    return normalizeResponse<void>(response.data);
  }

  // Delete address
  async delete(id: string): Promise<ServiceResponse<void>> {
    const response = await axiosClient.delete(`/api/Address/delete/${id}`);
    return normalizeResponse<void>(response.data);
  }

  // Set default address
  async setDefault(id: string): Promise<ServiceResponse<void>> {
    const response = await axiosClient.put(`/api/Address/${id}/set-default`);
    return normalizeResponse<void>(response.data);
  }

  // Helper: Format full address string
  formatFullAddress(address: GetAddressDto): string {
    return `${address.fullStreet}, ${address.ward}, ${address.district}, ${address.province}, ${address.country}`;
  }
}

export const addressService = new AddressService();
export default addressService;

