import React, { useState, useEffect } from "react";
import { Star, Heart, MessageCircle, Store, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShopCardProps } from "@/types/shop";
import { getShopLogoUrl } from "@/utils/imageUrl";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import eventsService from "@/services/eventsService";

const ShopCard: React.FC<ShopCardProps> = ({
  shop,
  locale = 'vi',
  onViewShop,
  onChat,
  onAddToFavorites,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const { user } = useAuth();

  const handleAddToFavorites = () => {
    setIsFavorited(!isFavorited);
    onAddToFavorites?.(shop.id);
  };

  const handleViewShop = () => {
    onViewShop?.(shop.id);
    // Tracking click vào shop
    eventsService.trackClick("shop", shop.id);
  };

  const handleChat = () => {
    onChat?.(shop.id);
  };

  const isTopShop = (shop.averageRating || 0) >= 4.8;
  const isOnline = shop.status === 'online';
  
  // Calculate years active
  const yearsActive = shop.yearsActive || 
    (shop.createdAt ? Math.floor((new Date().getTime() - new Date(shop.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  useEffect(() => {
    eventsService.trackImpression("shop", shop.id);
  }, [shop.id]);

  return (
    <Card 
      className="group relative h-full min-h-[320px] flex flex-col overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-rose-500/20 border-0 bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6 flex-1 flex flex-col">
        {/* Header with logo and basic info */}
        <div className="flex items-start gap-4 mb-4">
          {/* Shop Logo */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center overflow-hidden border-2 border-rose-200">
              {getShopLogoUrl(shop) ? (
                <img 
                  src={getShopLogoUrl(shop)} 
                  alt={`Logo của ${shop.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-8 h-8 text-rose-400" />
              )}
            </div>
            
            {/* Online status indicator */}
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Shop Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-gray-900 truncate">
                {shop.name}
              </h3>
              {isTopShop && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1">
                  Top
                </Badge>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {renderStars(shop.averageRating || 0)}
              </div>
              <span className="text-sm text-gray-600 truncate">
                {(shop.averageRating || 0).toFixed(1)} ({shop.reviewCount || 0} đánh giá)
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 text-sm">
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Đang online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Hoạt động {yearsActive} năm</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {shop.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {shop.description}
          </p>
        )}

        {/* Additional info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{shop.totalProducts || 0} sản phẩm</span>
          {(shop.location || (shop.street && shop.city)) && (
            <span className="truncate ml-2">
              {shop.location || `${shop.street}, ${shop.city}`}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-auto flex gap-2">
          <Button 
            onClick={handleViewShop}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
            aria-label={`Xem shop ${shop.name}`}
          >
            Xem shop
          </Button>

          <Button 
            variant="outline" 
            onClick={handleChat}
            className="flex items-center gap-2 border-rose-200 text-rose-600 hover:bg-rose-50"
            aria-label={`Chat với ${shop.name}`}
            disabled={user?.role === 'Seller' || user?.role === 'Admin'}
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </Button>
        </div>

        {(user?.role === 'Seller' || user?.role === 'Admin') && (
          <Alert variant="destructive" className="mt-3">
            <AlertTitle>{user?.role === 'Admin' ? 'Admin không thể mua hàng hoặc chat' : 'Seller không thể mua hàng'}</AlertTitle>
            <AlertDescription>
              Vui lòng dùng tài khoản Khách hàng để mua hoặc nhắn tin.
            </AlertDescription>
          </Alert>
        )}

        {/* Favorite button - appears on hover */}
        {isHovered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddToFavorites}
            className="absolute top-4 right-4 p-2 h-auto bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
            aria-label={`${isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'} ${shop.name}`}
          >
            <Heart 
              className={`w-5 h-5 transition-colors ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
              }`} 
            />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ShopCard;