import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller, fetchGlobalCategories } from "@/lib/api";
import productService, { type CreateProduct as CreateProductInput } from "@/services/productService";
import { ProductValidator } from "@/utils/productValidator";
import { ProductErrorHandler } from "@/utils/productErrorHandler";
import ProductImageUploader from "@/components/products/ProductImageUploader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { uploadBase64Images, isBase64Image } from "@/services/imageUploadService";

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
    staleTime: 5 * 60 * 1000, // Cache 5 phút - shop data không thay đổi thường xuyên
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch global categories for product category selection (seller now permitted)
  const { data: globalCategories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["globalCategories"],
    queryFn: fetchGlobalCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Flatten categories with hierarchy information for display
  const flatCategories = useMemo(() => {
    const out: Array<{ id: string; name: string; level: number; fullPath: string }> = [];
    const walk = (nodes: any[], level: number = 0, parentPath: string = "") => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        const categoryId = n?.id ?? n?._id ?? n?.value ?? String(out.length + 1);
        const categoryName = n?.name || n?.title || "Unnamed";
        const fullPath = parentPath ? `${parentPath} > ${categoryName}` : categoryName;
        
        out.push({
          id: categoryId,
          name: categoryName,
          level,
          fullPath,
        });
        
        if (n?.children && n.children.length) {
          walk(n.children, level + 1, fullPath);
        }
      }
    };
    walk(globalCategories as any[]);
    return out;
  }, [globalCategories]);


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
      toast({
        title: "Lỗi",
        description: "Không tìm thấy Shop. Vui lòng tạo Shop trước.",
        variant: "destructive",
      });
      return;
    }

    // Tách URL có sẵn và ảnh base64
    const existingUrls = (form.imageUrls || []).filter(
        (u) => typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"))
    );
    const base64Images = (form.imageUrls || []).filter(isBase64Image);

    setIsSubmitting(true);
    try {
      // Upload base64 -> nhận về URLs từ backend (Cloudinary/S3)
      let uploadedUrls: string[] = [];
      if (base64Images.length > 0) {
        uploadedUrls = await uploadBase64Images(base64Images);
      }

      const allImageUrls = [...existingUrls, ...uploadedUrls];

      const payload: CreateProductInput = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        shopId,
        categoryId: form.categoryId || "",
        imageUrls: allImageUrls.length > 0 ? allImageUrls : undefined,
      };

      // Validate using ProductValidator
      const validationErrors = ProductValidator.validateCreateProduct(payload);
      if (ProductValidator.hasErrors(validationErrors)) {
        const firstError = Object.values(validationErrors)[0];
        toast({
          title: "Lỗi validation",
          description: firstError,
          variant: "destructive",
        });
        return;
      }

      const result = await productService.create(payload);
      toast({
        title: "Thành công",
        description:
          result.message || "Đã tạo sản phẩm mới thành công! Đang chờ phê duyệt.",
      });
      // Delay navigation để user có thể thấy toast message
      setTimeout(() => {
        navigate("/seller/products");
      }, 1500);
    } catch (err: any) {
      const apiError = ProductErrorHandler.handleError(err);
      toast({
        title: "Lỗi",
        description: apiError.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Tạo sản phẩm mới</h1>
          </div>
          <p className="text-gray-600">Thêm sản phẩm mới vào shop của bạn</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Thông tin sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Tên sản phẩm *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nhập tên sản phẩm"
                    className="mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-sm font-medium">
                      Giá sản phẩm (VNĐ) *
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      step="1000"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="stockQuantity" className="text-sm font-medium">
                      Số lượng tồn kho *
                    </Label>
                    <Input
                      id="stockQuantity"
                      name="stockQuantity"
                      type="number"
                      value={form.stockQuantity}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Mô tả sản phẩm *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Mô tả chi tiết về sản phẩm..."
                    rows={4}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="categoryId" className="text-sm font-medium">
                    Danh mục (tùy chọn)
                  </Label>
                  <Select
                    value={form.categoryId || 'none'}
                    onValueChange={(value) =>
                      setForm(prev => ({ ...prev, categoryId: value === 'none' ? '' : value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="none">Không có danh mục</SelectItem>
                      {categoriesLoading ? (
                        <SelectItem value="loading" disabled>
                          Đang tải danh mục...
                        </SelectItem>
                      ) : categoriesError ? (
                        <SelectItem value="error" disabled>
                          Lỗi tải danh mục
                        </SelectItem>
                      ) : flatCategories.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Chưa có danh mục nào
                        </SelectItem>
                      ) : (
                        flatCategories.map((category) => {
                          const indentPadding = category.level * 16; // 16px per level
                          const Icon = category.level === 0 ? FolderOpen : ChevronRight;
                          
                          return (
                            <SelectItem 
                              key={category.id} 
                              value={category.id}
                            >
                              <div 
                                className="flex items-center gap-2" 
                                style={{ paddingLeft: `${indentPadding}px` }}
                              >
                                <Icon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{category.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  {form.categoryId && form.categoryId !== 'none' && flatCategories.length > 0 && (() => {
                    const selected = flatCategories.find(c => c.id === form.categoryId);
                    return selected && (
                      <p className="text-xs text-gray-500 mt-1">
                        Đường dẫn: {selected.fullPath}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Hình ảnh sản phẩm (tối đa 10 ảnh)
                </Label>
                <ProductImageUploader
                  onImagesChange={(images) => setForm(prev => ({ ...prev, imageUrls: images }))}
                  maxImages={10}
                  existingImages={form.imageUrls}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/seller/products")}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {isSubmitting ? "Đang tạo..." : "Tạo sản phẩm"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
