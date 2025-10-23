import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveProduct,
  rejectProduct,
  fetchProducts,
  fetchProductById,
  fetchGlobalCategories,
  softDeleteProduct,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { Search, Eye, Trash2, Package, MoreHorizontal, Star, TrendingUp, TrendingDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AnyRecord = Record<string, any>;
type AdminProduct = AnyRecord;

const normalizeProductList = (response: any): AdminProduct[] => {
  const maybeData = response?.data ?? response;
  if (Array.isArray(maybeData)) return maybeData as AdminProduct[];
  if (Array.isArray(maybeData?.items)) return maybeData.items as AdminProduct[];
  if (Array.isArray(maybeData?.result)) return maybeData.result as AdminProduct[];
  return [];
};

const getProductName = (p: AdminProduct) => p?.name || p?.productName || p?.title || "Sản phẩm";
const getProductPrice = (p: AdminProduct) => Number(p?.price ?? p?.unitPrice ?? 0);
const getProductCategoryName = (p: AdminProduct) =>
  p?.categoryName || p?.category || p?.categoryTitle || "-";
const getProductStock = (p: AdminProduct) => Number(p?.stock ?? p?.stockQuantity ?? 0);
const getShopName = (p: AdminProduct) => p?.shop?.name || p?.shopName || p?.seller?.name || "-";
const getRating = (p: AdminProduct) => Number(p?.rating ?? p?.avgRating ?? 0);
const getReviewCount = (p: AdminProduct) => Number(p?.reviewCount ?? p?.numReviews ?? 0);
const getProductId = (p: AdminProduct) => p?.id || p?.productId || p?._id;
const getStatus = (p: AdminProduct): "Pending" | "Approved" | "Rejected" | "Unknown" => {
  const raw = p?.status ?? p?.productStatus ?? p?.approvalStatus ?? p?.state;
  if (typeof raw === "number") {
    if (raw === 0) return "Pending";
    if (raw === 1) return "Approved";
    if (raw === 2) return "Rejected";
  }
  const normalized = String(raw ?? "").trim().toLowerCase();
  if (["pending", "awaiting", "waiting"].includes(normalized)) return "Pending";
  if (["approved", "active", "accepted"].includes(normalized)) return "Approved";
  if (["rejected", "inactive", "denied"].includes(normalized)) return "Rejected";
  return "Pending";
};

export default function AdminProductManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);

  // Products query
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ["adminProducts"],
    queryFn: fetchProducts,
  });

  const products: AdminProduct[] = useMemo(
    () => normalizeProductList(productsResponse),
    [productsResponse],
  );

  // Categories for filter (flattened)
  const { data: rawCategories = [] } = useQuery({
    queryKey: ["globalCategories"],
    queryFn: fetchGlobalCategories,
  });

  const flatCategories = useMemo(() => {
    const out: Array<{ id: string; name: string }> = [];
    const walk = (nodes: any[]) => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        out.push({ id: n?.id ?? n?._id ?? n?.value ?? String(out.length + 1), name: n?.name || n?.title || "Unnamed" });
        if (n?.children && n.children.length) walk(n.children);
      }
    };
    walk(rawCategories as any[]);
    return out;
  }, [rawCategories]);

  // Approve (optimistic)
  const approveMutation = useMutation({
    mutationFn: (id: string) => approveProduct(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["adminProducts"] });
      const prev = queryClient.getQueryData(["adminProducts"]);
      queryClient.setQueryData(["adminProducts"], (old: any) => {
        const items = normalizeProductList(old);
        return items.map((p) => (getProductId(p) === id ? { ...p, status: "Approved" } : p));
      });
      return { prev };
    },
    onError: (error: any, _id, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(["adminProducts"], ctx.prev);
      const msg = error?.response?.data?.message || "Duyệt sản phẩm thất bại.";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã duyệt sản phẩm." });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
    },
  });

  // Reject (optimistic)
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectProduct(id, reason),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["adminProducts"] });
      const prev = queryClient.getQueryData(["adminProducts"]);
      queryClient.setQueryData(["adminProducts"], (old: any) => {
        const items = normalizeProductList(old);
        return items.map((p) => (getProductId(p) === id ? { ...p, status: "Rejected" } : p));
      });
      return { prev };
    },
    onError: (error: any, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(["adminProducts"], ctx.prev);
      const msg = error?.response?.data?.message || "Từ chối sản phẩm thất bại.";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã từ chối sản phẩm." });
      setRejectOpen(false);
      setRejectReason("");
      setRejectId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
    },
  });

  const openDetail = (id: string) => {
    setSelectedProductId(id);
    setDetailOpen(true);
  };

  const openReject = (id: string) => {
    setRejectId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteProduct(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["adminProducts"] });
      const prev = queryClient.getQueryData(["adminProducts"]);
      queryClient.setQueryData(["adminProducts"], (old: any) => {
        const items = normalizeProductList(old);
        return items.filter((p) => getProductId(p) !== id);
      });
      return { prev };
    },
    onError: (error: any, _id, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(["adminProducts"], ctx.prev);
      const msg = error?.response?.data?.message || "Xóa mềm thất bại.";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa mềm sản phẩm." });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
    },
  });

  const deleteProduct = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "approved")
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    if (s === "rejected")
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const getDiscountPercentage = (price: number, oldPrice?: number) => {
    if (!oldPrice || oldPrice <= price) return null;
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !term
        ? true
        : getProductName(p).toLowerCase().includes(term) ||
          getShopName(p).toLowerCase().includes(term);
      const status = getStatus(p);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || getProductCategoryName(p) === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, searchTerm, statusFilter, categoryFilter]);

  // Detail query (lazy)
  const { data: detailResponse, isLoading: detailLoading } = useQuery({
    queryKey: ["adminProductDetail", selectedProductId],
    queryFn: () => fetchProductById(selectedProductId as string),
    enabled: detailOpen && !!selectedProductId,
  });
  const detail: AnyRecord = detailResponse?.data ?? detailResponse ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quản lý Sản phẩm</h2>
        <p className="text-muted-foreground">
          Quản lý và giám sát tất cả sản phẩm trên nền tảng.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng sản phẩm</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> từ tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đang hoạt động
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((p) => getStatus(p) === "Approved").length}
            </div>
            <p className="text-xs text-muted-foreground">Sản phẩm đang bán</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((p) => getStatus(p) === "Pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Cần xem xét</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đánh giá TB</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                products.reduce((sum, p) => sum + p.rating, 0) / products.length
              ).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Sao trung bình</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc và Tìm kiếm</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc sản phẩm theo các tiêu chí khác nhau.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm sản phẩm hoặc shop..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {flatCategories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Sản phẩm</CardTitle>
          <CardDescription>
            Quản lý và theo dõi tất cả sản phẩm trên nền tảng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p>Đang tải sản phẩm...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Không tìm thấy sản phẩm nào.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={getProductId(product)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium">{getProductName(product)}</div>
                          <div className="text-sm text-gray-500">
                            {getProductCategoryName(product)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <Package className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-sm">{getShopName(product)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {getProductPrice(product).toLocaleString("vi-VN")}₫
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getProductStock(product) > 10 ? "default" : "destructive"}
                      >
                        {getProductStock(product)} sản phẩm
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm">{getRating(product)}</span>
                        <span className="text-xs text-gray-500">
                          ({getReviewCount(product)})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(getStatus(product))}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(getProductId(product))}>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {getStatus(product) === "Pending" && (
                            <DropdownMenuItem onClick={() => approveMutation.mutate(getProductId(product))}>
                              ✅ Duyệt (Approve)
                            </DropdownMenuItem>
                          )}
                          {getStatus(product) !== "Rejected" && (
                            <DropdownMenuItem onClick={() => openReject(getProductId(product))} className="text-red-600">
                              Từ chối (Reject)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteProduct(getProductId(product))}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa mềm
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết sản phẩm</DialogTitle>
            <DialogDescription>Xem thông tin trước khi duyệt</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-10 text-center">Đang tải...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="bg-gray-50 rounded-md p-3">
                  <img
                    src={
                      (detail?.productImages?.[0]?.url || detail?.images?.[0]?.url || detail?.imageUrl || detail?.image || "/placeholder.svg") as string
                    }
                    alt={getProductName(detail)}
                    className="w-full h-64 object-cover rounded"
                  />
                </div>
                {/* thumbnails */}
                {(() => {
                  const imgs: string[] =
                    (detail?.productImages || []).map((i: any) => i?.url).filter(Boolean) || [];
                  const other = (detail?.images || []).map((i: any) => i?.url).filter(Boolean) || [];
                  const gallery = (detail?.gallery || []).map((i: any) => i?.url).filter(Boolean) || [];
                  const imageUrl = detail?.imageUrl ? [detail.imageUrl] : [];
                  const image = detail?.image ? [detail.image] : [];
                  const all = Array.from(new Set([...imgs, ...other, ...gallery, ...imageUrl, ...image]));
                  return all.length > 1 ? (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {all.map((u, idx) => (
                        <img key={idx} src={u} className="w-16 h-16 object-cover rounded border" />
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="space-y-2">
                <div className="text-lg font-semibold">{getProductName(detail)}</div>
                <div className="text-rose-600 font-bold">
                  {getProductPrice(detail).toLocaleString("vi-VN")}₫
                </div>
                <div className="text-sm text-slate-600">
                  Danh mục: {getProductCategoryName(detail)}
                </div>
                <div className="text-sm text-slate-600">
                  Trạng thái: {getStatusBadge(getStatus(detail))}
                </div>
                {detail?.description && (
                  <div className="pt-2 text-sm">{detail.description}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ chối sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng nhập lý do từ chối (tùy chọn).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2">
            <Input
              placeholder="Lý do từ chối"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rejectId) {
                  rejectMutation.mutate({ id: rejectId, reason: rejectReason.trim() || undefined });
                }
              }}
            >
              Xác nhận từ chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
