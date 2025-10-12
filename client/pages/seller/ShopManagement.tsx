import { useAuth } from "@/contexts/AuthContext";
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

export default function ShopManagement() {
  const { user } = useAuth();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Quản lý Cửa hàng</h1>

      <Tabs defaultValue="shop-info">
        <TabsList className="grid w-full grid-cols-2 max-w-lg">
          <TabsTrigger value="shop-info">1. Thông tin Shop</TabsTrigger>
          <TabsTrigger value="products">2. Quản lý Sản phẩm</TabsTrigger>
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
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Danh sách Sản phẩm</CardTitle>
              <div>
                <Button asChild>
                  <a href="/seller/products/create">+ Tạo Sản phẩm mới</a>
                </Button>
              </div>
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
