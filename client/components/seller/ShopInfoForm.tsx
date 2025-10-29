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
import { Store, Star, Image as ImageIcon, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function ShopInfoForm() {
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

  const handleLogoChange = () => {
    const url = prompt("Dán URL logo mới:");
    if (url) setForm((f) => ({ ...f, logo: url }));
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e91e63] to-[#f43f5e] flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Thông tin Cửa hàng
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý tên, mô tả và logo của Shop.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-100"
        >
          <Label className="text-sm font-semibold text-gray-700 mb-4 block">
            Logo cửa hàng
          </Label>
          <div className="flex items-start sm:items-center gap-6 flex-wrap">
            <div className="relative group flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-[#e91e63] to-[#f43f5e] rounded-full blur-lg opacity-0 group-hover:opacity-30 transition-opacity" />
              <img
                src={form.logo || "/placeholder.svg"}
                alt={form.name || "Shop logo"}
                className="relative w-24 h-24 rounded-full border-4 border-white object-cover shadow-xl"
              />
              {!form.logo && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleLogoChange}
                className="border-2 border-gray-200 hover:border-[#e91e63] hover:text-[#e91e63] transition-colors mb-2"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Thay đổi Logo
              </Button>
              <p className="text-xs text-gray-500">
                Hỗ trợ JPG, PNG hoặc URL hình ảnh
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form Fields */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label
              htmlFor="shop-name"
              className="text-sm font-semibold text-gray-700"
            >
              Tên Shop <span className="text-red-500">*</span>
            </Label>
            <Input
              name="name"
              id="shop-name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nhập tên cửa hàng"
              required
              className="h-12 border-2 border-gray-200 focus:border-[#e91e63] focus:ring-[#e91e63]/20 rounded-xl transition-all"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <Label
              htmlFor="description"
              className="text-sm font-semibold text-gray-700"
            >
              Mô tả Shop
            </Label>
            <Textarea
              name="description"
              id="description"
              rows={5}
              value={form.description}
              onChange={handleChange}
              placeholder="Mô tả về cửa hàng của bạn..."
              className="border-2 border-gray-200 focus:border-[#e91e63] focus:ring-[#e91e63]/20 rounded-xl transition-all resize-none"
            />
          </motion.div>

          {/* Rating */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-xl border-2 border-amber-200"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-2xl font-bold text-amber-600">
                  {normalized?.averageRating?.toFixed(1) || "0.0"}
                </span>
                <span className="text-gray-500">/5.0</span>
              </div>
              <span className="text-gray-600">Đánh giá trung bình</span>
              {normalized?.id || normalized?._id ? (
                <RouterLink
                  to={`/shops/${normalized.id || normalized._id}#reviews`}
                  className="ml-auto text-[#e91e63] hover:text-[#d81b60] font-semibold underline underline-offset-4 transition-colors"
                >
                  Xem chi tiết →
                </RouterLink>
              ) : null}
            </div>
          </motion.div>
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end pt-4"
        >
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-12 px-8 rounded-full bg-gradient-to-r from-[#f43f5e] to-[#f97316] hover:from-[#e91e63] hover:to-[#f97316] text-white font-semibold shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? (
              <>Đang lưu...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
