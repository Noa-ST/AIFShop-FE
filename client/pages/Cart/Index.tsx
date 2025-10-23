import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, Minus, Plus } from "lucide-react";
import {
  fetchCart,
  updateCartItem,
  deleteCartItem,
} from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

// Types are defensive because BE DTO shape may vary
export type CartItem = {
  productId: string;
  productName?: string;
  name?: string;
  shopName?: string;
  shop?: { name?: string } | null;
  imageUrl?: string;
  productImage?: string;
  image?: string;
  unitPrice?: number;
  price?: number;
  quantity: number;
};

function formatCurrency(n: number | undefined | null) {
  const value = Number(n || 0);
  return new Intl.NumberFormat("vi-VN").format(value) + "₫";
}

export default function CartPage() {
  const { isAuthenticated, initialized } = useAuth();
  const navigate = useNavigate();

  // Guard: wait init, then block unauthenticated
  if (!initialized) return <div className="p-6">Đang khôi phục phiên người dùng...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const queryClient = useQueryClient();

  const { data: cartData, isLoading, isFetching } = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
  });

  // Normalize items
  const items: CartItem[] = useMemo(() => {
    const rawItems = (cartData?.items || cartData?.cartItems || cartData) ?? [];
    if (!Array.isArray(rawItems)) return [];
    return rawItems.map((it: any) => ({
      productId: String(
        it.productId || it.productID || it.id || it._id || it.product?.id || ""
      ),
      productName: it.productName || it.name || it.product?.name,
      name: it.name || it.productName || it.product?.name,
      shopName: it.shopName || it.shop?.name,
      shop: it.shop || null,
      imageUrl:
        it.imageUrl || it.productImage || it.image || it.product?.imageUrl,
      productImage: it.productImage,
      image: it.image,
      unitPrice: Number(it.unitPrice ?? it.price ?? it.product?.price ?? 0),
      price: Number(it.price ?? it.unitPrice ?? it.product?.price ?? 0),
      quantity: Number(it.quantity ?? 0),
    }));
  }, [cartData]);

  const totalQuantity = useMemo(
    () => items.reduce((sum, it) => sum + (it.quantity || 0), 0),
    [items],
  );
  const subTotal = useMemo(
    () => items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || it.price || 0), 0),
    [items],
  );

  // Local edit state for numeric input
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const it of items) next[it.productId] = it.quantity;
    setQuantities(next);
  }, [items.length]);

  const { mutateAsync: mutateUpdate, isPending: updating } = useMutation({
    mutationFn: updateCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: () => {
      toast({ title: "Cập nhật thất bại", description: "Vui lòng thử lại." });
    },
  });

  const { mutateAsync: mutateDelete, isPending: deleting } = useMutation({
    mutationFn: (productId: string) => deleteCartItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Đã xóa sản phẩm khỏi giỏ" });
    },
    onError: () => {
      toast({ title: "Xóa thất bại", description: "Vui lòng thử lại." });
    },
  });

  const handleSetQuantity = async (productId: string, nextQty: number) => {
    if (nextQty < 0) nextQty = 0;
    setQuantities((prev) => ({ ...prev, [productId]: nextQty }));
    if (nextQty === 0) {
      // prefer delete API when quantity becomes 0
      await mutateDelete(productId);
      return;
    }
    await mutateUpdate({ productId, quantity: nextQty });
  };

  const handleDecrease = async (productId: string) => {
    const current = quantities[productId] ?? 0;
    await handleSetQuantity(productId, current - 1);
  };

  const handleIncrease = async (productId: string) => {
    const current = quantities[productId] ?? 0;
    await handleSetQuantity(productId, current + 1);
  };

  const confirmAndDelete = async (productId: string) => {
    const ok = window.confirm("Bạn có chắc muốn xóa sản phẩm này?");
    if (!ok) return;
    await mutateDelete(productId);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Giỏ hàng của bạn</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading || isFetching ? "Đang tải..." : `${totalQuantity} sản phẩm`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="p-6 rounded-xl border bg-background">Đang tải giỏ hàng...</div>
          ) : items.length === 0 ? (
            <div className="p-6 rounded-xl border bg-background">
              Giỏ hàng trống. <Link to="/products" className="text-primary underline">Tiếp tục mua sắm</Link>
            </div>
          ) : (
            items.map((it) => {
              const qty = quantities[it.productId] ?? it.quantity;
              const price = it.unitPrice ?? it.price ?? 0;
              const itemTotal = price * (qty || 0);
              return (
                <div key={it.productId} className="flex gap-4 p-4 rounded-xl border bg-background">
                  <img
                    src={it.imageUrl || it.productImage || it.image || "/placeholder.svg"}
                    alt={it.productName || it.name || "Sản phẩm"}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                    }}
                    className="w-24 h-24 rounded-md object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {it.productName || it.name || "Sản phẩm"}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 truncate">
                          {it.shopName || it.shop?.name || "Cửa hàng"}
                        </div>
                      </div>
                      <div className="text-right font-medium">
                        {formatCurrency(price)}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleDecrease(it.productId)}
                          disabled={updating || deleting}
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          className="w-20 text-center"
                          min={0}
                          value={qty}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [it.productId]: Number(e.target.value || 0),
                            }))
                          }
                          onBlur={() => handleSetQuantity(it.productId, Number(qty || 0))}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleIncrease(it.productId)}
                          disabled={updating || deleting}
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="font-semibold whitespace-nowrap">
                          {formatCurrency(itemTotal)}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => confirmAndDelete(it.productId)}
                          disabled={updating || deleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-6">
          <div className="rounded-xl border bg-background p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Tạm tính</div>
              <div className="text-lg font-semibold">{formatCurrency(subTotal)}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Chưa bao gồm phí vận chuyển</p>
            <Button
              className="w-full mt-4"
              onClick={() => {
                // You can add a dedicated /checkout route later
                navigate("/checkout");
              }}
              disabled={items.length === 0}
            >
              Tiến hành Đặt hàng
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
