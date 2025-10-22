import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateCategoryPage() {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();

  if (!initialized)
    return <div className="p-6">Đang khôi phục phiên người dùng...</div>;

  const sellerId = user?.id;

  const { data: shop } = useQuery({
    queryKey: ["shopBySeller", sellerId],
    queryFn: async () => {
      if (!sellerId) return null;
      return await fetchShopBySeller(sellerId);
    },
    enabled: !!sellerId,
  });

  const shopId = useMemo(() => {
    if (!shop) return null;
    if (Array.isArray(shop)) return shop[0]?.id || shop[0]?._id || null;
    return shop.id || shop._id || shop.shopId || null;
  }, [shop]);

  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!shopId) return alert("Không tìm thấy Shop. Vui lòng tạo Shop trước.");
  //   setLoading(true);
  //   try {
  //     await createCategory({ ...form, shopId });
  //     alert("Tạo category thành công");
  //     navigate("/seller/products");
  //   } catch (err: any) {
  //     alert(err?.response?.data?.message || "Tạo category thất bại");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="container py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Tạo Category mới</CardTitle>
        </CardHeader>
        <CardContent>
          {/* <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Tên category"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="Mô tả (tùy chọn)"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate("/seller/products")}
              >
                Thoát
              </Button>
              <Button type="submit" disabled={loading || !form.name}>
                {loading ? "Đang tạo..." : "Tạo Category"}
              </Button>
            </div>
          </form> */}
        </CardContent>
        <CardFooter>
          <div />
        </CardFooter>
      </Card>
    </div>
  );
}
