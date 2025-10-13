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
import { fetchShopBySeller, fetchProductsByShop } from "@/lib/api";

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

  return (
    <div className="container py-8">
      <div className="flex justify-between mb-6">
        <div />
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

      <div className="mb-6 flex gap-2">
        <Link to="/seller/products/create">
          <Button>+ Tạo Sản phẩm</Button>
        </Link>
        <Link to="/seller/category/create">
          <Button>+ Tạo Category</Button>
        </Link>
      </div>

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
