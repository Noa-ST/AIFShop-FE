import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createShop } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateShopPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [shopData, setShopData] = useState({
    name: "",
    description: "",
    logo: "",
  });
  const { user } = useAuth();
  const sellerId = user?.id || user?.id || null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setShopData({ ...shopData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopData.name) return;
    setIsLoading(true);

    try {
      const payload = {
        name: shopData.name,
        description: shopData.description,
        logo: shopData.logo,
        sellerId,
      };

      await createShop(payload);

      navigate("/seller/dashboard");
    } catch (error) {
      console.error("Lỗi tạo Shop:", error);
      alert("Lỗi: Không thể tạo Shop. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center text-rose-600">
            Chào mừng! Hãy tạo Cửa hàng của bạn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tên Cửa hàng *</Label>
              <Input
                id="name"
                name="name"
                value={shopData.name}
                onChange={handleChange}
                required
                placeholder="Ví dụ: CoolStyle Official"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả Cửa h��ng</Label>
              <Textarea
                id="description"
                name="description"
                value={shopData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Giới thiệu về thương hiệu, chính sách đổi trả..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Link Logo (URL)</Label>
              <Input
                id="logo"
                name="logo"
                value={shopData.logo}
                onChange={handleChange}
                placeholder="Dán URL hình ảnh logo của bạn"
              />
              {shopData.logo && (
                <img
                  src={shopData.logo}
                  alt="Logo Preview"
                  className="w-16 h-16 object-cover rounded-full mt-2 border"
                />
              )}
            </div>

            <CardFooter className="p-0 pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !shopData.name}
              >
                {isLoading ? "Đang tạo..." : "Tạo Shop và vào Dashboard"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
