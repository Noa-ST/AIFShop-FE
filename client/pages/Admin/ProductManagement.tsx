import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import productService, {
  ProductStatus,
  ProductFilterDto,
  GetProduct,
} from "@/services/productService";
import shopService, { GetShop } from "@/services/shopService";
import { ProductErrorHandler } from "@/utils/productErrorHandler";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileDown,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getProductImageUrl } from "@/utils/imageUrl";

export default function AdminProductManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shopId, setShopId] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [updateStockOpen, setUpdateStockOpen] = useState<boolean>(false);
  const [updateStockId, setUpdateStockId] = useState<string | null>(null);
  const [updateStockValue, setUpdateStockValue] = useState<string>("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);

  // Build filter
  const productFilter: ProductFilterDto = {
    page,
    pageSize,
    keyword: searchTerm || undefined,
    status:
      statusFilter === "all"
        ? undefined
        : statusFilter === "Pending"
          ? ProductStatus.Pending
          : statusFilter === "Approved"
            ? ProductStatus.Approved
            : ProductStatus.Rejected,
    shopId: shopId !== "all" ? shopId : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sortBy,
    sortOrder,
  };

  // Fetch products with pagination
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminProducts", productFilter],
    queryFn: () => productService.searchAndFilter(productFilter),
    staleTime: 30 * 1000,
  });

  const products = productsData?.data || [];
  const pagination = productsData
    ? {
        totalCount: productsData.totalCount,
        totalPages: productsData.totalPages,
        hasPreviousPage: productsData.hasPreviousPage,
        hasNextPage: productsData.hasNextPage,
      }
    : null;

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ["adminProductStatistics"],
    queryFn: () => productService.getStatistics(),
    staleTime: 60 * 1000,
  });

  // Shops for filter
  const { data: shopsResp } = useQuery({
    queryKey: ["adminShopsActive"],
    queryFn: () => shopService.getAllActive(),
    staleTime: 5 * 60 * 1000,
  });
  const shops: GetShop[] = useMemo(() => Array.isArray(shopsResp) ? shopsResp : [], [shopsResp]);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => productService.approve(id),
    onSuccess: async (data, productId) => {
      toast({
        title: "Thành công",
        description: "Đã duyệt sản phẩm thành công.",
      });
      
      // ✅ Optimistic update: Cập nhật cache ngay lập tức
      queryClient.setQueriesData(
        { queryKey: ["adminProducts"], exact: false },
        (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          // Update product status trong cached data
          const updatedData = {
            ...oldData,
            data: oldData.data.map((product: GetProduct) =>
              product.id === productId
                ? { ...product, status: ProductStatus.Approved }
                : product
            ),
          };
          
          return updatedData;
        }
      );
      
      // ✅ Invalidate và refetch để sync với server
      await queryClient.invalidateQueries({ queryKey: ["adminProducts"], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["adminProductStatistics"] });
      
      // ✅ Force refetch ngay cả khi cache còn fresh
      queryClient.refetchQueries({ 
        queryKey: ["adminProducts"], 
        exact: false,
        type: 'active'
      });
    },
    onError: (error: any) => {
      const apiError = ProductErrorHandler.handleError(error);
      toast({
        title: "Lỗi",
        description: apiError.message,
        variant: "destructive",
      });
      // ✅ Rollback optimistic update nếu có lỗi
      queryClient.invalidateQueries({ queryKey: ["adminProducts"], exact: false });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      productService.reject(id, reason),
    onSuccess: async (data, { id: productId }) => {
      toast({
        title: "Thành công",
        description: "Đã từ chối sản phẩm thành công.",
      });
      setRejectOpen(false);
      setRejectReason("");
      setRejectId(null);
      
      // ✅ Optimistic update: Cập nhật cache ngay lập tức
      queryClient.setQueriesData(
        { queryKey: ["adminProducts"], exact: false },
        (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          // Update product status trong cached data
          const updatedData = {
            ...oldData,
            data: oldData.data.map((product: GetProduct) =>
              product.id === productId
                ? { ...product, status: ProductStatus.Rejected }
                : product
            ),
          };
          
          return updatedData;
        }
      );
      
      // ✅ Invalidate và refetch để sync với server
      await queryClient.invalidateQueries({ queryKey: ["adminProducts"], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["adminProductStatistics"] });
      
      // ✅ Force refetch ngay cả khi cache còn fresh
      queryClient.refetchQueries({ 
        queryKey: ["adminProducts"], 
        exact: false,
        type: 'active'
      });
    },
    onError: (error: any) => {
      const apiError = ProductErrorHandler.handleError(error);
      toast({
        title: "Lỗi",
        description: apiError.message,
        variant: "destructive",
      });
      // ✅ Rollback optimistic update nếu có lỗi
      queryClient.invalidateQueries({ queryKey: ["adminProducts"], exact: false });
    },
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => productService.updateStock(id, qty),
    onSuccess: async () => {
      toast({ title: "Thành công", description: "Đã cập nhật tồn kho." });
      setUpdateStockOpen(false);
      setUpdateStockId(null);
      setUpdateStockValue("");
      await queryClient.invalidateQueries({ queryKey: ["adminProducts"], exact: false });
    },
    onError: (error: any) => {
      const apiError = ProductErrorHandler.handleError(error);
      toast({ title: "Lỗi", description: apiError.message, variant: "destructive" });
    },
  });

  // Soft delete (hide)
  const softDeleteMutation = useMutation({
    mutationFn: (id: string) => productService.softDelete(id),
    onSuccess: async () => {
      toast({ title: "Thành công", description: "Đã ẩn sản phẩm (soft delete)." });
      await queryClient.invalidateQueries({ queryKey: ["adminProducts"], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["adminProductStatistics"] });
    },
    onError: (error: any) => {
      const apiError = ProductErrorHandler.handleError(error);
      toast({ title: "Lỗi", description: apiError.message, variant: "destructive" });
    },
  });

  // Detail query
  const { data: productDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["adminProductDetail", selectedProductId],
    queryFn: () =>
      selectedProductId
        ? productService.getDetailById(selectedProductId)
        : null,
    enabled: detailOpen && !!selectedProductId,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDetail = (id: string) => {
    setSelectedProductId(id);
    setDetailOpen(true);
  };

  const openReject = (id: string) => {
    setRejectId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const openUpdateStock = (id: string, currentQty: number) => {
    setUpdateStockId(id);
    setUpdateStockValue(String(currentQty));
    setUpdateStockOpen(true);
  };

  const statusText = (s: ProductStatus | number) => {
    const n = Number(s);
    if (n === ProductStatus.Approved) return "Approved";
    if (n === ProductStatus.Rejected) return "Rejected";
    return "Pending";
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const baseFilter = { ...productFilter };
      // Fetch all pages
      const all = await fetchAllProductsForExport(baseFilter);
      // Apply low-stock client filter if enabled
      const filtered = lowStockOnly
        ? all.filter((p) => (p.stockQuantity ?? 0) <= lowStockThreshold)
        : all;

      if (!filtered.length) {
        toast({ title: "Không có dữ liệu", description: "Không có sản phẩm phù hợp bộ lọc." });
        setIsExporting(false);
        return;
      }

      const rows = filtered.map((p) => ({
        id: p.id,
        name: p.name,
        shopName: p.shopName ?? "",
        price: p.price,
        stockQuantity: p.stockQuantity,
        status: statusText(p.status),
        createdAt: new Date(p.createdAt).toISOString(),
      }));
      const csv = buildCSV(rows);
      await downloadBlobCSV(`products_export_${new Date().toISOString().slice(0,19)}.csv`, csv);
      toast({ title: "Xuất CSV thành công", description: `Đã xuất ${rows.length} sản phẩm.` });
    } catch (e: any) {
      const apiError = ProductErrorHandler.handleError(e);
      toast({ title: "Lỗi xuất CSV", description: apiError.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: ProductStatus | number) => {
    const statusNum = Number(status);
    if (statusNum === ProductStatus.Approved) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Approved
        </Badge>
      );
    }
    if (statusNum === ProductStatus.Rejected) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Rejected
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        Pending
      </Badge>
    );
  };

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
            <div className="text-2xl font-bold">
              {statistics?.totalProducts || pagination?.totalCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Tất cả sản phẩm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.approvedProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground">Sản phẩm đang bán</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.pendingProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground">Cần xem xét</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã từ chối</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.rejectedProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground">Sản phẩm bị từ chối</p>
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
          <div className="flex flex-col gap-4">
            {/* Top row: search + export */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  await handleExportCSV();
                }}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xuất CSV
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>

            {/* Second row: status + shop + price range */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                >
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
              </div>
              <div className="flex-1">
                <Select
                  value={shopId}
                  onValueChange={(value) => {
                    setShopId(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Chọn shop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả shop</SelectItem>
                    {shops.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Giá từ"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ""))}
                  className="w-32"
                />
                <Input
                  placeholder="Giá đến"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))}
                  className="w-32"
                />
              </div>
            </div>

            {/* Third row: low stock + sorting */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <Checkbox checked={lowStockOnly} onCheckedChange={(v) => setLowStockOnly(Boolean(v))} />
                <span className="text-sm">Tồn kho thấp</span>
                <Input
                  value={String(lowStockThreshold)}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value || 0))}
                  className="w-20 ml-2"
                  placeholder="<="
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stockQuantity">Tồn kho</SelectItem>
                    <SelectItem value="price">Giá</SelectItem>
                    <SelectItem value="createdAt">Ngày tạo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Thứ tự" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Tăng dần</SelectItem>
                    <SelectItem value="desc">Giảm dần</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Sản phẩm</CardTitle>
          <CardDescription>
            {pagination &&
              `Hiển thị ${products.length} / ${pagination.totalCount} sản phẩm`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
            </div>
          ) : error ? (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center text-red-600">
                <p>Lỗi khi tải sản phẩm</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["adminProducts"] })}
                  className="mt-2"
                >
                  Thử lại
                </Button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Không tìm thấy sản phẩm nào.</p>
              </div>
            </div>
          ) : (
            <>
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
                  {(lowStockOnly
                    ? products.filter((p: GetProduct) => (p.stockQuantity ?? 0) <= lowStockThreshold)
                    : products
                    ).map((product: GetProduct) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {product.productImages?.[0]?.url ? (
                              <img
                                src={getProductImageUrl(product)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "/placeholder.svg";
                                }}
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              {product.categoryName || "-"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{product.shopName || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatPrice(product.price)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.stockQuantity > 10 ? "default" : "destructive"
                          }
                        >
                          {product.stockQuantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.averageRating && product.averageRating > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm">
                              ⭐ {product.averageRating.toFixed(1)}
                            </span>
                            {product.reviewCount && (
                              <span className="text-xs text-gray-500">
                                ({product.reviewCount})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Hành động
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <button onClick={() => openDetail(product.id)} className="w-full text-left">
                                <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                              </button>
                            </DropdownMenuItem>
                            {product.status === ProductStatus.Pending && (
                              <DropdownMenuItem asChild>
                                <button
                                  onClick={() => approveMutation.mutate(product.id)}
                                  disabled={approveMutation.isPending}
                                  className="w-full text-left"
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Duyệt
                                </button>
                              </DropdownMenuItem>
                            )}
                            {product.status === ProductStatus.Pending && (
                              <DropdownMenuItem asChild>
                                <button
                                  onClick={() => openReject(product.id)}
                                  disabled={rejectMutation.isPending}
                                  className="w-full text-left text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Từ chối
                                </button>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <button
                                onClick={() => openUpdateStock(product.id, product.stockQuantity)}
                                className="w-full text-left"
                              >
                                <Package className="mr-2 h-4 w-4" /> Cập nhật tồn kho
                              </button>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <button
                                onClick={() => softDeleteMutation.mutate(product.id)}
                                className="w-full text-left text-amber-700"
                              >
                                <EyeOff className="mr-2 h-4 w-4" /> Ẩn (soft delete)
                              </button>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={!pagination.hasPreviousPage || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoading}
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!pagination.hasNextPage || isLoading}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>

                  <span className="text-sm text-gray-600 ml-4">
                    Trang {page} / {pagination.totalPages} ({pagination.totalCount}{" "}
                    sản phẩm)
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết sản phẩm</DialogTitle>
            <DialogDescription>
              Xem thông tin trước khi duyệt
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-rose-600" />
              <p>Đang tải...</p>
            </div>
          ) : productDetail ? (
            <div className="space-y-6">
              {/* Images */}
              {productDetail.productImages && productDetail.productImages.length > 0 && (
                <div>
                  <Label className="mb-2 block">Hình ảnh sản phẩm</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {productDetail.productImages.map((img, idx) => (
                      <img
                        key={img.id || idx}
                        src={getProductImageUrl({ imageUrl: img.url })}
                        alt={`${productDetail.name} ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/placeholder.svg";
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tên sản phẩm</Label>
                  <p className="font-medium">{productDetail.name}</p>
                </div>
                <div>
                  <Label>Giá</Label>
                  <p className="font-medium text-rose-600">
                    {formatPrice(productDetail.price)}
                  </p>
                </div>
                <div>
                  <Label>Danh mục</Label>
                  <p>{productDetail.categoryName || "-"}</p>
                </div>
                <div>
                  <Label>Tồn kho</Label>
                  <p>{productDetail.stockQuantity}</p>
                </div>
                <div>
                  <Label>Shop</Label>
                  <p>{productDetail.shopName || "-"}</p>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <div>{getStatusBadge(productDetail.status)}</div>
                </div>
                {productDetail.description && (
                  <div className="md:col-span-2">
                    <Label>Mô tả</Label>
                    <p className="text-sm whitespace-pre-wrap">
                      {productDetail.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {productDetail.status === ProductStatus.Pending && (
                  <Button
                    onClick={() => {
                      approveMutation.mutate(productDetail.id);
                      setDetailOpen(false);
                    }}
                    disabled={approveMutation.isPending}
                    className="flex-1"
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang duyệt...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Duyệt sản phẩm
                      </>
                    )}
                  </Button>
                )}
                {productDetail.status === ProductStatus.Pending && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDetailOpen(false);
                      openReject(productDetail.id);
                    }}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Từ chối
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-gray-500">
              Không tìm thấy thông tin sản phẩm
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
            <Label htmlFor="rejectReason" className="sr-only">
              Lý do từ chối
            </Label>
            <Textarea
              id="rejectReason"
              placeholder="Ví dụ: Hình ảnh không rõ ràng, thông tin không đầy đủ..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rejectId) {
                  rejectMutation.mutate({
                    id: rejectId,
                    reason: rejectReason.trim() || undefined,
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận từ chối"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Update Stock Dialog */}
      <Dialog open={updateStockOpen} onOpenChange={setUpdateStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật tồn kho</DialogTitle>
            <DialogDescription>Nhập số lượng tồn kho mới cho sản phẩm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="stockQty">Số lượng</Label>
            <Input
              id="stockQty"
              value={updateStockValue}
              onChange={(e) => setUpdateStockValue(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="Ví dụ: 25"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setUpdateStockOpen(false)}>Hủy</Button>
            <Button
              onClick={() => {
                if (!updateStockId) return;
                const qty = Number(updateStockValue || 0);
                updateStockMutation.mutate({ id: updateStockId, qty });
              }}
              disabled={updateStockMutation.isPending}
            >
              {updateStockMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật
                </>
              ) : (
                "Lưu"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== CSV Export helpers =====
function csvEscape(val: any): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function buildCSV(rows: Array<Record<string, any>>): string {
  if (rows.length === 0) return "id,name,shopName,price,stockQuantity,status,createdAt\n";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(",");
  const body = rows
    .map((r) => headers.map((h) => csvEscape(r[h])).join(","))
    .join("\n");
  return headerLine + "\n" + body;
}

async function downloadBlobCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function fetchAllProductsForExport(filter: ProductFilterDto): Promise<GetProduct[]> {
  const pageSize = 200;
  const first = await productService.searchAndFilter({ ...filter, page: 1, pageSize });
  let all = [...first.data];
  const totalPages = first.totalPages ?? 1;
  for (let p = 2; p <= totalPages; p++) {
    const resp = await productService.searchAndFilter({ ...filter, page: p, pageSize });
    all = all.concat(resp.data);
  }
  return all;
}

async function handleExportCSV(this: any) {}