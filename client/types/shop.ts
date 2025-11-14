// Shop data types for ShopListPage
// This interface extends GetShop from shopService for backward compatibility
import { GetShop } from '@/services/shopService';

export interface Shop extends Omit<GetShop, 'sellerName'> {
  seller?: {
    id: string;
    fullname?: string;
    email: string;
  };
  isActive?: boolean;
  // Additional fields for display
  status?: 'online' | 'offline';
  yearsActive?: number;
  totalProducts?: number;
  location?: string;
}

export interface ShopListResponse {
  success: boolean;
  data: Shop[];
  message?: string;
}

export interface ShopDetailResponse {
  success: boolean;
  data: Shop;
  message?: string;
}

export interface ShopFilters {
  search?: string;
  category?: string;
  location?: string;
  minRating?: number;
  sortBy?: 'rating' | 'newest' | 'oldest' | 'name';
}

export interface ShopCardProps {
  shop: Shop;
  locale?: string;
  onViewShop?: (shopId: string) => void;
  onChat?: (shopId: string) => void;
  onAddToFavorites?: (shopId: string) => void;
}

export interface ShopListPageProps {
  locale?: string;
}
