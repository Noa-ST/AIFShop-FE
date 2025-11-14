import axiosClient from '@/services/axiosClient';

// Types
export enum ProductStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export interface ProductImage {
  id: string;
  url: string;
}

export interface GetProduct {
  id: string;
  shopId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  shopName: string | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string | null;
  status: ProductStatus;
  productImages: ProductImage[];
  shop: any;
  averageRating?: number;
  reviewCount?: number;
}

export interface GetProductDetail extends GetProduct {
  shopDescription: string | null;
  shopLogo: string | null;
  categoryDescription: string | null;
}

export interface CreateProduct {
  shopId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  imageUrls?: string[];
}

export interface UpdateProduct {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  status?: ProductStatus;
  imageUrls?: string[];
}

export interface ProductFilterDto {
  page?: number;
  pageSize?: number;
  keyword?: string;
  shopId?: string;
  categoryId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface UpdateStockDto {
  stockQuantity: number;
}

class ProductService {
  // Get all products
  async getAll(): Promise<GetProduct[]> {
    const response = await axiosClient.get('/api/Products/all');
    return response.data;
  }

  // Search and filter with pagination
  async searchAndFilter(filter: ProductFilterDto): Promise<PagedResult<GetProduct>> {
    const params = new URLSearchParams();
    
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.keyword) params.append('keyword', filter.keyword);
    if (filter.shopId) params.append('shopId', filter.shopId);
    if (filter.categoryId) params.append('categoryId', filter.categoryId);
    if (filter.status !== undefined) params.append('status', filter.status.toString());
    if (filter.minPrice) params.append('minPrice', filter.minPrice.toString());
    if (filter.maxPrice) params.append('maxPrice', filter.maxPrice.toString());
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.sortOrder) params.append('sortOrder', filter.sortOrder);

    const response = await axiosClient.get(`/api/Products/search?${params.toString()}`);
    return response.data;
  }

  // Get products by shop
  async getByShopId(shopId: string): Promise<GetProduct[]> {
    const response = await axiosClient.get(`/api/Products/getbyshop/${shopId}`);
    return response.data;
  }

  // Get products by category
  async getByCategoryId(categoryId: string): Promise<GetProduct[]> {
    const response = await axiosClient.get(`/api/Products/getbycategory/${categoryId}`);
    return response.data;
  }

  // Get product detail
  async getDetailById(id: string): Promise<GetProductDetail | null> {
    try {
      const response = await axiosClient.get(`/api/Products/detail/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Create product
  async create(product: CreateProduct): Promise<{ message: string }> {
    const response = await axiosClient.post('/api/Products/create', product);
    return response.data;
  }

  // Update product
  async update(id: string, product: UpdateProduct): Promise<{ succeeded: boolean; message: string }> {
    const response = await axiosClient.put(`/api/Products/update/${id}`, product);
    return response.data;
  }

  // Delete product (hard delete)
  async delete(id: string): Promise<{ message: string }> {
    const response = await axiosClient.delete(`/api/Products/${id}`);
    return response.data;
  }

  // Soft delete product
  async softDelete(id: string): Promise<{ message: string }> {
    const response = await axiosClient.put(`/api/Products/soft-delete/${id}`);
    return response.data;
  }

  // Update stock
  async updateStock(id: string, stockQuantity: number): Promise<{ succeeded: boolean; message: string }> {
    const response = await axiosClient.put(`/api/Products/${id}/stock`, {
      stockQuantity,
    });
    return response.data;
  }

  // Approve product (Admin only)
  async approve(id: string): Promise<{ succeeded: boolean; message: string }> {
    const response = await axiosClient.put(`/api/Products/approve/${id}`);
    return response.data;
  }

  // Reject product (Admin only)
  async reject(id: string, rejectionReason?: string): Promise<{ succeeded: boolean; message: string }> {
    const params = rejectionReason 
      ? `?rejectionReason=${encodeURIComponent(rejectionReason)}`
      : '';
    const response = await axiosClient.put(`/api/Products/reject/${id}${params}`);
    return response.data;
  }

  // Recalculate rating (Admin only)
  async recalculateRating(id: string): Promise<{ succeeded: boolean; message: string }> {
    const response = await axiosClient.post(`/api/Products/${id}/recalculate-rating`);
    return response.data;
  }

  // Get pending products (Admin only)
  async getPendingProducts(page: number = 1, pageSize: number = 20): Promise<PagedResult<GetProduct>> {
    const response = await axiosClient.get(
      `/api/Products/admin/pending?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  }

  // Get rejected products (Admin only)
  async getRejectedProducts(page: number = 1, pageSize: number = 20): Promise<PagedResult<GetProduct>> {
    const response = await axiosClient.get(
      `/api/Products/admin/rejected?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  }

  // Get statistics (Admin only)
  async getStatistics(): Promise<any> {
    const response = await axiosClient.get('/api/Products/admin/statistics');
    return response.data;
  }
  async getFeatured(
    limit: number = 12,
    opts?: { categoryId?: string; priceMin?: number; priceMax?: number }
  ): Promise<GetProduct[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      if (opts?.categoryId) params.append('categoryId', opts.categoryId);
      if (opts?.priceMin !== undefined) params.append('priceMin', String(opts.priceMin));
      if (opts?.priceMax !== undefined) params.append('priceMax', String(opts.priceMax));
      const resp = await axiosClient.get(`/api/Products/featured?${params.toString()}`);
      return (resp.data?.data ?? resp.data) as GetProduct[];
    } catch (e) {
      // Fallback: lấy tất cả rồi cắt theo limit
      const all = await this.getAll();
      return (Array.isArray(all) ? all : []).slice(0, limit);
    }
  }
}

export const productService = new ProductService();
export default productService;
