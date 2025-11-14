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
import { Store, Upload, X } from "lucide-react";
import { CascadeAddressSelect } from "@/components/CascadeAddressSelect";
import ImageUploader from "@/utils/imageUploader";

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
        <div className="space-y-4 mb-6">
          <Label className="text-sm font-medium">Logo cửa hàng</Label>
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={form.logo || "/placeholder.svg"}
                alt={form.name || "Shop logo"}
                className="w-20 h-20 rounded-full border-2 border-gray-300 object-cover"
              />
              {form.logo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Xóa logo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
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
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {logoUploading ? "Đang tải..." : "Tải ảnh lên"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogoUrlChange}
                  disabled={logoUploading}
                >
                  Dán URL
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Hỗ trợ JPG, PNG hoặc URL hình ảnh. Tối đa 5MB.
              </p>
            </div>
          </div>
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

          {/* Address - Shop uses street, city, country (simple) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street" className="text-sm font-medium">
                Địa chỉ đường
              </Label>
              <Input
                name="street"
                id="street"
                value={form.street}
                onChange={handleChange}
                placeholder="Số nhà + Tên đường, phường/xã, quận/huyện"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tỉnh/Thành phố</Label>
              <CascadeAddressSelect
                onChange={(addr) => {
                  // Shop stores only province name as city
                  setForm((f) => ({ ...f, city: addr.labels.province || "" }));
                }}
              />
              {form.city ? (
                <p className="text-xs text-slate-500">Đã chọn: {form.city}. Có thể ghi phường/xã, quận/huyện ở ô địa chỉ đường.</p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="country" className="text-sm font-medium">
                Quốc gia
              </Label>
              <Input
                name="country"
                id="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Việt Nam"
              />
            </div>
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
