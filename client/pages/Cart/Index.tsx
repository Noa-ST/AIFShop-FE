import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cartService, type GetCartItemDto } from '@/services/cartService';
import CartItem from '@/components/cart/CartItem';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Package } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const { isAuthenticated, initialized, user } = useAuth();
  const { cart, loading, error, updateItem, removeItem, clearCart, getTotalItems } = useCart();
  const navigate = useNavigate();
  
  // State for selected items
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // ✅ DI CHUYỂN TẤT CẢ HOOKS LÊN TRƯỚC EARLY RETURNS
  // Group cart items by shop
  const itemsByShop = useMemo(() => {
    if (!cart?.items || cart.items.length === 0) {
      return new Map<string, GetCartItemDto[]>();
    }
    const grouped = new Map<string, GetCartItemDto[]>();
    const itemsWithoutShop: GetCartItemDto[] = [];
    
    cart.items.forEach((item) => {
      // Validate shopId: must be a non-empty string (not null, undefined, or empty string)
      const shopId = item.shopId?.trim();
      if (!shopId || shopId === '') {
        // Collect items without valid shopId for potential error handling
        itemsWithoutShop.push(item);
        console.warn('Cart item missing shopId:', item);
        return; // Skip items without valid shopId
      }
      
      if (!grouped.has(shopId)) {
        grouped.set(shopId, []);
      }
      grouped.get(shopId)!.push(item);
    });
    
    // Show warning if there are items without shopId (shouldn't happen with valid data)
    if (itemsWithoutShop.length > 0) {
      console.warn(`${itemsWithoutShop.length} cart items are missing shopId`);
    }
    
    return grouped;
  }, [cart?.items]);

  // Calculate subtotal for each shop (only selected items)
  const shopSubtotals = useMemo(() => {
    const subtotals = new Map<string, number>();
    itemsByShop.forEach((items, shopId) => {
      const subtotal = items
        .filter(item => selectedItems.has(item.productId))
        .reduce((sum, item) => sum + item.itemTotal, 0);
      subtotals.set(shopId, subtotal);
    });
    return subtotals;
  }, [itemsByShop, selectedItems]);

  // Calculate total for selected items only
  const selectedTotal = useMemo(() => {
    return Array.from(itemsByShop.values())
      .flat()
      .filter(item => selectedItems.has(item.productId))
      .reduce((sum, item) => sum + item.itemTotal, 0);
  }, [itemsByShop, selectedItems]);

  // Check if all items in a shop are selected
  const isShopAllSelected = (shopId: string): boolean => {
    const items = itemsByShop.get(shopId) || [];
    if (items.length === 0) return false;
    return items.every(item => selectedItems.has(item.productId));
  };

  // Check if some items in a shop are selected (for indeterminate state)
  const isShopSomeSelected = (shopId: string): boolean => {
    const items = itemsByShop.get(shopId) || [];
    if (items.length === 0) return false;
    const selectedCount = items.filter(item => selectedItems.has(item.productId)).length;
    return selectedCount > 0 && selectedCount < items.length;
  };

  // Select all items in a shop
  const toggleShopSelection = (shopId: string, checked: boolean) => {
    const items = itemsByShop.get(shopId) || [];
    const newSelected = new Set(selectedItems);
    
    if (checked) {
      items.forEach(item => newSelected.add(item.productId));
    } else {
      items.forEach(item => newSelected.delete(item.productId));
    }
    
    setSelectedItems(newSelected);
  };

  // Select all items
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allProductIds = new Set(
        Array.from(itemsByShop.values())
          .flat()
          .map(item => item.productId)
      );
      setSelectedItems(allProductIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    if (!cart?.items || cart.items.length === 0) return false;
    const allProductIds = cart.items.map(item => item.productId);
    return allProductIds.every(id => selectedItems.has(id));
  }, [cart?.items, selectedItems]);

  // Check if some items are selected
  const isSomeSelected = useMemo(() => {
    if (!cart?.items || cart.items.length === 0) return false;
    return selectedItems.size > 0 && selectedItems.size < cart.items.length;
  }, [cart?.items, selectedItems]);

  const totalItems = getTotalItems();
  const selectedItemsCount = selectedItems.size;

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      if (confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        await removeItem(productId);
        // Remove from selection if deleted
        setSelectedItems(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    } else {
      await updateItem(productId, newQuantity);
    }
  };

  const handleItemSelect = (productId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để đặt hàng');
      return;
    }
    // Navigate to checkout with selected items
    navigate('/checkout', { 
      state: { selectedItems: Array.from(selectedItems) } 
    });
  };

  // ✅ SAU ĐÓ MỚI ĐẶT EARLY RETURNS
  // Guard: wait init, then block unauthenticated
  if (!initialized) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6">Đang khôi phục phiên người dùng...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only Customers should access cart
  if (user?.role !== 'Customer') {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6 rounded-xl border bg-background text-center">
          Đang tải giỏ hàng...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6 rounded-xl border bg-background text-destructive">
          <p className="font-semibold">Lỗi</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 rounded-xl border bg-background">
          <h2 className="text-2xl font-semibold mb-4">Giỏ hàng của bạn đang trống</h2>
          <p className="text-muted-foreground mb-6">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
          <Button onClick={() => navigate('/products')}>
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="container mx-auto pt-8 pb-28 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Giỏ hàng của bạn</h1>
          <p className="text-muted-foreground mt-1">
            {totalItems} sản phẩm
            {selectedItemsCount > 0 && (
              <span className="ml-2 text-primary">
                • {selectedItemsCount} đã chọn
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Select All checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => toggleSelectAll(checked === true)}
              aria-label="Chọn tất cả"
            />
            <span className="text-sm text-muted-foreground">Chọn tất cả</span>
          </div>
          {cart.items.length > 0 && (
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Xóa tất cả
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Items list grouped by shop */}
        <div className="lg:col-span-2 space-y-6">
          {Array.from(itemsByShop.entries()).map(([shopId, items]) => {
            const shopName = items[0]?.shopName || 'Unknown Shop';
            const shopSubtotal = shopSubtotals.get(shopId) || 0;
            const shopAllSelected = isShopAllSelected(shopId);

            return (
              <Card key={shopId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={shopAllSelected}
                      onCheckedChange={(checked) => toggleShopSelection(shopId, checked === true)}
                      aria-label={`Chọn tất cả sản phẩm từ ${shopName}`}
                    />
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {shopName}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId}>
                      <CartItem
                        item={item}
                        selected={selectedItems.has(item.productId)}
                        onSelect={(selected) => handleItemSelect(item.productId, selected)}
                        onQuantityChange={(quantity) =>
                          handleQuantityChange(item.productId, quantity)
                        }
                        onRemove={async () => {
                          await removeItem(item.productId);
                          setSelectedItems(prev => {
                            const next = new Set(prev);
                            next.delete(item.productId);
                            return next;
                          });
                        }}
                      />
                      {items.indexOf(item) < items.length - 1 && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  ))}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tạm tính ({shopName}):</span>
                      <span className="font-semibold">
                        {cartService.formatPrice(shopSubtotal)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary: hidden on mobile to avoid duplication */}
        <aside className="hidden lg:block lg:sticky lg:top-6">
          <div className="rounded-xl border bg-background p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tạm tính:</span>
                <span className="text-lg font-semibold">
                  {cartService.formatPrice(selectedTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Phí vận chuyển:</span>
                <span className="text-sm text-muted-foreground">---</span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between">
                <span className="font-semibold">Tổng cộng:</span>
                <span className="text-xl font-bold text-primary">
                  {cartService.formatPrice(selectedTotal)}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Chưa bao gồm phí vận chuyển, thuế và khuyến mãi
            </p>
            {selectedItemsCount === 0 && (
              <p className="text-xs text-amber-600">
                Vui lòng chọn ít nhất một sản phẩm để đặt hàng
              </p>
            )}
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handleCheckout}
              disabled={selectedItems.size === 0}
            >
              Tiến hành Đặt hàng ({selectedItemsCount})
            </Button>
          </div>
        </aside>
      </div>
    </div>
    {/* Sticky checkout bar for mobile with updated background */}
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t bg-rose-50/95 backdrop-blur supports-[backdrop-filter]:bg-rose-50/80">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">Tổng cộng</div>
          <div className="text-lg font-bold text-primary truncate">
            {cartService.formatPrice(selectedTotal)}
          </div>
        </div>
        <Button
          size="lg"
          onClick={handleCheckout}
          disabled={selectedItems.size === 0}
          className="flex-shrink-0"
        >
          Đặt hàng ({selectedItemsCount})
        </Button>
      </div>
    </div>
    </>
  );
}
