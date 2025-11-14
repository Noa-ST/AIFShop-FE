import axiosClient from '@/services/axiosClient';
import { ServiceResponse } from '@/services/types';

// Types matching API specification
export interface GetCartItemDto {
  productId: string;
  productName: string;
  shopId?: string; // Optional for backward compatibility
  shopName: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  imageUrl: string | null;
}

export interface GetCartDto {
  cartId: string;
  customerId: string;
  subTotal: number;
  items: GetCartItemDto[];
}

export interface AddCartItem {
  productId: string;
  quantity: number; // Min: 1
}

export interface UpdateCartItem {
  productId: string;
  quantity: number; // Min: 0 (0 = delete)
}

// Helper to normalize ServiceResponse (handle both camelCase and PascalCase)
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
  
  // Fallback
  return {
    Succeeded: true,
    Data: response as T,
    Message: null,
    StatusCode: 200,
  };
}

// Helper to normalize cart item (handle both camelCase and PascalCase from backend)
function normalizeCartItem(item: any): GetCartItemDto {
  return {
    productId: item.productId || item.ProductId || '',
    productName: item.productName || item.ProductName || '',
    shopId: item.shopId || item.ShopId || undefined, // ✅ Try both cases
    shopName: item.shopName || item.ShopName || '',
    quantity: item.quantity || item.Quantity || 0,
    unitPrice: item.unitPrice || item.UnitPrice || 0,
    itemTotal: item.itemTotal || item.ItemTotal || 0,
    imageUrl: item.imageUrl || item.ImageUrl || null,
  };
}

class CartService {
  // Get current cart
  async getCart(): Promise<ServiceResponse<GetCartDto>> {
    try {
      const response = await axiosClient.get('/api/Cart');
      
      // ✅ DEBUG: Log raw response to see actual structure
      console.log('=== RAW CART RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      
      // Check if items exist and their structure
      if (response.data?.data?.items || response.data?.Data?.items || response.data?.items) {
        const items = response.data?.data?.items || response.data?.Data?.items || response.data?.items;
        console.log('Raw items array:', items);
        if (items && items.length > 0) {
          console.log('First item structure:', items[0]);
          console.log('First item keys:', Object.keys(items[0] || {}));
          console.log('First item shopId fields:', {
            shopId: items[0]?.shopId,
            ShopId: items[0]?.ShopId,
            hasShopId: !!items[0]?.shopId,
            hasShopIdCapital: !!items[0]?.ShopId,
            productShopId: items[0]?.product?.shopId,
            ProductShopId: items[0]?.Product?.ShopId,
            fullItem: items[0],
          });
        }
      }
      
      const normalized = normalizeResponse<GetCartDto>(response.data);
      
      console.log('=== AFTER NORMALIZATION ===');
      console.log('Normalized data:', normalized.Data);
      if (normalized.Data?.items) {
        console.log('Normalized items:', normalized.Data.items);
        if (normalized.Data.items.length > 0) {
          console.log('First normalized item:', normalized.Data.items[0]);
          console.log('First normalized item shopId:', normalized.Data.items[0]?.shopId);
        }
      }
      
      // Normalize cart items to handle PascalCase fields from backend
      if (normalized.Data?.items && Array.isArray(normalized.Data.items)) {
        normalized.Data.items = normalized.Data.items.map((item: any, index: number) => {
          const normalizedItem = normalizeCartItem(item);
          console.log(`Item ${index} normalization:`, {
            originalShopId: item?.shopId || item?.ShopId,
            normalizedShopId: normalizedItem.shopId,
            shopIdFound: !!normalizedItem.shopId,
            originalKeys: Object.keys(item || {}),
          });
          return normalizedItem;
        });
      }
      
      // Also normalize cart-level fields (handle PascalCase)
      if (normalized.Data) {
        normalized.Data = {
          cartId: normalized.Data.cartId || (normalized.Data as any).CartId || '',
          customerId: normalized.Data.customerId || (normalized.Data as any).CustomerId || '',
          subTotal: normalized.Data.subTotal || (normalized.Data as any).SubTotal || 0,
          items: normalized.Data.items || [],
        };
      }
      
      console.log('=== FINAL RESULT ===');
      console.log('Final cart data:', normalized.Data);
      if (normalized.Data?.items) {
        normalized.Data.items.forEach((item, index) => {
          console.log(`Final item ${index} shopId:`, item.shopId);
        });
      }
      
      return normalized;
    } catch (error: any) {
      // Handle empty cart or 404 gracefully
      if (error.response?.status === 404) {
        return {
          Succeeded: true,
          Data: {
            cartId: '',
            customerId: '',
            subTotal: 0,
            items: [],
          } as GetCartDto,
          Message: 'Cart is empty',
          StatusCode: 200,
        };
      }
      throw error;
    }
  }

  // Add item to cart
  async addItem(item: AddCartItem): Promise<ServiceResponse<null>> {
    const response = await axiosClient.post('/api/Cart/add', item);
    return normalizeResponse<null>(response.data);
  }

  // Update item quantity
  async updateItem(item: UpdateCartItem): Promise<ServiceResponse<null>> {
    const response = await axiosClient.put('/api/Cart/update', item);
    return normalizeResponse<null>(response.data);
  }

  // Remove item from cart
  async removeItem(productId: string): Promise<ServiceResponse<null>> {
    const response = await axiosClient.delete(`/api/Cart/deleteItem/${productId}`);
    return normalizeResponse<null>(response.data);
  }

  // Clear cart
  async clearCart(): Promise<ServiceResponse<null>> {
    const response = await axiosClient.delete('/api/Cart/clear');
    return normalizeResponse<null>(response.data);
  }

  // Helper: Calculate total items count
  getTotalItemsCount(cart: GetCartDto | null): number {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Helper: Format price in VND
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }
}

export const cartService = new CartService();
export default cartService;

