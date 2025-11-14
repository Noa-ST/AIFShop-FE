// File: client/pages/seller/CreateShop.tsx

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
import { CascadeAddressSelect } from "@/components/CascadeAddressSelect";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createShop, fetchShopBySeller, isShopPresent } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
// Province list replaced by CascadeAddressSelect which fetches full VN admin data

export default function CreateShopPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [shopData, setShopData] = useState({
    name: "",
    description: "",
    logo: "",
    street: "",
    city: "",
  });
  const { user } = useAuth();
  // ✅ FIX: Lấy sellerId chính xác — fallback to localStorage when AuthContext hasn't initialized yet
  const sellerId = user?.id || localStorage.getItem("aifshop_userid") || null;

  // Sử dụng React Query để check shop - sử dụng cache từ SellerLayout
  const { data: existingShop } = useQuery({
    queryKey: ["shopBySeller", sellerId],
    queryFn: async () => {
      if (!sellerId) return null;
      return await fetchShopBySeller(sellerId);
    },
    enabled: !!sellerId,
    staleTime: 2 * 60 * 1000, // Cache 2 phút
  });

  // On mount: if seller already has shop, redirect to home
  useEffect(() => {
    if (isShopPresent(existingShop)) {
      // seller already has a shop; redirect to shop management
      navigate("/seller/shop-management");
    }
  }, [existingShop, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setShopData({ ...shopData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend Validation: Kiểm tra các trường bắt buộc
    if (!shopData.name.trim()) {
      alert("Vui lòng nhập tên cửa hàng");
      return;
    }
    if (!shopData.city.trim()) {
      alert("Vui lòng nhập thành phố");
      return;
    }
    if (!shopData.street.trim()) {
      alert("Vui lòng nhập địa chỉ đường");
      return;
    }

    if (!sellerId) {
      alert("Không xác định Seller ID. Vui lòng đăng nhập lại.");
      navigate("/login"); // Chuyển hướng nếu không có ID
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: shopData.name,
        description: shopData.description,
        logo: shopData.logo,
        street: shopData.street,
        city: shopData.city,
        sellerId, // Gửi Seller ID
      };

      console.log("Sending create shop request with payload:", payload);
      
      const res = await createShop(payload);
      
      console.log("Full API response:", res);
      console.log("Response type:", typeof res);
      console.log("Is array?", Array.isArray(res));
      
      // Handle different response formats
      let shop = null;
      if (res) {
        // Check if response has a data wrapper (common API pattern)
        if (res.data && (res.data.id || res.data.shopId || res.data._id || res.data.name)) {
          shop = res.data;
        } 
        // Check if response is the shop object directly
        else if (res.id || res.shopId || res._id || res.name) {
          shop = res;
        }
        // Check if response has succeeded flag with data
        else if (res.succeeded && res.data) {
          shop = res.data;
        }
      }
      
      console.log("Extracted shop object:", shop);
      
      // Invalidate cache để React Query tự động refetch shop data
      if (sellerId) {
        console.log("Invalidating shop cache and refetching...");
        // Invalidate cache và đợi refetch
        await queryClient.invalidateQueries({ queryKey: ["shopBySeller", sellerId] });
        
        // Đợi một chút để database commit và React Query refetch
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Refetch shop data từ cache (sẽ tự động gọi API nếu cần)
        const verifyShop = await queryClient.fetchQuery({
          queryKey: ["shopBySeller", sellerId],
          queryFn: async () => {
            return await fetchShopBySeller(sellerId);
          },
          staleTime: 0, // Force fetch mới
        });
        
        console.log("Verified shop from server:", verifyShop);
        
        if (isShopPresent(verifyShop)) {
          console.log("Shop verified successfully, redirecting...");
          navigate("/seller/shop-management");
          return;
        } else {
          console.warn("Shop not found after creation. Response was:", res);
          // Nếu có response từ API nhưng verify không thấy, vẫn navigate (có thể cache delay)
          if (shop || res) {
            console.log("Got success response but verification returned empty, navigating anyway...");
            navigate("/seller/shop-management");
            return;
          }
          alert("Shop được tạo nhưng không tìm thấy sau khi kiểm tra. Vui lòng refresh trang hoặc thử lại.");
          return;
        }
      }
      
      // Fallback: if we got a response but couldn't verify, still navigate
      if (shop || res) {
        console.log("Navigating to shop management with response:", res);
        // Invalidate cache để refresh khi vào shop management
        if (sellerId) {
          queryClient.invalidateQueries({ queryKey: ["shopBySeller", sellerId] });
        }
        navigate("/seller/shop-management");
      } else {
        throw new Error("Không nhận được dữ liệu shop từ server");
      }
    } catch (err: any) {
      // Xử lý lỗi từ Backend (Lỗi 400 Bad Request)
      console.error("Lỗi tạo Shop:", err);
      const status = err?.response?.status;
      const data = err?.response?.data;
      
      let msg = "Không thể tạo Shop";
      if (data?.message) {
        msg = data.message;
      } else if (typeof data === "string") {
        msg = data;
      } else if (err?.message) {
        msg = err.message;
      }
      
      if (status === 401 || status === 403) {
        msg += "\nVui lòng đăng nhập lại.";
        setTimeout(() => navigate("/login"), 2000);
      }
      
      alert(`Lỗi: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Basic guard: ~2.5MB limit
    if (file.size > 2.5 * 1024 * 1024) {
      alert("Ảnh quá lớn (tối đa ~2.5MB)");
      return;
    }
    const toBase64 = (f: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
    try {
      const base64 = await toBase64(file);
      setShopData((s) => ({ ...s, logo: base64 }));
    } catch (err) {
      console.error("Read image failed", err);
      alert("Không thể đọc ảnh. Vui lòng thử ảnh khác.");
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
              <Label htmlFor="description">Mô tả Cửa hàng</Label>
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
              <Label htmlFor="logoFile">Logo Shop (ảnh, tự chuyển sang Base64)</Label>
              <Input id="logoFile" type="file" accept="image/*" onChange={handleLogoFileChange} />
              {shopData.logo && (
                <div className="flex items-center gap-3">
                  <img
                    src={shopData.logo}
                    alt="Logo Preview"
                    className="w-16 h-16 object-cover rounded-full mt-2 border"
                  />
                  <Button type="button" variant="secondary" onClick={() => setShopData((s) => ({ ...s, logo: "" }))}>
                    Xóa logo
                  </Button>
                </div>
              )}
              <p className="text-xs text-slate-500">Hỗ trợ PNG/JPG, tối đa ~2.5MB. Ảnh sẽ được lưu dạng Base64.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Địa chỉ đường *</Label>
              <Input
                id="street"
                name="street"
                value={shopData.street}
                onChange={handleChange}
                required
                placeholder="Ví dụ: 123 Đường ABC, Phường XYZ"
              />
            </div>

            <div className="space-y-2">
              <Label>Tỉnh/Thành phố *</Label>
              <CascadeAddressSelect
                onChange={(addr) => {
                  // Only city (province name) is stored in Shop per API contract
                  setShopData((s) => ({ ...s, city: addr.labels.province || "" }));
                }}
              />
              {shopData.city && (
                <p className="text-xs text-slate-500">Đã chọn: {shopData.city}. Bạn có thể ghi phường/xã, quận/huyện vào trường địa chỉ phía trên nếu muốn.</p>
              )}
            </div>

            <CardFooter className="p-0 pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading ||
                  !shopData.name.trim() ||
                  !shopData.city.trim() ||
                  !shopData.street.trim()
                }
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
