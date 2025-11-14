import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Building2, Filter } from "lucide-react";

import { OrdersTable } from "@/components/orders/OrdersTable";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ORDER_STATUS_OPTIONS } from "@/constants/order-status";
import { useOrderList } from "@/hooks/use-orders";
import { useAuth } from "@/contexts/AuthContext";
import type { OrderStatus } from "@/services/types";
import { fetchShopBySeller } from "@/lib/api";
import { SellerOrderActions } from "@/components/orders/SellerOrderActions";

type FilterFormValues = {
  status: OrderStatus | "all";
};

const DEFAULT_FILTER: FilterFormValues = {
  status: "all",
};

const statusOptions = [{ label: "Tất cả", value: "all" as const }].concat(
  ORDER_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value })),
);

const ShopOrdersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // ✅ Log component render
  console.log("🔍 ShopOrdersPage rendered:", { user, userId: user?.id });

  const form = useForm<FilterFormValues>({
    defaultValues: DEFAULT_FILTER,
  });

  const sellerId = user?.id;
  
  // ✅ Log sellerId state
  console.log("🔍 ShopOrdersPage - sellerId:", sellerId, "user:", user);
  console.log("🔍 Query enabled:", Boolean(sellerId));

  const {
    data: shop,
    isLoading: isShopLoading,
    isFetching: isShopFetching,
    isError: isShopError,
    error: shopError,
    status: shopQueryStatus,
  } = useQuery({
    queryKey: ["shops", "by-seller", sellerId],
    queryFn: async () => {
      console.log("🔍 [QueryFn] Fetching shop for seller:", sellerId);
      try {
        const result = await fetchShopBySeller(sellerId as string);
        console.log("✅ [QueryFn] Shop fetched:", result);
        return result;
      } catch (error: any) {
        console.error("❌ [QueryFn] Error fetching shop:", error);
        throw error;
      }
    },
    enabled: Boolean(sellerId),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 5, // ✅ Cache for 5 minutes
  });
  
  // ✅ Log query state
  console.log("🔍 Shop query state:", {
    isShopLoading,
    isShopFetching,
    isShopError,
    shopQueryStatus,
    hasShop: !!shop,
    shopId: shop?.id || shop?.shopId,
  });

  // ✅ Timeout detection - show error if loading takes too long
  useEffect(() => {
    if (isShopLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
        console.error("⏱️ Shop loading timeout after 10 seconds");
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isShopLoading]);

  useEffect(() => {
    if (isShopError && shopError) {
      toast({
        title: "Không thể tải thông tin cửa hàng",
        description: shopError.message,
        variant: "destructive",
      });
    }
  }, [isShopError, shopError, toast]);

  const status = form.watch("status");
  const selectedStatus = useMemo(
    () => (status && status !== "all" ? (status as OrderStatus) : undefined),
    [status],
  );

  const shopId = useMemo(() => {
    if (!shop) {
      console.log("🔍 shopId: shop is null/undefined");
      return undefined;
    }
    if (Array.isArray(shop) && shop.length) {
      const id = shop[0]?.id || shop[0]?.shopId;
      console.log("🔍 shopId from array:", id);
      return id;
    }
    if (typeof shop === "object") {
      const id = (shop as any).id || (shop as any).shopId;
      console.log("🔍 shopId from object:", id, "shop:", shop);
      return id;
    }
    console.log("🔍 shopId: shop type is not array or object:", typeof shop);
    return undefined;
  }, [shop]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOrderList({
    scope: "shop",
    id: shopId,
    status: selectedStatus,
  });

  // ✅ Log order list state
  useEffect(() => {
    console.log("🔍 OrderList state:", {
      shopId,
      enabled: Boolean(shopId),
      isLoading,
      isFetching,
      isError,
      dataCount: data?.length ?? 0,
      error: error?.message,
    });
  }, [shopId, isLoading, isFetching, isError, data, error]);

  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Không thể tải đơn hàng",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // ✅ Debug logging - MUST BE BEFORE EARLY RETURNS (Rules of Hooks)
  useEffect(() => {
    console.log("🔍 ShopOrdersPage Debug:", {
      sellerId,
      shopId,
      isShopLoading,
      isLoading,
      isFetching,
      shop,
      ordersCount: data?.length ?? 0,
    });
  }, [sellerId, shopId, isShopLoading, isLoading, isFetching, shop, data?.length]);

  if (!sellerId) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Chưa đăng nhập</h2>
            <p className="text-sm text-muted-foreground">
              Vui lòng đăng nhập bằng tài khoản người bán để xem đơn hàng cửa hàng.
            </p>
          </div>
          <Button asChild>
            <a href="/login">Đăng nhập</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!shopId && !isShopLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Bạn chưa có cửa hàng</h2>
            <p className="text-sm text-muted-foreground">
              Tạo cửa hàng để bắt đầu nhận và quản lý đơn hàng từ khách hàng.
            </p>
          </div>
          <Button asChild>
            <a href="/seller/create-shop">Tạo cửa hàng ngay</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ✅ Show loading state when fetching shop data
  if (isShopLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Đang tải thông tin cửa hàng...</p>
          <p className="text-xs text-muted-foreground">sellerId: {sellerId}</p>
          {loadingTimeout && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                Tải quá lâu. Vui lòng kiểm tra kết nối hoặc thử lại.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Tải lại trang
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ✅ Show error state for shop loading
  if (isShopError && shopError) {
    console.error("❌ Shop loading error:", shopError);
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
          <Building2 className="h-10 w-10 text-destructive" />
          <div>
            <h2 className="text-lg font-semibold">Lỗi khi tải cửa hàng</h2>
            <p className="text-sm text-muted-foreground">
              {shopError.message || "Không thể tải thông tin cửa hàng"}
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
        </CardContent>
      </Card>
    );
  }

  const orders = data ?? [];
  const loadingState = isLoading || isFetching || isShopLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Đơn hàng cửa hàng
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý trạng thái đơn hàng của cửa hàng và hỗ trợ khách hàng kịp thời.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium uppercase text-muted-foreground">
            Bộ lọc
          </h2>
        </div>

        <Form {...form}>
          <form className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái đơn hàng</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(DEFAULT_FILTER);
                  refetch();
                }}
              >
                Đặt lại
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => refetch()}
                disabled={loadingState}
              >
                Làm mới
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <OrdersTable
        orders={orders}
        isLoading={loadingState}
        emptyTitle="Chưa có đơn hàng nào"
        emptyDescription="Khi khách hàng đặt mua sản phẩm, đơn hàng sẽ xuất hiện tại đây để bạn xử lý."
        emptyCtaHref="/seller/products"
        emptyCtaLabel="Quản lý sản phẩm"
        showCustomerColumn
        renderActionsColumn={(order) => (
          <SellerOrderActions
            order={order}
            // Note: useOrderMutation hook already invalidates queries automatically
            // onStatusChange callback is optional and can cause double refetch
          />
        )}
      />
    </div>
  );
};

export default ShopOrdersPage;

