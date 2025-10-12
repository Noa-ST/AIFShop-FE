import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller, createProduct } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function CreateProduct() {
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

  const [form, setForm] = useState({
    name: "",
    price: "",
    stockQuantity: "",
    description: "",
    images: "",
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => await createProduct(payload),
    onSuccess: () => {
      navigate("/seller/products");
    },
    onError: (err: any) =>
      alert(err?.response?.data?.message || "Tạo sản phẩm thất bại"),
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) {
      alert("Không tìm thấy Shop. Vui lòng tạo Shop trước.");
      return;
    }
    const payload = {
      name: form.name,
      price: Number(form.price || 0),
      stockQuantity: Number(form.stockQuantity || 0),
      description: form.description,
      productImages: (form.images || "")
        .split(",")
        .map((u) => ({ url: u.trim() }))
        .filter((u) => u.url),
      shopId,
    };
    mutation.mutate(payload);
  };

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Tạo Sản phẩm mới</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-2xl shadow"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
          <Input name="name" value={form.name} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Giá</label>
            <Input name="price" value={form.price} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tồn kho</label>
            <Input
              name="stockQuantity"
              value={form.stockQuantity}
              onChange={handleChange}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <Textarea
            name="description"
            rows={6}
            value={form.description}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Hình ảnh (URL, cách nhau bằng ,)
          </label>
          <Input name="images" value={form.images} onChange={handleChange} />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Tạo sản phẩm</Button>
        </div>
      </form>
    </div>
  );
}
