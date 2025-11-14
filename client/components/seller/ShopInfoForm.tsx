import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller, updateShop } from "@/lib/api";
import { Link as RouterLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Store, Star, Image as ImageIcon, Save, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import { CascadeAddressSelect } from "@/components/CascadeAddressSelect";
import ImageUploader from "@/utils/imageUploader";

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
    staleTime: 5 * 60 * 1000, // Cache 5 phút - shop data không thay đổi thường xuyên
  });

  const normalized = shop && (Array.isArray(shop) ? shop[0] : shop);

  const [form, setForm] = useState({
    name: "",
    description: "",
    logo: "",
    street: "",
    city: "",
    country: "Việt Nam",
  });
  const [addrLabels, setAddrLabels] = useState<{ province?: string; district?: string; ward?: string }>({});
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (normalized) {
      setForm({
        name: normalized.name || "",
        description: normalized.description || "",
        logo: normalized.logo || "",
        street: normalized.street || "",
        city: normalized.city || "",
        country: normalized.country || "Việt Nam",
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
    // Compose full street with ward/district if provided via selector
    const ward = addrLabels.ward?.trim();
    const district = addrLabels.district?.trim();
    let composedStreet = form.street?.trim() || "";
    const partsToAppend = [ward, district].filter(Boolean);
    if (partsToAppend.length) {
      const exist = partsToAppend.every((p) => composedStreet.includes(String(p)));
      if (!exist) composedStreet = composedStreet ? `${composedStreet}, ${partsToAppend.join(", ")}` : partsToAppend.join(", ");
    }

    const payload = {
      ...form,
      street: composedStreet,
      id: normalized?.id || normalized?._id,
      sellerId,
    };
    mutation.mutate(payload);
  };

  // ✅ Handler cho upload logo file
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = ImageUploader.validateImage(file);
    if (!validation.valid) {
      toast({
        title: "Lỗi",
        description: validation.error || "File không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    setLogoUploading(true);
    try {
      // Compress image (optional - giảm kích thước)
      const compressedFile = await ImageUploader.compressImage(file, 800, 0.85); // Max width 800px, quality 85%
      
      // Convert to Base64
      const base64 = await ImageUploader.fileToBase64(compressedFile);
      
      setForm((f) => ({ ...f, logo: base64 }));
      toast({
        title: "Thành công",
        description: "Đã tải logo lên. Nhớ nhấn 'Lưu thay đổi' để lưu.",
      });
    } catch (err: any) {
      console.error("Error uploading logo:", err);
      toast({
        title: "Lỗi",
        description: "Không thể tải logo. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
      // Reset input để cho phép chọn lại cùng file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ✅ Handler cho paste URL logo
  const handleLogoUrlChange = () => {
    const url = prompt("Dán URL logo (hoặc để trống để hủy):");
    if (url && url.trim()) {
      setForm((f) => ({ ...f, logo: url.trim() }));
    }
  };

  // ✅ Handler để xóa logo
  const handleRemoveLogo = () => {
    setForm((f) => ({ ...f, logo: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      className="w-full"
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
              {form.logo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                  title="Xóa logo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {!form.logo && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleLogoFileChange}
                  disabled={logoUploading}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoUploading}
                  className="border-2 border-gray-200 hover:border-[#e91e63] hover:text-[#e91e63] transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {logoUploading ? "Đang tải..." : "Tải ảnh lên"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogoUrlChange}
                  disabled={logoUploading}
                  className="border-2 border-gray-200 hover:border-[#e91e63] hover:text-[#e91e63] transition-colors"
                >
                  Dán URL
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Hỗ trợ JPG, PNG hoặc URL hình ảnh. Tối đa 5MB.
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

          {/* Address - simple fields: street, city, country */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street" className="text-sm font-semibold text-gray-700">
                Địa chỉ đường
              </Label>
              <Input
                name="street"
                id="street"
                value={form.street}
                onChange={handleChange}
                placeholder="Số nhà + Tên đường, phường/xã, quận/huyện"
                className="h-12 border-2 border-gray-200 focus:border-[#e91e63] focus:ring-[#e91e63]/20 rounded-xl transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Tỉnh/Thành phố
              </Label>
              <CascadeAddressSelect
                onChange={(addr) => {
                  setForm((f) => ({ ...f, city: addr.labels.province || "" }));
                  setAddrLabels(addr.labels);
                }}
              />
              {form.city ? (
                <p className="text-xs text-slate-500">Đã chọn: {form.city}. Có thể ghi phường/xã, quận/huyện ở ô địa chỉ đường.</p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="country" className="text-sm font-semibold text-gray-700">
                Quốc gia
              </Label>
              <Input
                name="country"
                id="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Việt Nam"
                className="h-12 border-2 border-gray-200 focus:border-[#e91e63] focus:ring-[#e91e63]/20 rounded-xl transition-all"
              />
            </div>
          </motion.div>

          {/* Current address display */}
          <div className="text-xs text-slate-500 -mt-2">
            Địa chỉ hiện tại: {[
              form.street?.trim(),
              addrLabels.ward?.trim(),
              addrLabels.district?.trim(),
              form.city?.trim(),
              form.country?.trim(),
            ]
              .filter(Boolean)
              .join(", ") || "(chưa có)"}
          </div>

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
