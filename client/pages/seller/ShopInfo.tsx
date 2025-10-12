import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller, updateShop } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ShopInfo() {
  const { user } = useAuth();
  const sellerId = user?.id;

  const { data: shop, isLoading } = useQuery({
    queryKey: ["shopBySeller", sellerId],
    queryFn: async () => {
      if (!sellerId) return null;
      return await fetchShopBySeller(sellerId);
    },
    enabled: !!sellerId,
  });

  const normalized = shop && (Array.isArray(shop) ? shop[0] : shop);

  const [form, setForm] = useState({
    name: "",
    description: "",
    logo: "",
  });

  // When shop data is loaded, initialize the form
  useEffect(() => {
    if (normalized) {
      setForm({
        name: normalized.name || "",
        description: normalized.description || "",
        logo: normalized.logo || "",
      });
    }
  }, [normalized]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      return await updateShop(payload);
    },
    onSuccess: () => {
      alert("Cập nhật Shop thành công");
      window.location.reload();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Cập nhật thất bại");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      id: normalized?.id || normalized?._id,
      sellerId,
    };
    mutation.mutate(payload);
  };

  if (isLoading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="container py-8 max-w-4xl">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl">Thông tin Cửa hàng</CardTitle>
          <CardDescription>
            Quản lý tên, mô tả và logo của Shop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-6">
              <img
                src={form.logo || "/placeholder.svg"}
                alt={form.name}
                className="w-20 h-20 rounded-full object-cover border"
              />
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = prompt("Dán URL logo mới:");
                    if (url) setForm((f) => ({ ...f, logo: url }));
                  }}
                >
                  Thay đổi Logo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Tên Shop *</label>
              <Input
                name="name"
                id="shop-name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Mô tả Shop</label>
              <Textarea
                name="description"
                id="description"
                rows={5}
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Đánh giá Trung bình
              </label>
              <div className="text-lg font-semibold text-amber-500">
                {normalized?.rating || 0} / 5.0 (Xem chi tiết...)
              </div>
            </div>

            <Button type="submit" className="w-full">
              Lưu Cập nhật
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
