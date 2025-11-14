import { useState, useEffect } from 'react';
import { shopService, GetShop } from '@/services/shopService';
import { useAuth } from '@/contexts/AuthContext';

export function useShop() {
  const { user } = useAuth();
  const [shop, setShop] = useState<GetShop | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasShop, setHasShop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadShop();
    } else {
      setShop(null);
      setHasShop(false);
    }
  }, [user?.id]);

  const loadShop = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const shops = await shopService.getBySellerId(user.id);
      if (shops.length > 0) {
        setShop(shops[0]);
        setHasShop(true);
      } else {
        setHasShop(false);
        setShop(null);
      }
    } catch (err: any) {
      console.error('Error loading shop:', err);
      setError(err.message || 'Không thể tải thông tin shop');
      setHasShop(false);
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshShop = async () => {
    await loadShop();
  };

  return {
    shop,
    hasShop,
    loading,
    error,
    refreshShop,
  };
}

