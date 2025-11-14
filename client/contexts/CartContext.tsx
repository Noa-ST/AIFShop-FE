import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartService, GetCartDto } from '@/services/cartService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import eventsService from "@/services/eventsService";

interface CartContextType {
  cart: GetCartDto | null;
  loading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<boolean>;
  updateItem: (productId: string, quantity: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<GetCartDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = async () => {
    if (!isAuthenticated || user?.role !== 'Customer') {
      setCart(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await cartService.getCart();
      if (response.Succeeded && response.Data) {
        setCart(response.Data);
      } else {
        // Empty cart is still valid
        if (response.Data && response.Data.items && response.Data.items.length === 0) {
          setCart(response.Data);
        } else {
          setError(response.Message || 'Lỗi khi tải giỏ hàng');
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi tải giỏ hàng';
      setError(errorMessage);
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'Customer') {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, user?.role]);

  const addItem = async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const response = await cartService.addItem({ productId, quantity });
      if (response.Succeeded) {
        await refreshCart();
        toast({
          title: 'Thành công',
          description: response.Message || 'Đã thêm sản phẩm vào giỏ hàng',
        });
        // Tracking: add-to-cart
        eventsService.trackAddToCart(productId, quantity);
        return true;
      } else {
        toast({
          title: 'Lỗi',
          description: response.Message || 'Không thể thêm sản phẩm',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Lỗi khi thêm sản phẩm';
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateItem = async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const response = await cartService.updateItem({ productId, quantity });
      if (response.Succeeded) {
        await refreshCart();
        const message = quantity === 0 
          ? 'Đã xóa mặt hàng khỏi giỏ hàng'
          : response.Message || 'Cập nhật giỏ hàng thành công';
        toast({
          title: 'Thành công',
          description: message,
        });
        return true;
      } else {
        toast({
          title: 'Lỗi',
          description: response.Message || 'Không thể cập nhật',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Lỗi khi cập nhật';
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeItem = async (productId: string): Promise<boolean> => {
    try {
      const response = await cartService.removeItem(productId);
      if (response.Succeeded) {
        await refreshCart();
        toast({
          title: 'Thành công',
          description: response.Message || 'Đã xóa mặt hàng khỏi giỏ hàng',
        });
        return true;
      } else {
        toast({
          title: 'Lỗi',
          description: response.Message || 'Không thể xóa',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Lỗi khi xóa';
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const clearCart = async (): Promise<boolean> => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      return false;
    }

    try {
      const response = await cartService.clearCart();
      if (response.Succeeded) {
        await refreshCart();
        toast({
          title: 'Thành công',
          description: response.Message || 'Đã xóa tất cả mặt hàng khỏi giỏ hàng',
        });
        return true;
      } else {
        toast({
          title: 'Lỗi',
          description: response.Message || 'Không thể xóa giỏ hàng',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Lỗi khi xóa giỏ hàng';
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getTotalItems = (): number => {
    if (!cart) return 0;
    return cartService.getTotalItemsCount(cart);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        refreshCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

