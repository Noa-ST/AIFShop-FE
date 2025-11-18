import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchShopById, fetchProductsByShop } from "@/lib/api";
import { useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MessageCircle, Heart } from "lucide-react";

export default function ShopDetail() {
  const { id } = useParams();
  const { data: shop, isLoading: shopLoading, error: shopError } = useQuery({
    queryKey: ["shop", id],
    queryFn: () => fetchShopById(id as string),
    enabled: !!id,
  });
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["shopProducts", id],
    queryFn: () => fetchProductsByShop(id as string),
    enabled: !!id,
  });

  const provinceOrCity = useMemo(() => {
    const normalize = (s?: string) =>
      (s || "")
        .toLowerCase()
        .replace(/^tp\.?\s*/i, "")
        .replace(/^thành phố\s*/i, "")
        .replace(/^tỉnh\s*/i, "")
        .trim();
    const rawCity = (shop as any)?.city || "";
    if (rawCity) return rawCity;
    const last = (shop as any)?.location
      ?.split(",")
      .map((x: string) => x.trim())
      .filter(Boolean)
      .pop();
    if (!last) return "";
    const normalized = normalize(last);
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [shop]);

  if (shopLoading) return <div className="p-8">Đang tải shop...</div>;
  if (shopError)
    return <div className="p-8 text-red-500">Không tìm thấy shop</div>;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb đơn giản cho đồng bộ với trang sản phẩm */}
        <div className="mb-4 text-sm text-slate-600">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/shops" className="hover:underline">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium truncate inline-block max-w-[50ch] align-bottom">
            {(shop as any)?.name || "Chi tiết shop"}
          </span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border">
          <div className="p-4 sm:p-6">
            <div className="flex items-start sm:items-center gap-4">
              <img
                src={(shop as any)?.logo || (shop as any)?.logoUrl || "/placeholder.svg"}
                alt={(shop as any)?.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold leading-tight line-clamp-2" title={(shop as any)?.name}>
                  {(shop as any)?.name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  {provinceOrCity ? <span>{provinceOrCity}</span> : null}
                  {(shop as any)?.averageRating ? (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Star className="w-4 h-4" />
                      {Number((shop as any)?.averageRating).toFixed(1)}
                      { (shop as any)?.reviewCount ? ` (${(shop as any)?.reviewCount})` : "" }
                    </span>
                  ) : null}
                  {(shop as any)?.isActive ? <Badge variant="secondary">Đang hoạt động</Badge> : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-1" /> Chat
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4 mr-1" /> Theo dõi
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <Tabs defaultValue="products">
                <TabsList>
                  <TabsTrigger value="products">Sản phẩm</TabsTrigger>
                  <TabsTrigger value="about">Giới thiệu</TabsTrigger>
                  <TabsTrigger value="policies">Chính sách</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-4">
                  {productsLoading ? (
                    <div className="text-sm text-slate-500">Đang tải sản phẩm...</div>
                  ) : (
                    <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                      {Array.isArray(products) && products.length ? (
                        products.map((p: any) => (
                          <div key={p.id} className="h-full">
                            <ProductCard product={p} />
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-600">Không có sản phẩm</div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="about" className="mt-4">
                  <div className="prose max-w-none text-slate-700">
                    {(shop as any)?.description || "Chưa có mô tả."}
                  </div>
                </TabsContent>

                <TabsContent value="policies" className="mt-4">
                  <div className="prose max-w-none text-slate-700">
                    {(shop as any)?.policy || "Chưa có thông tin."}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
