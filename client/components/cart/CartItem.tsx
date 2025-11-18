import { GetCartItemDto } from '@/services/cartService';
import { cartService } from '@/services/cartService';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Minus, Plus } from 'lucide-react';

interface CartItemProps {
  item: GetCartItemDto;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onQuantityChange: (quantity: number) => Promise<void>;
  onRemove: () => Promise<void>;
}

export default function CartItem({ 
  item, 
  selected = false,
  onSelect,
  onQuantityChange, 
  onRemove 
}: CartItemProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 0 || newQuantity > 999) return;

    setUpdating(true);
    setQuantity(newQuantity);
    await onQuantityChange(newQuantity);
    setUpdating(false);
  };

  const handleIncrement = () => {
    handleQuantityChange(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      handleQuantityChange(quantity - 1);
    } else {
      if (confirm('Bạn có muốn xóa sản phẩm này?')) {
        onRemove();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    if (val >= 0 && val <= 999) {
      setQuantity(val);
    }
  };

  const handleInputBlur = () => {
    if (quantity === 0) {
      if (confirm('Bạn có muốn xóa sản phẩm này?')) {
        onRemove();
      } else {
        setQuantity(1);
      }
    } else {
      handleQuantityChange(quantity);
    }
  };

  return (
    <div className="flex gap-4 p-4 rounded-xl border bg-background">
      {/* Checkbox for selection */}
      {onSelect && (
        <div className="flex items-center pt-1">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect(checked === true)}
            aria-label={`Chọn ${item.productName}`}
          />
        </div>
      )}

      <Link
        to={`/products/${item.productId}`}
        className="w-24 h-24 flex-shrink-0 block"
        aria-label={`Xem chi tiết sản phẩm ${item.productName}`}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="w-full h-full rounded-md object-cover hover:opacity-90 transition"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        ) : (
          <div className="w-full h-full rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
            No Image
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link
              to={`/products/${item.productId}`}
              className="font-medium hover:text-primary text-slate-900 leading-snug line-clamp-2 break-words whitespace-normal hyphens-auto"
              aria-label={`Xem chi tiết sản phẩm ${item.productName}`}
              title={item.productName}
            >
              {item.productName}
            </Link>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1 break-words whitespace-normal">
              Shop: {item.shopName}
            </p>
            <p className="text-sm font-medium mt-2">
              {cartService.formatPrice(item.unitPrice)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={updating}
              aria-label="Giảm số lượng"
              className="h-8 w-8"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              className="w-20 text-center"
              min={0}
              max={999}
              value={quantity}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={updating}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={updating || quantity >= 999}
              aria-label="Tăng số lượng"
              className="h-8 w-8"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-semibold whitespace-nowrap text-lg">
              {cartService.formatPrice(item.itemTotal)}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              disabled={updating}
              aria-label="Xóa sản phẩm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

