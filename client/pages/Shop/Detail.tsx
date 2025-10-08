import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchShopById, fetchProductsByShop } from "@/lib/api";
import { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import ProductCard from "@/components/ProductCard";

export default function ShopDetail() {
  const { id } = useParams();
  const { data: shop, isLoading: shopLoading, error: shopError } = useQuery({ queryKey: ["shop", id], queryFn: () => fetchShopById(id as string), enabled: !!id });
  const { data: products, isLoading: productsLoading } = useQuery({ queryKey: ["shopProducts", id], queryFn: () => fetchProductsByShop(id as string), enabled: !!id });
  const [tabIndex, setTabIndex] = useState(0);

  if (shopLoading) return <div className="p-8">Đang tải shop...</div>;
  if (shopError) return <div className="p-8 text-red-500">Không tìm thấy shop</div>;

  return (
    <section className="py-12">
      <div className="container mx-auto">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="h-48 bg-slate-200">
            <img src={shop?.coverImage || shop?.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1600&auto=format&fit=crop"} alt={shop?.name} className="w-full h-full object-cover" />
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <img src={shop?.logo || shop?.logoUrl} alt={shop?.name} className="w-20 h-20 rounded-full object-cover" />
              <div>
                <h1 className="text-2xl font-semibold">{shop?.name}</h1>
                <p className="text-sm text-slate-600">{shop?.sellerName || shop?.ownerName}</p>
              </div>
            </div>

            <div className="mt-6">
              <Tabs index={tabIndex} onChange={(i) => setTabIndex(i)}>
                <TabList className="border-b">
                  <Tab>Sản phẩm</Tab>
                  <Tab>Thông tin cửa hàng</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    {productsLoading && <p>Đang tải sản phẩm...</p>}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {products && products.length ? products.map((p: any) => <ProductCard key={p.id} product={{ id: p.id, name: p.name || p.title, price: p.price || 0, image: p.imageUrl || p.image || "/public/placeholder.svg" }} />) : <p className="text-slate-600">Không có sản phẩm</p>}
                    </div>
                  </TabPanel>
                  <TabPanel>
                    <div className="prose max-w-none">
                      <h3>Giới thiệu</h3>
                      <p>{shop?.description}</p>
                      <h4 className="mt-4">Chính sách</h4>
                      <p>{shop?.policy || "Chưa có thông tin"}</p>
                    </div>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
