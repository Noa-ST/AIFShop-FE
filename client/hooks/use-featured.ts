import { useQuery } from "@tanstack/react-query";
import globalCategoryService, { GetGlobalCategory } from "@/services/globalCategoryService";
import shopService, { GetShop } from "@/services/shopService";
import productService, { GetProduct } from "@/services/productService";
import { getProductImageUrl } from "@/utils/imageUrl";

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
        // Nếu BE không có ảnh cho Global Category, suy luận ảnh từ sản phẩm nổi bật của từng category
        const enhanced = await Promise.all(
          cats.map(async (c, i) => {
            let image: string | undefined = CATEGORY_FALLBACK[i]?.image;
            try {
              const products = await productService.getFeatured(1, { categoryId: c.id });
              const first = Array.isArray(products) && products.length > 0 ? products[0] : null;
              if (first) image = getProductImageUrl(first);
            } catch {
              // bỏ qua, dùng fallback nếu có
            }
            return { ...c, image };
          })
        );
        return enhanced;
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