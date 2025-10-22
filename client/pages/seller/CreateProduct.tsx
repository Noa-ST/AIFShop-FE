import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller, createProduct } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

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
    categoryId: "",
    imageUrls: [] as string[],
  });

  // const { data: categories = [] } = useQuery({
  //   queryKey: ["categoriesByShop", shopId],
  //   queryFn: async () => {
  //     if (!shopId) return [];
  //     return await fetchCategoriesByShop(shopId);
  //   },
  //   enabled: !!shopId,
  // });

  // Handle file uploads (convert to base64 data urls) as fallback if backend doesn't accept file uploads
  const handleFiles = (files?: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).slice(0, 5);
    const readers = list.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = (e) => reject(e);
        fr.readAsDataURL(file);
      });
    });
    Promise.all(readers)
      .then((urls) => setForm((f) => ({ ...f, imageUrls: urls })))
      .catch(() => alert("Không thể đọc file ảnh"));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target as any;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) {
      alert("Không tìm thấy Shop. Vui lòng tạo Shop trước.");
      return;
    }
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price || 0),
      stockQuantity: Number(form.stockQuantity || 0),
      shopId,
      categoryId: form.categoryId || undefined,
      imageUrls: form.imageUrls,
    };

    try {
      await createProduct(payload);
      alert("Tạo sản phẩm thành công");
      navigate("/seller/products");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Tạo sản phẩm thất bại");
    }
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
              value={(form as any).stockQuantity}
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

        {/* <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Chọn category (tùy chọn) --</option>
            {categories.map((c: any) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div> */}

        <div>
          <label className="block text-sm font-medium mb-1">
            Hình ảnh (tối đa 5 ảnh)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="mt-2 flex gap-2 flex-wrap">
            {form.imageUrls.map((u: string, idx: number) => (
              <img
                key={idx}
                src={u}
                className="w-20 h-20 object-cover rounded"
                alt={`img-${idx}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/seller/products")}
          >
            Thoát
          </Button>
          <Button type="submit">Tạo sản phẩm</Button>
        </div>
      </form>
    </div>
  );
}
