import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Edit,
  Trash2,
  Filter,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Tag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api, {
  fetchShopBySeller,
  fetchProductsByShop,
  softDeleteProduct,
} from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { getProductImageUrl } from "@/utils/imageUrl";

export default function ProductManagement() {
  const { user, initialized } = useAuth();
  if (!initialized)
    return (
      <div className="p-6 text-center text-gray-500">
        Đang khôi phục phiên người dùng...
      </div>
    );
  const sellerId = user?.id;
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["productsByShop", shopId],
    queryFn: async () => {
      if (!shopId) return [];
      const response = await fetchProductsByShop(shopId);
      // Unwrap nested data if needed
      const productsList = response?.data || response || [];
      
      // Debug: Log status của các sản phẩm
      if (process.env.NODE_ENV === 'development' && productsList.length > 0) {
        console.log("=== Product Status Debug ===");
        productsList.forEach((p: any, idx: number) => {
          console.log(`Product ${idx + 1} (${p.name?.substring(0, 30)}...):`, {
            status: p.status,
            statusType: typeof p.status,
            isApproved: p.isApproved,
            isActive: p.isActive,
          });
        });
      }
      
      return productsList;
    },
    enabled: !!shopId,
  });

  // Fetch shop categories
  const { data: shopCategories = [] } = useQuery({
    queryKey: ["shopCategories", shopId],
    queryFn: async () => {
      if (!shopId) return [];
      try {
        const res = await api.get(`/api/Seller/ShopCategory/list`);
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!shopId,
  });

  // Flatten nested shop categories to support filtering by any depth
  const flatShopCategories = useMemo(() => {
    const result: Array<{ id: string; name: string; fullPath: string }> = [];

    const normalizeId = (node: any): string => String(node?.id ?? node?._id ?? node?.categoryId ?? node?.value ?? "");
    const normalizeName = (node: any): string => String(node?.name ?? node?.label ?? node?.title ?? "");

    const getChildren = (node: any): any[] =>
      (node?.children ?? node?.subCategories ?? node?.subs ?? node?.items ?? []) as any[];

    const walk = (node: any, parentPath: string) => {
      const id = normalizeId(node);
      const name = normalizeName(node);
      if (!id || !name) return;
      const fullPath = parentPath ? `${parentPath} / ${name}` : name;
      result.push({ id, name, fullPath });
      const kids = getChildren(node);
      if (Array.isArray(kids) && kids.length) {
        for (const child of kids) walk(child, fullPath);
      }
    };

    const list = Array.isArray(shopCategories) ? shopCategories : [];
    for (const node of list) walk(node, "");
    return result;
  }, [shopCategories]);

  const filtered = useMemo(() => {
    let result = (products || []).filter((p: any) =>
      (p.name || "").toLowerCase().includes(query.toLowerCase()),
    );

    // Filter by category
    if (categoryFilter && categoryFilter !== "all") {
      result = result.filter((p: any) => {
        const productCategoryId = p.categoryId || p.category?.id || p.categoryId;
        return String(productCategoryId) === String(categoryFilter);
      });
    }

    return result;
  }, [products, query, categoryFilter]);

  // Helper function để lấy ảnh sản phẩm (dùng tiện ích chung)
  const getProductImage = (product: any): string => {
    return getProductImageUrl(product);
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteProduct(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData(["productsByShop", shopId], (old: any) => {
        try {
          const list = Array.isArray(old) ? old : old?.data || [];
          const updated = list.filter(
            (p: any) => String(p.id || p._id) !== String(id),
          );
          return Array.isArray(old) ? updated : { ...old, data: updated };
        } catch {
          return old;
        }
      });
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được xóa mềm.",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm.",
        variant: "destructive",
      });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e91e63] to-[#f43f5e] flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Quản lý Sản phẩm
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Quản lý danh sách sản phẩm của cửa hàng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/seller/products/create">
              <Button className="bg-gradient-to-r from-[#e91e63] to-[#f43f5e] hover:from-[#d81b60] hover:to-[#f43f5e] text-white shadow-lg shadow-pink-500/30">
                <Plus className="w-4 h-4 mr-2" />
                Tạo Sản phẩm
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên sản phẩm..."
              className="pl-10 h-11 border-2 border-gray-200 focus:border-[#e91e63] rounded-xl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11 w-48 border-2 rounded-xl">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {flatShopCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.fullPath}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-11 px-4 border-2 rounded-xl">
            <Filter className="w-4 h-4 mr-2" />
            Lọc
          </Button>
        </div>
      </div>

      {/* Products Grid/List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e91e63] mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải sản phẩm...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">
              {query ? "Không tìm thấy sản phẩm nào" : "Chưa có sản phẩm nào"}
            </p>
            <Link to="/seller/products/create">
              <Button className="bg-gradient-to-r from-[#e91e63] to-[#f43f5e] hover:from-[#d81b60] hover:to-[#f43f5e]">
                <Plus className="w-4 h-4 mr-2" />
                Tạo sản phẩm đầu tiên
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((product: any, index: number) => (
            <motion.div
              key={product.id || product._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow border-2">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                          (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                Giá:
                              </span>
                              <span className="text-lg font-bold text-[#e91e63]">
                                {(product.price || 0).toLocaleString("vi-VN")}₫
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                Tồn kho:
                              </span>
                              <Badge
                                variant={
                                  (product.stockQuantity ??
                                    product.stock ??
                                    0) > 0
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {product.stockQuantity ?? product.stock ?? 0}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex items-start gap-3">
                          <Badge
                            variant={
                              (() => {
                                const status = product.status;
                                
                                // Ưu tiên kiểm tra status field trước (chính xác nhất)
                                if (status !== undefined && status !== null) {
                                  if (status === 1 || status === "Approved" || status === "approved") {
                                    return "default";
                                  }
                                  if (status === 0 || status === "Pending" || status === "pending") {
                                    return "secondary";
                                  }
                                  if (status === 2 || status === "Rejected" || status === "rejected") {
                                    return "destructive";
                                  }
                                }
                                
                                // Fallback: check isApproved/isRejected flags
                                if (product.isApproved === true) return "default";
                                if (product.isRejected === true || product.rejected === true) return "destructive";
                                
                                return "secondary"; // Mặc định là Pending
                              })()
                            }
                            className="whitespace-nowrap"
                          >
                            {(() => {
                              const status = product.status;
                              
                              // Debug: Log status để kiểm tra
                              if (process.env.NODE_ENV === 'development') {
                                console.log(`Product ${product.name} status:`, {
                                  status,
                                  statusType: typeof status,
                                  isApproved: product.isApproved,
                                  isActive: product.isActive,
                                  approvalStatus: product.approvalStatus,
                                });
                              }
                              
                              // Ưu tiên kiểm tra status field (theo database: 0=Pending, 1=Approved, 2=Rejected)
                              if (status !== undefined && status !== null) {
                                if (typeof status === 'number') {
                                  if (status === 1) return "Approved";
                                  if (status === 0) return "Pending";
                                  if (status === 2) return "Rejected";
                                }
                                if (typeof status === 'string') {
                                  const statusLower = status.toLowerCase().trim();
                                  if (statusLower === 'approved' || statusLower === '1') return "Approved";
                                  if (statusLower === 'pending' || statusLower === '0') return "Pending";
                                  if (statusLower === 'rejected' || statusLower === '2') return "Rejected";
                                }
                              }
                              
                              // Fallback: check flags
                              if (product.isApproved === true) return "Approved";
                              if (product.isRejected === true || product.rejected === true) return "Rejected";
                              
                              // Mặc định: Pending (sản phẩm mới tạo)
                              return "Pending";
                            })()}
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link
                                  to={`/products/${
                                    product.id || product._id
                                  }`}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Xem chi tiết
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  to={`/seller/products/edit/${
                                    product.id || product._id
                                  }`}
                                  className="cursor-pointer"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Chỉnh sửa
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                onClick={() => {
                                  const id = product.id || product._id;
                                  if (!id) return;
                                  setProductToDelete(id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa mềm
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats */}
      {!isLoading && filtered.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600 text-center">
            Hiển thị <strong>{filtered.length}</strong> /{" "}
            <strong>{products.length}</strong> sản phẩm
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa mềm sản phẩm này không? Hành động này có thể hoàn tác sau nếu cần.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete) {
                  deleteMutation.mutate(productToDelete);
                  setProductToDelete(null);
                  setDeleteDialogOpen(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
