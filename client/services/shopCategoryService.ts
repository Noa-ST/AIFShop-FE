import axiosClient from '@/services/axiosClient';

// Types
export interface GetShopCategory {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string | null;
  isDeleted: boolean;
  parent?: GetShopCategory | null;
  children?: GetShopCategory[] | null;
}

export interface CreateShopCategory {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateShopCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
}

export interface ServiceResponse<T = any> {
  succeeded: boolean;
  message: string;
  data?: T;
  statusCode?: number;
}

class ShopCategoryService {
  // Get all shop categories (for current seller's shop)
  async getList(): Promise<ServiceResponse<GetShopCategory[]>> {
    const response = await axiosClient.get('/api/Seller/ShopCategory/list');
    return response.data;
  }

  // Get shop category by ID
  async getById(id: string): Promise<ServiceResponse<GetShopCategory>> {
    const response = await axiosClient.get(`/api/Seller/ShopCategory/${id}`);
    return response.data;
  }

  // Create shop category
  async create(category: CreateShopCategory): Promise<ServiceResponse<GetShopCategory>> {
    const response = await axiosClient.post('/api/Seller/ShopCategory/create', category);
    return response.data;
  }

  // Update shop category
  async update(id: string, category: UpdateShopCategory): Promise<ServiceResponse<boolean>> {
    const response = await axiosClient.put(`/api/Seller/ShopCategory/update/${id}`, category);
    return response.data;
  }

  // Delete shop category (soft delete)
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    const response = await axiosClient.delete(`/api/Seller/ShopCategory/delete/${id}`);
    return response.data;
  }

  // Helper: Build tree structure from flat array
  buildTree(categories: GetShopCategory[]): GetShopCategory[] {
    const categoryMap = new Map<string, GetShopCategory>();
    const roots: GetShopCategory[] = [];

    // Create map with children array
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build tree
    categories.forEach((cat) => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  // Helper: Flatten tree to array
  flattenTree(categories: GetShopCategory[]): GetShopCategory[] {
    const result: GetShopCategory[] = [];

    const flatten = (cats: GetShopCategory[]) => {
      cats.forEach((cat) => {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children);
        }
      });
    };

    flatten(categories);
    return result;
  }

  // Helper: Get category path (breadcrumb)
  getCategoryPath(categoryId: string, allCategories: GetShopCategory[]): GetShopCategory[] {
    const categoryMap = new Map<string, GetShopCategory>();
    allCategories.forEach((cat) => categoryMap.set(cat.id, cat));
    
    const path: GetShopCategory[] = [];
    let currentId: string | null = categoryId;
    
    while (currentId) {
      const category = categoryMap.get(currentId);
      if (!category) break;

      path.unshift(category);
      currentId = category.parentId;
    }

    return path;
  }
}

export const shopCategoryService = new ShopCategoryService();
export default shopCategoryService;

