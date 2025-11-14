import { useQuery } from "@tanstack/react-query";
import globalCategoryService, { GetGlobalCategory } from "@/services/globalCategoryService";
import shopService, { GetShop } from "@/services/shopService";
import productService, { GetProduct } from "@/services/productService";

const CATEGORY_FALLBACK: Array<{ id: string; name: string; image?: string }> = [
  { id: "dress", name: "Váy", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop" },
  { id: "shoes", name: "Giày", image: "https://images.unsplash.com/photo-1520256862855-398228c41684?q=80&w=1200&auto=format&fit=crop" },
  { id: "bag", name: "Túi xách", image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0a1?q=80&w=1200&auto=format&fit=crop" },
];

export function useFeaturedCategories(limit = 3, region?: string) {
  return useQuery({
    queryKey: ["featuredCategories", limit, region],
    queryFn: async (): Promise<(GetGlobalCategory & { image?: string })[]> => {
      try {
        const cats = await globalCategoryService.getFeatured(limit, region);
        // backend có thể không có image, map thêm nếu cần
        return cats.map((c, i) => ({ ...c, image: CATEGORY_FALLBACK[i]?.image }));
      } catch {
        return CATEGORY_FALLBACK.slice(0, limit).map(c => ({ ...c } as any));
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useFeaturedShops(limit = 2, city?: string) {
  return useQuery({
    queryKey: ["featuredShops", limit, city],
    queryFn: async (): Promise<GetShop[]> => {
      return await shopService.getFeatured(limit, city);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useFeaturedProducts(
  limit = 4,
  opts?: { categoryId?: string; priceMin?: number; priceMax?: number }
) {
  return useQuery({
    queryKey: ["featuredProducts", limit, opts?.categoryId, opts?.priceMin, opts?.priceMax],
    queryFn: async (): Promise<GetProduct[]> => {
      return await productService.getFeatured(limit, opts);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}