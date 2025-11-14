import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { CartValidator } from '@/utils/cartValidator';

interface AddToCartButtonProps {
  productId: string;
  stockQuantity: number;
  disabled?: boolean;
  className?: string;
}

export default function AddToCartButton({
  productId,
  stockQuantity,
  disabled = false,
  className = '',
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { isAuthenticated, initialized, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const roleDisabled = user?.role === 'Admin';

  const handleAddToCart = async () => {
    if (!initialized) {
      return;
    }

    if (roleDisabled) {
      alert('Admin không thể thêm sản phẩm vào giỏ hàng.');
      return;
    }

    if (!isAuthenticated) {
      if (confirm('Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng. Đăng nhập ngay?')) {
        navigate('/login');
      }
      return;
    }

    // Validate quantity
    const validationErrors = CartValidator.validateAddItem({ productId, quantity });
    if (CartValidator.hasErrors(validationErrors)) {
      alert(validationErrors.quantity || 'Số lượng không hợp lệ');
      return;
    }

    if (quantity <= 0 || quantity > stockQuantity) {
      alert(`Số lượng không hợp lệ. Tối đa ${stockQuantity} sản phẩm.`);
      return;
    }

    setLoading(true);
    const success = await addItem(productId, quantity);
    setLoading(false);

    if (success) {
      setQuantity(1); // Reset quantity after successful add
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < stockQuantity && quantity < 999) {
      setQuantity(quantity + 1);
    }
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    const clampedVal = Math.max(1, Math.min(val, Math.min(stockQuantity, 999)));
    setQuantity(clampedVal);
  };

  const isOutOfStock = stockQuantity === 0;
  const maxReached = quantity >= Math.min(stockQuantity, 999);

  return (
    <div className={`add-to-cart ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium">Số lượng:</label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={quantity <= 1 || disabled || isOutOfStock || roleDisabled}
            className="h-8 w-8"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Input
            type="number"
            min="1"
            max={Math.min(stockQuantity, 999)}
            value={quantity}
            onChange={handleQuantityInput}
            disabled={disabled || isOutOfStock || roleDisabled}
            className="w-20 text-center"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={maxReached || disabled || isOutOfStock || roleDisabled}
            className="h-8 w-8"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          (Còn {stockQuantity} sản phẩm)
        </span>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={loading || disabled || isOutOfStock || roleDisabled}
        className="w-full"
        size="lg"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {loading
          ? 'Đang thêm...'
          : isOutOfStock
          ? 'Hết hàng'
          : roleDisabled
          ? 'Không khả dụng'
          : 'Thêm vào giỏ'}
      </Button>
    </div>
  );
}

