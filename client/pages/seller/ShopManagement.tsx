import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ShopInfo from "./ShopInfo";
import ProductManagement from "./ProductManagement";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { updateCategory } from "@/lib/api";

export default function ShopManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleCreateCategory = async () => {
    const name = prompt("Tên category mới:");
    if (!name) return;
    const description = prompt("Mô tả (tùy chọn):") || "";
    const id =
      typeof crypto !== "undefined" && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : String(Date.now());
    try {
      await updateCategory(id, { name, description, id });
      alert("Tạo category thành công");
      try {
        queryClient.invalidateQueries(["categories"]);
      } catch (e) {}
    } catch (e: any) {
      alert(e?.response?.data?.message || "Tạo category thất bại");
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Quản lý Cửa hàng</h1>

      <Tabs defaultValue="shop-info">
        <TabsList className="grid w-full grid-cols-2 max-w-lg">
          <TabsTrigger value="shop-info">1. Thông tin Shop</TabsTrigger>
          <TabsTrigger value="products">2. Sản phẩm</TabsTrigger>
        </TabsList>

        <TabsContent value="shop-info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin Shop &amp; Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <ShopInfo />
            </CardContent>
            <CardFooter>
              <div />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
