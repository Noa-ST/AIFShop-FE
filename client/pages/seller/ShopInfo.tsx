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
import { Store, Upload, X, Star } from "lucide-react";
import { CascadeAddressSelect } from "@/components/CascadeAddressSelect";
import ImageUploader from "@/utils/imageUploader";
import ShopCard from "@/components/ShopCard";
import type { Shop } from "@/types/shop";

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
  const [isDragging, setIsDragging] = useState(false);

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

  // ✅ Core xử lý file logo (dùng cho upload & drag-drop)
  const uploadLogoFile = async (file: File) => {
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
      const compressedFile = await ImageUploader.compressImage(file, 800, 0.85);
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ✅ Handler cho upload logo file
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadLogoFile(file);
  };

  // ✅ Handler cho paste URL logo
  const handleLogoUrlChange = () => {
    const url = prompt("Dán URL logo (hoặc để trống để hủy):");
    if (url && url.trim()) {
      setForm((f) => ({ ...f, logo: url.trim() }));
    }
  };

  // ✅ Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDropLogo = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await uploadLogoFile(file);
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

  const MAX_DESC = 600;

  const handleReset = () => {
    // Khôi phục form theo dữ liệu đã tải (normalized)
    setForm((f) => ({
      ...f,
      name: normalized?.name || "",
      description: normalized?.description || "",
      logo: normalized?.logo || "",
      street: normalized?.street || normalized?.address?.street || "",
      city: normalized?.city || normalized?.address?.city || "",
      country: normalized?.country || normalized?.address?.country || "Việt Nam",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border shadow-sm p-6 animate-pulse space-y-6">
          <div className="h-6 w-40 bg-slate-200 rounded"></div>
          <div className="h-4 w-64 bg-slate-200 rounded"></div>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-10 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="h-10 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // ✅ Dữ liệu preview cho thẻ Shop ở sidebar
  const previewShop: Shop = {
    id: (normalized?.id as string) || (normalized?._id as string) || "preview",
    sellerId: sellerId || "",
    sellerName: user?.fullname || null,
    name: form.name || "Tên Shop",
    description: form.description || "",
    logo: form.logo || normalized?.logo || null,
    street: form.street || normalized?.street || "",
    city: form.city || normalized?.city || "",
    country: form.country || normalized?.country || "Việt Nam",
    averageRating: normalized?.averageRating || 0,
    reviewCount: normalized?.reviewCount || 0,
    createdAt: normalized?.createdAt || new Date().toISOString(),
    updatedAt: normalized?.updatedAt || null,
    status: "online",
  } as Shop;

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-6 h-6 text-rose-500" />
          <h3 className="text-xl font-semibold text-gray-800">Thông tin Cửa hàng</h3>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-6">
            Quản lý tên, mô tả và logo của Shop.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Section */}
          <div className="space-y-4 mb-6">
            <Label className="text-sm font-medium">Logo cửa hàng</Label>
            <div
              className={`flex items-center gap-6 p-4 rounded-lg border-2 ${isDragging ? 'border-rose-500 bg-rose-50' : 'border-dashed border-slate-200'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropLogo}
            >
              <div
                className="relative cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                title="Nhấn vào ảnh để thay logo"
              >
                <img
                  src={form.logo || "/placeholder.svg"}
                  alt={form.name || "Shop logo"}
                  className="w-20 h-20 rounded-full border-2 border-gray-200 object-cover ring-2 ring-rose-100"
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
                  Kéo & thả ảnh vào khu vực này hoặc nhấn vào avatar để chọn. Hỗ trợ JPG, PNG hoặc URL hình ảnh. Tối đa 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shop-name" className="text-sm font-medium">Tên Shop</Label>
                <span className="text-xs text-slate-400">
                  {(form.name?.length ?? 0)}/80
                </span>
              </div>
              <Input
                name="name"
                id="shop-name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nhập tên cửa hàng"
                required
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-sm font-medium">Mô tả Shop</Label>
                <span className="text-xs text-slate-400">
                  {(form.description?.length ?? 0)}/{MAX_DESC}
                </span>
              </div>
              <Textarea
                name="description"
                id="description"
                rows={5}
                value={form.description}
                onChange={handleChange}
                placeholder="Mô tả về cửa hàng của bạn..."
                maxLength={MAX_DESC}
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
                <Star className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                <span className="text-gray-700 font-medium">
                  {normalized?.averageRating || 0}
                </span>
                <span className="text-gray-400">/ 5.0</span>
                <span className="text-gray-500">Đánh giá trung bình</span>
                {(normalized?.id || normalized?._id) ? (
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
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={mutation.isPending}
            >
              Hoàn nguyên
            </Button>
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
      </div>
      {/* Sidebar preview */}
      <aside className="md:col-span-1">
        <div className="sticky top-24">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Xem trước thẻ Shop</h4>
          <ShopCard shop={previewShop} onViewShop={() => {}} onChat={() => {}} />
        </div>
      </aside>
    </div>
  );
}
