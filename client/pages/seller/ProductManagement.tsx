import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Box, Edit, Trash2, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchShopBySeller,
  fetchProductsByShop,
  createCategory,
  createProduct,
} from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

export default function ProductManagement() {
  const { user, initialized } = useAuth();
  if (!initialized)
    return <div className="p-6">Đang khôi phục phiên người dùng...</div>;
  const sellerId = user?.id;
  const [query, setQuery] = useState("");

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

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["productsByShop", shopId],
    queryFn: async () => {
      if (!shopId) return [];
      return await fetchProductsByShop(shopId);
    },
    enabled: !!shopId,
  });

  const filtered = (products || []).filter((p: any) =>
    (p.name || "").toLowerCase().includes(query.toLowerCase()),
  );

  const queryClient = useQueryClient();

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    categoryId: "",
    imageUrls: "",
  });

  const categoryMutation = useMutation((payload: any) => createCategory(payload), {
    onSuccess: () => {
      alert("Tạo category thành công");
      queryClient.invalidateQueries(["categories"]);
      setShowCategoryForm(false);
      setCategoryForm({ name: "", description: "" });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Tạo category thất bại");
    },
  });

  const productMutation = useMutation((payload: any) => createProduct(payload), {
    onSuccess: () => {
      alert("Tạo sản phẩm thành công");
      queryClient.invalidateQueries(["productsByShop"]);
      queryClient.invalidateQueries(["products"]);
      setShowProductForm(false);
      setProductForm({ name: "", description: "", price: "", stockQuantity: "", categoryId: "", imageUrls: "" });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Tạo sản phẩm thất bại");
    },
  });

  const submitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return alert("Không tìm thấy Shop. Vui lòng tạo Shop trước.");
    const payload = { ...categoryForm, shopId };
    categoryMutation.mutate(payload);
  };

  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return alert("Không tìm thấy Shop. Vui lòng tạo Shop trước.");
    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price || 0),
      stockQuantity: Number(productForm.stockQuantity || 0),
      shopId,
      categoryId: productForm.categoryId || undefined,
      imageUrls: (productForm.imageUrls || "")
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean),
    };
    productMutation.mutate(payload);
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between mb-6">
        <div className="flex gap-2">
          <Button onClick={() => setShowProductForm((s) => !s)}>+ Tạo Sản phẩm</Button>
          <Button onClick={() => setShowCategoryForm((s) => !s)}>+ Tạo Category</Button>
        </div>
        <div className="flex gap-4">
          <Input
            placeholder="Tìm kiếm theo tên..."
            className="w-64"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Lọc
          </Button>
        </div>
      </div>

      {showCategoryForm && (
        <form onSubmit={submitCategory} className="mb-6 bg-white p-4 rounded">
          <h3 className="text-lg font-medium mb-2">Tạo Category mới</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Tên category"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
            <Input
              placeholder="Mô tả"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit">Tạo Category</Button>
            <Button variant="outline" onClick={() => setShowCategoryForm(false)}>Hủy</Button>
          </div>
        </form>
      )}

      {showProductForm && (
        <form onSubmit={submitProduct} className="mb-6 bg-white p-4 rounded">
          <h3 className="text-lg font-medium mb-2">Tạo Sản phẩm mới</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Tên sản phẩm" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            <Input placeholder="Giá" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
            <Input placeholder="Tồn kho" value={productForm.stockQuantity} onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })} />
            <Input placeholder="Category ID (tùy chọn)" value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} />
            <Input placeholder="Hình ảnh (URLs, cách nhau bằng ,)" value={productForm.imageUrls} onChange={(e) => setProductForm({ ...productForm, imageUrls: e.target.value })} />
            <Input placeholder="Mô tả ngắn" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit">Tạo Sản phẩm</Button>
            <Button variant="outline" onClick={() => setShowProductForm(false)}>Hủy</Button>
          </div>
        </form>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Ảnh</TableHead>
            <TableHead>Tên Sản phẩm</TableHead>
            <TableHead>Giá</TableHead>
            <TableHead>Tồn kho</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Đang tải...
              </TableCell>
            </TableRow>
          )}

          {filtered.map((product: any) => (
            <TableRow key={product.id || product._id}>
              <TableCell>
                <img
                  src={product.productImages?.[0]?.url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                />
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                {(product.price || 0).toLocaleString("vi-VN")}₫
              </TableCell>
              <TableCell>
                {product.stockQuantity ?? product.stock ?? 0}
              </TableCell>
              <TableCell>
                {product.status === 0
                  ? "Đang ho��t động"
                  : product.status === 1
                    ? "Bản nháp"
                    : String(product.status)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      ...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link
                      to={`/seller/products/edit/${product.id || product._id}`}
                    >
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa mềm
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

          {filtered.length === 0 && !isLoading && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Chưa có sản phẩm nào.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
