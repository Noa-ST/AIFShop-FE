import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ShopInfo from "@/pages/Seller/ShopInfo";

export default function ProfilePage() {
  const { user } = useAuth();
  const isSeller = user?.role === "Seller";

  const [tab, setTab] = useState("info");

  useEffect(() => {
    if (isSeller && tab === "orders") setTab("info");
  }, [isSeller]);

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Hồ sơ cá nhân</h1>

      <Tabs defaultValue={tab} onValueChange={(v) => setTab(v)}>
        <TabsList
          className="grid w-full mb-6"
          style={{
            gridTemplateColumns: isSeller ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          }}
        >
          <TabsTrigger value="info">Thông tin cơ bản</TabsTrigger>
          <TabsTrigger value="secondary">
            {isSeller ? "Thông tin Shop" : "Địa chỉ giao hàng"}
          </TabsTrigger>
          {!isSeller && (
            <TabsTrigger value="orders">Đơn hàng của tôi</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="info">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Cập nhật thông tin</h2>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                placeholder="Họ và tên"
                defaultValue={user?.fullname || ""}
              />
              <Input
                placeholder="Email"
                defaultValue={user?.email || ""}
                disabled
              />
              <Input placeholder="Số điện thoại" defaultValue={""} />
              <Input type="date" placeholder="Ngày sinh" />
              <div className="md:col-span-2 flex justify-end">
                <Button className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6]">
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="secondary">
          {isSeller ? (
            <ShopInfo />
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Địa chỉ nhận hàng</h2>
                <Button variant="outline">+ Thêm địa chỉ mới</Button>
              </div>
              <div className="border p-4 rounded-md">
                <p className="font-semibold">Địa chỉ mặc định</p>
                <p>Nguyễn Văn A | 090xxxxxxx</p>
                <p>Số nhà 123, đường XYZ, Phường, Quận, Thành phố</p>
                <div className="mt-2 space-x-2">
                  <Button>Chỉnh sửa</Button>
                  <Button variant="outline">Xóa</Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {!isSeller && (
          <TabsContent value="orders">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Lịch sử đơn hàng</h2>
              <div className="border p-4 rounded-md">
                <p>Không có đơn hàng.</p>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
