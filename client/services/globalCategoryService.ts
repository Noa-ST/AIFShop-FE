import apiClient from "./axiosClient";

// Types
export interface GetGlobalCategory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string | null;
  isDeleted: boolean;
  parent?: GetGlobalCategory | null;
  children?: GetGlobalCategory[] | null;
}

export interface CreateGlobalCategory {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateGlobalCategory {
  name: string;
  description?: string;
  parentId?: string;
}

export interface ServiceResponse<T> {
  succeeded: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

class GlobalCategoryService {
  // Get all categories
  async getAll(includeChildren: boolean = true): Promise<ServiceResponse<GetGlobalCategory[]>> {
    const response = await apiClient.get(
      `/api/GlobalCategory/all?includeChildren=${includeChildren}`
    );
    return response.data;
  }

  // Get category by ID
  async getById(id: string): Promise<ServiceResponse<GetGlobalCategory>> {
    const response = await apiClient.get(`/api/GlobalCategory/${id}`);
    return response.data;
  }

  // Get categories by parent ID
  async getByParentId(parentId: string | null = null): Promise<ServiceResponse<GetGlobalCategory[]>> {
    const params = parentId ? `?parentId=${parentId}` : "";
    const response = await apiClient.get(`/api/GlobalCategory/by-parent${params}`);
    return response.data;
  }

  // Create category
  async create(category: CreateGlobalCategory): Promise<ServiceResponse<GetGlobalCategory>> {
    const response = await apiClient.post("/api/GlobalCategory/add", category);
    return response.data;
  }

  // Update category
  async update(id: string, category: UpdateGlobalCategory): Promise<ServiceResponse<boolean>> {
    const response = await apiClient.put(`/api/GlobalCategory/update/${id}`, category);
    return response.data;
  }

  // Delete category
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    const response = await apiClient.delete(`/api/GlobalCategory/delete/${id}`);
    return response.data;
  }

  // Get statistics (Admin only)
  async getStatistics(): Promise<ServiceResponse<any>> {
    const response = await apiClient.get("/api/GlobalCategory/admin/statistics");
    return response.data;
  }

  // Get descendant category IDs (optionally include self)
  async getDescendants(id: string, includeSelf: boolean = false): Promise<string[]> {
    try {
      const params = new URLSearchParams();
      params.append("includeSelf", String(includeSelf));
      const resp = await apiClient.get(
        `/api/GlobalCategory/${id}/descendants?${params.toString()}`,
      );
      const list = (resp.data?.data ?? resp.data) as any;
      if (Array.isArray(list)) return list as string[];
      // Some APIs may return { ids: [] }
      if (Array.isArray(list?.ids)) return list.ids as string[];
      return [];
    } catch {
      return [];
    }
  }

  // Helper: Build tree structure from flat array
  buildTree(categories: GetGlobalCategory[]): GetGlobalCategory[] {
    const categoryMap = new Map<string, GetGlobalCategory>();
    const roots: GetGlobalCategory[] = [];

    // Create map
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
  flattenTree(categories: GetGlobalCategory[]): GetGlobalCategory[] {
    const result: GetGlobalCategory[] = [];

    const flatten = (cats: GetGlobalCategory[]) => {
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
  getCategoryPath(categoryId: string, allCategories: GetGlobalCategory[]): GetGlobalCategory[] {
    const categoryMap = new Map<string, GetGlobalCategory>();
    allCategories.forEach((cat) => categoryMap.set(cat.id, cat));
    
    const path: GetGlobalCategory[] = [];
    let currentId: string | null = categoryId;
    
    while (currentId) {
      const category = categoryMap.get(currentId);
      if (!category) break;

      path.unshift(category);
      currentId = category.parentId;
    }

    return path;
  }

  async getFeatured(limit: number = 6, region?: string): Promise<GetGlobalCategory[]> {
      try {
          const params = new URLSearchParams();
          params.append('limit', String(limit));
          if (region) params.append('region', region);
          const resp = await apiClient.get(`/api/GlobalCategory/featured?${params.toString()}`);
          return (resp.data?.data ?? resp.data) as GetGlobalCategory[];
      } catch (e) {
          // Fallback: lấy tất cả (không children) rồi chọn top theo thứ tự
          const all = await this.getAll(false);
          return (all.data ?? []).slice(0, limit);
      }
  }
}

export const globalCategoryService = new GlobalCategoryService();
export default globalCategoryService;

