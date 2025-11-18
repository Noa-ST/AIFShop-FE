import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchGlobalCategories } from "@/lib/api";
import productService, { type UpdateProduct as UpdateProductInput } from "@/services/productService";
import { ProductValidator, type ProductValidationErrors } from "@/utils/productValidator";
import { ProductErrorHandler } from "@/utils/productErrorHandler";
import ProductImageUploader from "@/components/products/ProductImageUploader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ChevronRight, Folder, FolderOpen, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { uploadBase64Images } from "@/services/imageUploadService";

export default function UpdateProduct() {
  const { id } = useParams<{ id: string }>();
  const { user, initialized } = useAuth();
  const navigate = useNavigate();

  if (!initialized)
    return <div className="p-6">Đang khôi phục phiên người dùng...</div>;

  // Fetch product details
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => (id ? productService.getDetailById(id) : null),
    enabled: !!id,
  });

  // Fetch global categories
  const {
    data: globalCategories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["globalCategories"],
    queryFn: fetchGlobalCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Flatten categories with hierarchy
  const flatCategories = useMemo(() => {
    const out: Array<{
      id: string;
      name: string;
      level: number;
      fullPath: string;
    }> = [];
    const walk = (nodes: any[], level: number = 0, parentPath: string = "") => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        const categoryId = n?.id ?? n?._id ?? n?.value ?? String(out.length + 1);
        const categoryName = n?.name || n?.title || "Unnamed";
        const fullPath = parentPath
          ? `${parentPath} > ${categoryName}`
          : categoryName;

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

  // Initialize form with product data
  const [form, setForm] = useState({
    name: "",
    price: "",
    stockQuantity: "",
    description: "",
    categoryId: "",
    imageUrls: [] as string[],
  });
  const [errors, setErrors] = useState<ProductValidationErrors>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Helper function to clean up malformed base64 URLs
  const cleanImageUrl = (url: string): string => {
    if (!url || typeof url !== 'string') return url;
    
    // ✅ If URL contains base64 but doesn't start with data:image/, it's malformed
    // Example: "https://localhost:7109data:image/webp;base64,..."
    if (url.includes('data:image/') && !url.startsWith('data:image/')) {
      // Extract base64 part using regex
      const base64Match = url.match(/data:image\/[^;]+;base64,[^\s"']+/);
      if (base64Match) {
        console.log("🧹 Cleaned malformed URL:", url.substring(0, 50) + "... → base64");
        return base64Match[0];
      }
    }
    return url;
  };

  // Populate form when product is loaded
  useEffect(() => {
    if (product) {
      console.log("Product data for update:", product);
      const p: any = product;
      
      // Extract categoryId - handle different possible field names
      const categoryId = 
        p.categoryId || 
        p.category?.id || 
        p.globalCategoryId || 
        "";
      
      // Extract images - handle different possible formats
      let imageUrls: string[] = [];
      if (p.productImages && Array.isArray(p.productImages)) {
        imageUrls = p.productImages.map((img: any) => {
          if (typeof img === 'string') {
            return cleanImageUrl(img);
          }
          const url = img.url || img.imageUrl || img.src || img;
          return cleanImageUrl(url);
        }).filter(Boolean);
      } else if (p.imageUrls && Array.isArray(p.imageUrls)) {
        imageUrls = p.imageUrls.map(cleanImageUrl);
      }
      
      console.log("Extracted categoryId:", categoryId);
      console.log("Extracted imageUrls:", imageUrls);
      
      setForm({
        name: p.name || "",
        price: String(p.price || 0),
        stockQuantity: String(p.stockQuantity || 0),
        description: p.description || "",
        categoryId: categoryId,
        imageUrls: imageUrls,
      });
    }
  }, [product]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target as any;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy ID sản phẩm",
        variant: "destructive",
      });
      return;
    }

    const cleanedImageUrls = form.imageUrls.map(cleanImageUrl);

    const existingUrls = cleanedImageUrls.filter((img: string) => {
      if (!img) return false;
      if (img.startsWith("http://") || img.startsWith("https://")) {
        return !img.includes("data:image/");
      }
      return false;
    });

    const newBase64Images = cleanedImageUrls.filter(
      (img: string) => typeof img === "string" && img.startsWith("data:image/")
    );

    setIsSubmitting(true);
    try {
      // Tiền upload ảnh base64 để lấy URL từ backend
      let uploadedUrls: string[] = [];
      if (newBase64Images.length > 0) {
        try {
          uploadedUrls = await uploadBase64Images(newBase64Images);
        } catch (uploadErr: any) {
          const msg = uploadErr?.response?.data?.message || uploadErr?.message || "Upload ảnh thất bại";
          toast({ title: "Lỗi upload ảnh", description: msg, variant: "destructive" });
          return;
        }
      }
      const allImageUrls = [...existingUrls, ...uploadedUrls];

      const payload: UpdateProductInput = {
        categoryId: form.categoryId || "",
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        imageUrls: allImageUrls.length > 0 ? allImageUrls : undefined,
      };

    console.log("📦 Update payload:", {
      ...payload,
      imageUrls: payload.imageUrls ? `${payload.imageUrls.length} images` : "none"
    });

    // Validate using ProductValidator
    const validationErrors = ProductValidator.validateUpdateProduct(payload);
    setErrors(validationErrors);
    if (ProductValidator.hasErrors(validationErrors)) {
      const firstError = Object.values(validationErrors)[0];
      toast({
        title: "Lỗi validation",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await productService.update(id, payload);
      toast({
        title: "Thành công",
        description: result.message || "Cập nhật sản phẩm thành công!",
      });
      setTimeout(() => {
        navigate("/seller/products");
      }, 1500);
    } catch (err: any) {
      console.error("❌ Update product error:", err);
      const apiError = ProductErrorHandler.handleError(err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.title ||
        apiError.message ||
        "Không thể cập nhật sản phẩm";
      toast({ title: "Lỗi", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  } catch (err: any) {
    console.error("❌ Update product error:", err);
    const apiError = ProductErrorHandler.handleError(err);
    const errorMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.response?.data?.title ||
      apiError.message ||
      "Không thể cập nhật sản phẩm";
    toast({ title: "Lỗi", description: errorMessage, variant: "destructive" });
  } finally {
    setIsSubmitting(false);
  }
};
  

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-rose-600" />
          <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Alert variant="destructive">
            <AlertDescription>
              {productError
                ? "Không thể tải thông tin sản phẩm"
                : "Không tìm thấy sản phẩm"}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => navigate("/seller/products")}
            className="mt-4"
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Cập nhật sản phẩm
            </h1>
          </div>
          <p className="text-gray-600">Chỉnh sửa thông tin sản phẩm của bạn</p>
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
                    maxLength={200}
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
                    <Label
                      htmlFor="stockQuantity"
                      className="text-sm font-medium"
                    >
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
                    Mô tả sản phẩm
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Mô tả chi tiết về sản phẩm..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="categoryId" className="text-sm font-medium">
                    Danh mục *
                  </Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, categoryId: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {/* Bỏ tùy chọn 'Không có danh mục' để khớp với validator */}
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
                          const indentPadding = category.level * 16;
                          const Icon = category.level === 0 ? FolderOpen : ChevronRight;

                          return (
                            <SelectItem key={category.id} value={category.id}>
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
                  {errors.categoryId && (
                    <p className="text-sm text-red-600 mt-1">{errors.categoryId}</p>
                  )}

                  {/* Hiển thị đường dẫn danh mục đã chọn, hoặc tên danh mục hiện có nếu không khớp danh sách */}
                  {(() => {
                    const selected = flatCategories.find((c) => c.id === form.categoryId);
                    return selected ? (
                      <p className="text-xs text-gray-500 mt-1">
                        Đang chọn: {selected.fullPath}
                      </p>
                    ) : product?.categoryName ? (
                      <p className="text-xs text-amber-600 mt-1">
                        Danh mục hiện tại: {product.categoryName} (không có trong danh sách hiển thị)
                      </p>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Hình ảnh sản phẩm (tối đa 10 ảnh)
                </Label>
                <ProductImageUploader
                  onImagesChange={(images) =>
                    setForm((prev) => ({ ...prev, imageUrls: images }))
                  }
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    "Cập nhật sản phẩm"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
