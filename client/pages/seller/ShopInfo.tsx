import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller, updateShop } from "@/lib/api";
import { Link as RouterLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Store } from "lucide-react";

export default function ShopInfo() {
  const { user, initialized } = useAuth();
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
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin cửa hàng đã được lưu.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.message || "Cập nhật thất bại",
        variant: "destructive",
      });
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

  if (!initialized) {
    return (
      <div className="p-6 text-center text-gray-500">
        Đang khôi phục phiên người dùng...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Store className="w-6 h-6 text-rose-500" />
        <h3 className="text-xl font-semibold text-gray-800">
          Thông tin Cửa hàng
        </h3>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Quản lý tên, mô tả và logo của Shop.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Section */}
        <div className="flex items-center gap-6 mb-6">
          <img
            src={form.logo || "/placeholder.svg"}
            alt={form.name || "Shop logo"}
            className="w-20 h-20 rounded-full border-2 border-gray-300 object-cover"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const url = prompt("Dán URL logo mới:");
              if (url) setForm((f) => ({ ...f, logo: url }));
            }}
          >
            Thay đổi Logo
          </Button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop-name" className="text-sm font-medium">
              Tên Shop
            </Label>
            <Input
              name="name"
              id="shop-name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nhập tên cửa hàng"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Mô tả Shop
            </Label>
            <Textarea
              name="description"
              id="description"
              rows={5}
              value={form.description}
              onChange={handleChange}
              placeholder="Mô tả về cửa hàng của bạn..."
            />
          </div>

          {/* Rating */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-yellow-500 font-semibold text-lg">
                {normalized?.averageRating || 0}
              </span>
              <span className="text-gray-400">/5.0</span>
              <span className="text-yellow-500">⭐</span>
              <span className="text-gray-500">Đánh giá trung bình</span>
              {normalized?.id || normalized?._id ? (
                <RouterLink
                  to={`/shops/${normalized.id || normalized._id}#reviews`}
                  className="ml-auto text-rose-600 hover:text-rose-700 font-medium underline"
                >
                  Xem chi tiết
                </RouterLink>
              ) : null}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            className="bg-rose-600 hover:bg-rose-700 text-white px-8"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
