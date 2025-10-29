import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchShopBySeller, createProduct, fetchGlobalCategories } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Upload, Package, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
      .catch(() => {
        toast({
          title: "Lỗi",
          description: "Không thể đọc file ảnh",
          variant: "destructive",
        });
      });
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
      toast({
        title: "Lỗi",
        description: "Không tìm thấy Shop. Vui lòng tạo Shop trước.",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!form.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên sản phẩm",
        variant: "destructive",
      });
      return;
    }
    if (!form.description.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mô tả sản phẩm",
        variant: "destructive",
      });
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập giá sản phẩm hợp lệ",
        variant: "destructive",
      });
      return;
    }
    if (!form.stockQuantity || Number(form.stockQuantity) < 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số lượng tồn kho hợp lệ",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      shopId,
      categoryId: form.categoryId || undefined,
      imageUrls: form.imageUrls,
    };

    // Debug: Log payload để kiểm tra
    console.log("Creating product with payload:", {
      ...payload,
      imageUrls: payload.imageUrls?.map(url => url.substring(0, 50) + "...") // Chỉ log preview của base64
    });

    try {
      await createProduct(payload);
      toast({
        title: "Thành công",
        description: "Đã tạo sản phẩm mới thành công!",
      });
      // Delay navigation để user có thể thấy toast message
      setTimeout(() => {
        navigate("/seller/products");
      }, 1000);
    } catch (err: any) {
      // Parse error response từ backend
      console.error("Full error response:", err?.response);
      console.error("Error data:", err?.response?.data);
      
      let errorMessage = "Tạo sản phẩm thất bại";
      
      if (err?.response?.data) {
        const errorData = err.response.data;
        
        // Nếu có validation errors (ModelState trong .NET)
        if (errorData.errors && typeof errorData.errors === 'object') {
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, messages]: [string, any]) => {
              const msgList = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgList.join(", ")}`;
            })
            .join(", ");
          errorMessage = validationErrors;
        }
        // Nếu có message trực tiếp
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Nếu là string
        else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
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
                  Hình ảnh sản phẩm (tối đa 5 ảnh)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-rose-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Kéo thả ảnh vào đây hoặc click để chọn
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Chọn ảnh
                  </Button>
                </div>

                {/* Image Preview */}
                {form.imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {form.imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
