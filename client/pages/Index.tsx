import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import ShopCard from "@/components/ShopCard";
import { useEffect } from "react";
import eventsService from "@/services/eventsService";
import { useNavigate } from "react-router-dom";
import {
  useFeaturedCategories,
  useFeaturedShops,
  useFeaturedProducts,
} from "@/hooks/use-featured";

const heroImg =
  "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1600&auto=format&fit=crop";

// Dữ liệu động: Featured từ backend (có fallback trong hooks)
// Categories
// Shops
// Products

export default function Index() {
  const navigate = useNavigate();
  const { data: featuredCats = [], isLoading: loadingCats } = useFeaturedCategories(3);
  const { data: featuredShops = [], isLoading: loadingShops } = useFeaturedShops(2);
  const { data: featuredProducts = [], isLoading: loadingProducts } = useFeaturedProducts(4);

  useEffect(() => {
    // Tracking impressions cho danh mục động
    try {
      for (const c of featuredCats) {
        eventsService.trackImpression("category", (c as any).id);
      }
    } catch {}
  }, [featuredCats]);
  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="container mx-auto grid md:grid-cols-2 gap-10 py-16 md:py-24 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-serif text-4xl md:text-5xl leading-tight text-slate-900"
            >
              Khám phá bộ sưu tập mới
            </motion.h1>
            <p className="mt-4 text-slate-600 text-base md:text-lg max-w-xl">
              Phong cách tinh tế cho mùa mới. Chọn lựa những thiết kế thời
              thượng, chất liệu cao cấp và phom dáng hiện đại.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <a
                href="#featured"
                className="px-6 py-3 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
              >
                Mua ngay
              </a>
              <a
                href="/products"
                className="px-6 py-3 rounded-full border border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                Xem sản phẩm
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[24px] shadow-[0_40px_80px_-40px_rgba(225,29,72,0.35)]">
              <img
                src={heroImg}
                alt="Fashion hero"
                className="w-full h-[420px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10">
        <div className="container mx-auto">
          <h2 className="font-semibold text-xl mb-4">Danh mục nổi bật</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {(loadingCats ? Array.from({ length: 3 }) : featuredCats).map((c: any, i: number) => (
              <div
                key={c?.id ?? `cat-skeleton-${i}`}
                className="group relative overflow-hidden rounded-2xl"
                onClick={() => c?.id && eventsService.trackClick("category", c.id)}
              >
                <img
                  src={c?.image ?? "/placeholder.svg"}
                  alt={c?.name ?? "Danh mục"}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.src = "/placeholder.svg";
                    img.onerror = null;
                  }}
                  className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white font-medium">
                  {c?.name ?? "Đang tải..."}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shops */}
      <section className="py-16">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-xl">Cửa hàng nổi bật</h2>
            <a href="/shops" className="text-rose-600 hover:underline">
              Xem tất cả
            </a>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {(loadingShops ? [] : featuredShops).map((s: any) => (
              <ShopCard
                key={s.id}
                shop={s}
                onViewShop={(id) => navigate(`/shops/${id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="featured" className="py-16 bg-[#FFF7F9]">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-xl">Sản phẩm nổi bật</h2>
            <a href="/products" className="text-rose-600 hover:underline">
              Xem tất cả
            </a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(loadingProducts ? [] : featuredProducts).map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
