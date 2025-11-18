import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  createOrder,
  formatPrice,
  type OrderCreateDTO,
} from "@/services/orders";
import { type OrderResponseDTO } from "@/services/types";
import { addressService, type GetAddressDto } from "@/services/addressService";
import { cartService, type GetCartItemDto } from "@/services/cartService";
import { PaymentMethod } from "@/services/types";
import { processPayment } from "@/services/payments";
import { getProductImageUrl } from "@/utils/imageUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  ChevronLeft,
  ShoppingBag,
  MapPin,
  CreditCard,
  Loader2,
  Package,
  Wallet,
  Landmark,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useQuery } from "@tanstack/react-query";
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

const SHIPPING_FEE = 30000; // 30,000 VND - có thể tính động sau
const MIN_FREE_SHIPPING = 500000; // Miễn phí ship nếu đơn > 500k

export default function CheckoutPage() {
  const { isAuthenticated, initialized, user } = useAuth();
  const { cart, loading: cartLoading, refreshCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Lấy selectedItems từ location state (nếu có)
  const selectedItemsFromState = location.state?.selectedItems as
    | string[]
    | undefined;

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch addresses
  const { data: addressesResponse, isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const response = await addressService.getList();
      if (response.Succeeded && response.Data) {
        return response.Data;
      }
      return [];
    },
    enabled: isAuthenticated,
  });

  const addresses = addressesResponse || [];

  // Set default address on load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else {
        setSelectedAddressId(addresses[0].id);
      }
    }
  }, [addresses, selectedAddressId]);

  // ✅ DI CHUYỂN TẤT CẢ HOOKS LÊN TRƯỚC EARLY RETURNS
  // Filter cart items based on selectedItems from state
  const filteredCartItems = useMemo(() => {
    if (!cart?.items || cart.items.length === 0) {
      return [];
    }

    // Nếu có selectedItems từ state, chỉ lấy các items đó
    if (selectedItemsFromState && selectedItemsFromState.length > 0) {
      const selectedSet = new Set(selectedItemsFromState);
      return cart.items.filter((item) => selectedSet.has(item.productId));
    }

    // Nếu không có selectedItems, hiển thị tất cả (fallback)
    return cart.items;
  }, [cart?.items, selectedItemsFromState]);

  // Group cart items by shop (sử dụng filteredCartItems thay vì cart.items)
  const itemsByShop = useMemo(() => {
    if (!filteredCartItems || filteredCartItems.length === 0) {
      return new Map<string, GetCartItemDto[]>();
    }
    const grouped = new Map<string, GetCartItemDto[]>();
    const itemsWithoutShop: GetCartItemDto[] = [];

    filteredCartItems.forEach((item) => {
      // Validate shopId: must be a non-empty string (not null, undefined, or empty string)
      const shopId = item.shopId?.trim();
      if (!shopId || shopId === "") {
        // Collect items without valid shopId for potential error handling
        itemsWithoutShop.push(item);
        console.warn("Cart item missing shopId:", item);
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
  }, [filteredCartItems]);

  // Calculate totals for each shop
  const shopTotals = useMemo(() => {
    const totals = new Map<
      string,
      { subtotal: number; shippingFee: number; total: number }
    >();
    itemsByShop.forEach((items, shopId) => {
      const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
      const shippingFee = 0; // Tạm thời không tính phí vận chuyển (chưa có API shipper)
      const total = subtotal; // Total = subtotal (không cộng shipping)
      totals.set(shopId, { subtotal, shippingFee, total });
    });
    return totals;
  }, [itemsByShop]);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    let total = 0;
    shopTotals.forEach((totals) => {
      total += totals.total;
    });
    return total;
  }, [shopTotals]);

  // Calculate subtotal from filtered items (for summary display)
  const filteredSubTotal = useMemo(() => {
    return filteredCartItems.reduce((sum, item) => sum + item.itemTotal, 0);
  }, [filteredCartItems]);

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

  // Only Customers should access checkout
  if (user?.role !== "Customer") {
    return <Navigate to="/" replace />;
  }

  if (cartLoading || addressesLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 rounded-xl border bg-background">
          <h2 className="text-2xl font-semibold mb-4">Giỏ hàng trống</h2>
          <p className="text-muted-foreground mb-6">
            Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán
          </p>
          <Button onClick={() => navigate("/cart")}>Quay lại giỏ hàng</Button>
        </div>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 rounded-xl border bg-background">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-4">
            Chưa có địa chỉ giao hàng
          </h2>
          <p className="text-muted-foreground mb-6 text-center">
            Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng
          </p>
          <Button onClick={() => navigate("/addresses")}>
            Thêm địa chỉ giao hàng
          </Button>
        </div>
      </div>
    );
  }

  const selectedAddress = addresses.find(
    (addr) => addr.id === selectedAddressId,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddressId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn địa chỉ giao hàng",
        variant: "destructive",
      });
      return;
    }

    // Hiển thị dialog xác nhận
    setShowConfirmDialog(true);
  };

  const handleConfirmOrder = async () => {
    setShowConfirmDialog(false);

    if (!selectedAddressId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn địa chỉ giao hàng",
        variant: "destructive",
      });
      return;
    }

    // Validate all items have shopId
    const itemsWithoutShop = Array.from(itemsByShop.entries()).filter(
      ([shopId]) => !shopId || shopId === "unknown",
    );

    if (itemsWithoutShop.length > 0) {
      toast({
        title: "Lỗi",
        description:
          "Một số sản phẩm không có thông tin shop. Vui lòng xóa hoặc cập nhật sản phẩm.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const orders: OrderCreateDTO[] = [];

      // Create order payload for each shop
      itemsByShop.forEach((items, shopId) => {
        // Validate shopId
        if (!shopId || shopId === "unknown") {
          console.error(`Invalid shopId: ${shopId} for items:`, items);
          return;
        }

        const totals = shopTotals.get(shopId)!;
        const order: OrderCreateDTO = {
          shopId,
          addressId: selectedAddressId,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          paymentMethod,
          shippingFee: 0, // Tạm thời không tính phí vận chuyển (chưa có API shipper)
          discountAmount: 0, // Tạm thời không tính discount (chưa có API mã khuyến mãi)
        };

        orders.push(order);
      });

      if (orders.length === 0) {
        toast({
          title: "Lỗi",
          description: "Không có đơn hàng nào để tạo.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create all orders with individual error handling
      const orderResults = await Promise.allSettled(
        orders.map((order, index) => {
          // ✅ Log payload để debug
          console.log(
            `📦 Creating order ${index + 1} for shop ${order.shopId}:`,
            {
              shopId: order.shopId,
              addressId: order.addressId,
              paymentMethod: order.paymentMethod,
              shippingFee: order.shippingFee,
              discountAmount: order.discountAmount,
              itemsCount: order.items.length,
              items: order.items,
            },
          );

          return createOrder(order)
            .then((response) => {
              console.log(
                `✅ Order ${index + 1} created successfully:`,
                response,
              );
              return response;
            })
            .catch((error) => {
              console.error(
                `❌ Failed to create order ${index + 1} for shop ${order.shopId}:`,
                error,
              );
              // ✅ Log chi tiết error response
              if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
              }
              return { error, shopId: order.shopId, index } as any;
            });
        }),
      );

      // Process results and collect successful orders
      const successfulOrders: OrderResponseDTO[] = [];
      const failedOrders: { shopId: string; error: any }[] = [];

      orderResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const orderData = result.value;
          console.log(`✅ Order ${index + 1} result:`, orderData);
          console.log(
            `✅ Order ${index + 1} is array:`,
            Array.isArray(orderData),
          );

          // createOrder returns OrderResponseDTO[] (array)
          if (Array.isArray(orderData)) {
            console.log(
              `✅ Adding ${orderData.length} orders to successfulOrders`,
            );
            successfulOrders.push(...orderData);
          } else if (orderData && !orderData.error) {
            console.log(`✅ Adding single order to successfulOrders`);
            successfulOrders.push(orderData);
          } else {
            console.error(`❌ Order ${index + 1} has error:`, orderData);
            failedOrders.push({
              shopId: orders[index].shopId,
              error: orderData?.error || new Error("Unknown error"),
            });
          }
        } else {
          console.error(`❌ Order ${index + 1} rejected:`, result.reason);
          failedOrders.push({
            shopId: orders[index].shopId,
            error: result.reason,
          });
        }
      });

      console.log(
        `📊 Summary: ${successfulOrders.length} successful, ${failedOrders.length} failed`,
      );
      console.log(`📊 Successful orders:`, successfulOrders);

      // ✅ Cải thiện error message để hiển thị chi tiết hơn
      if (failedOrders.length > 0) {
        const errorMessages = failedOrders
          .map((f) => {
            const error = f.error;
            let message = `Shop ${f.shopId}: `;

            if (error?.response?.data?.message) {
              message += error.response.data.message;
            } else if (error?.response?.data?.errors) {
              // Handle validation errors
              const validationErrors = Object.values(
                error.response.data.errors,
              ).flat();
              message += validationErrors.join(", ");
            } else if (error?.message) {
              message += error.message;
            } else {
              message += "Lỗi không xác định";
            }

            return message;
          })
          .join("\n");

        toast({
          title: "Cảnh báo",
          description: `Không thể tạo đơn hàng cho ${failedOrders.length} shop. ${successfulOrders.length} đơn hàng đã được tạo thành công.\n\nChi tiết lỗi:\n${errorMessages}`,
          variant: "destructive",
          duration: 10000, // Hiển thị lâu hơn để đọc được
        });
      }

      // If no successful orders, stop here
      if (successfulOrders.length === 0) {
        toast({
          title: "Lỗi",
          description: "Không thể tạo bất kỳ đơn hàng nào. Vui lòng thử lại.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Handle payment based on method
      if (paymentMethod === "COD" || paymentMethod === "Cash") {
        // ✅ COD/Cash: KHÔNG gọi processPayment ngay - payment sẽ được xác nhận khi:
        // 1. Order chuyển sang Delivered (tự động - đã implement trong backend)
        // 2. Seller/Customer xác nhận thanh toán sau khi nhận hàng

        toast({
          title: "Đặt hàng thành công",
          description: `Đã tạo ${successfulOrders.length} đơn hàng với phương thức ${paymentMethod === "COD" ? "COD" : "tiền mặt"}. Thanh toán sẽ được xác nhận khi nhận hàng.`,
        });

        // ✅ Navigate to order detail page
        if (successfulOrders.length > 0) {
          navigate(`/orders/${successfulOrders[0].orderId}`);
        } else {
          navigate("/orders/my");
        }
        setIsSubmitting(false);
        return;
      } else if (paymentMethod === "Bank") {
        // ✅ Bank transfer: KHÔNG gọi processPayment ngay - sẽ tạo payment link sau khi seller xác nhận đơn hàng
        toast({
          title: "Đặt hàng thành công",
          description: `Đã tạo ${successfulOrders.length} đơn hàng với phương thức chuyển khoản ngân hàng. Vui lòng đợi seller xác nhận đơn hàng để thanh toán.`,
        });

        // ✅ Navigate to order detail page
        if (successfulOrders.length > 0) {
          navigate(`/orders/${successfulOrders[0].orderId}`);
        } else {
          navigate("/orders/my");
        }
        setIsSubmitting(false);
        return;
      } else {
        // Online payment: process all orders and collect payment links
        const paymentLinks: {
          orderId: string;
          checkoutUrl: string;
          shopName?: string;
        }[] = [];
        const paymentErrors: { orderId: string; error: any }[] = [];

        // ✅ Online payment: Xử lý nested response structure và checkoutUrl type
        const paymentResults = await Promise.allSettled(
          successfulOrders.map((order) =>
            processPayment(order.orderId, paymentMethod)
              .then((response) => {
                console.log(
                  `✅ Payment processed for order ${order.orderId}:`,
                  response,
                );

                // ✅ Response structure: { code: 0, desc: "Success", data: { checkoutUrl: ... } }
                // ✅ checkoutUrl có thể là string URL hoặc number (timestamp)
                let checkoutUrl: string | null = null;

                if (response.data?.checkoutUrl) {
                  const url = response.data.checkoutUrl;
                  // Nếu là string URL, dùng trực tiếp
                  if (
                    typeof url === "string" &&
                    (url.startsWith("http") || url.startsWith("https"))
                  ) {
                    checkoutUrl = url;
                  }
                  // Nếu là number (timestamp), có thể cần construct URL từ PayOS
                  else if (typeof url === "number") {
                    // ⚠️ Nếu backend trả về timestamp, có thể cần construct URL
                    console.warn(
                      `⚠️ CheckoutUrl is number (timestamp), may need to construct URL:`,
                      url,
                    );
                    // Nếu có paymentLinkId, có thể construct URL
                    if (response.data.paymentLinkId) {
                      // PayOS URL format: https://pay.payos.vn/web/...
                      checkoutUrl = `https://pay.payos.vn/web/${response.data.paymentLinkId}`;
                    }
                  }
                }

                if (checkoutUrl) {
                  return {
                    orderId: order.orderId,
                    checkoutUrl: checkoutUrl,
                    shopName: order.shopName,
                  };
                } else {
                  return {
                    error: new Error("Không nhận được payment link từ PayOS"),
                    orderId: order.orderId,
                    errorMessage: "Không nhận được payment link từ PayOS",
                  };
                }
              })
              .catch((error: any) => {
                console.error(
                  `❌ Failed to process payment for order ${order.orderId}:`,
                  error,
                );
                // ✅ Extract error message từ backend
                const errorMessage =
                  error.message ||
                  error.response?.data?.message ||
                  "Xử lý thanh toán thất bại";
                return {
                  error,
                  orderId: order.orderId,
                  errorMessage,
                } as any;
              }),
          ),
        );

        paymentResults.forEach((result, index) => {
          if (
            result.status === "fulfilled" &&
            !result.value.error &&
            result.value.checkoutUrl
          ) {
            paymentLinks.push({
              orderId: successfulOrders[index].orderId,
              checkoutUrl: result.value.checkoutUrl,
              shopName: result.value.shopName,
            });
          } else {
            paymentErrors.push({
              orderId: successfulOrders[index].orderId,
              error:
                result.status === "rejected"
                  ? result.reason
                  : result.value?.error,
            });
          }
        });

        // ✅ Hiển thị error messages chi tiết từ backend
        if (paymentErrors.length > 0) {
          const errorMessages = paymentErrors
            .map((e) => {
              const errorMessage =
                e.error?.message ||
                e.error?.response?.data?.message ||
                "Lỗi không xác định";
              return `Đơn hàng ${e.orderId}: ${errorMessage}`;
            })
            .join("\n");

          toast({
            title: "Cảnh báo",
            description: `Không thể tạo payment link cho ${paymentErrors.length} đơn hàng.\n\nChi tiết:\n${errorMessages}`,
            variant: "destructive",
            duration: 10000,
          });
        }

        // If we have payment links, redirect to first one
        if (paymentLinks.length > 0) {
          // ✅ Refresh cart BEFORE redirecting so UI is updated
          await refreshCart();

          toast({
            title: "Đang chuyển hướng...",
            description: `Đã tạo ${successfulOrders.length} đơn hàng. Đang chuyển đến trang thanh toán PayOS.`,
          });
          // Small delay to ensure cart refresh completes
          setTimeout(() => {
            window.location.href = paymentLinks[0].checkoutUrl;
          }, 100);
          return; // Don't continue - user will be redirected
        } else {
          // No payment links, show error message
          toast({
            title: "Lỗi",
            description: `Không thể tạo payment link. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.`,
            variant: "destructive",
          });
          return;
        }
      }

      // Clear cart (backend already clears, but refresh UI)
      await refreshCart();

      // ✅ Chuyển đến trang "Đơn hàng của tôi" sau khi đặt hàng thành công
      // Online payment đã redirect đến PayOS ở trên, không đến đây
      // Chỉ COD/Cash mới đến đây vì Wallet/Bank đã return ở trên
      navigate("/orders/my");
    } catch (error: any) {
      console.error("Error in checkout:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể tạo đơn hàng. Vui lòng thử lại.";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="container mx-auto max-w-6xl py-8 pb-28">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Checkout</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6 px-0">
        <Link to="/cart" className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Quay lại giỏ hàng
        </Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Địa chỉ giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedAddressId}
                onValueChange={setSelectedAddressId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn địa chỉ giao hàng" />
                </SelectTrigger>
                <SelectContent>
                  {addresses.map((address) => (
                    <SelectItem key={address.id} value={address.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {address.recipientName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {address.phoneNumber} -{" "}
                          {addressService.formatFullAddress(address)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAddress && (
                <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-base">
                        {selectedAddress.recipientName}
                      </p>
                      {selectedAddress.isDefault && (
                        <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="font-medium text-foreground">
                        📞 {selectedAddress.phoneNumber}
                      </p>
                      <div className="text-muted-foreground leading-relaxed">
                        <p className="font-medium">
                          {selectedAddress.fullStreet}
                        </p>
                        <p>
                          {selectedAddress.ward}, {selectedAddress.district}
                        </p>
                        <p>{selectedAddress.province}</p>
                        {selectedAddress.country &&
                          selectedAddress.country !== "Việt Nam" && (
                            <p>{selectedAddress.country}</p>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/addresses")}
              >
                Thêm địa chỉ mới
              </Button>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Phương thức thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as PaymentMethod)
                }
              >
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="COD" id="cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <Wallet className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                        <p className="text-sm text-muted-foreground">
                          Trả tiền mặt trực tiếp khi nhận hàng, không cần thanh toán online
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="Bank" id="bank" />
                  <Label htmlFor="bank" className="flex-1 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <Landmark className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          Chuyển khoản ngân hàng
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                            PayOS
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tạo link thanh toán qua PayOS, giao dịch an toàn và tiện lợi
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Items by Shop */}
          <div className="space-y-4">
            {Array.from(itemsByShop.entries()).map(([shopId, items]) => {
              const shopName = items[0]?.shopName || "Unknown Shop";
              const totals = shopTotals.get(shopId)!;

              return (
                <Card key={shopId}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {shopName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex gap-4 pb-4 border-b last:border-0"
                        >
                          <img
                            src={getProductImageUrl({
                              imageUrl: item.imageUrl,
                            })}
                            alt={item.productName}
                            className="w-20 h-20 rounded-lg object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "/placeholder.svg";
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.productName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Số lượng: {item.quantity}
                            </p>
                            <p className="text-sm font-medium mt-1">
                              {cartService.formatPrice(item.itemTotal)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Tạm tính:</span>
                          <span>{formatPrice(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Tổng:</span>
                          <span>{formatPrice(totals.total)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="hidden lg:block lg:sticky lg:top-6 h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng của bạn</CardTitle>
              <CardDescription>
                {filteredCartItems.length} sản phẩm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(filteredSubTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <form onSubmit={handleSubmit}>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || !selectedAddressId}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Đặt hàng
                    </>
                  )}
                </Button>
              </form>

              {/* Confirmation Dialog */}
              <AlertDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận đặt hàng</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn đặt hàng với tổng giá trị{" "}
                      <strong className="text-primary">
                        {formatPrice(grandTotal)}
                      </strong>
                      ?
                      <br />
                      <br />
                      Sau khi đặt hàng, bạn sẽ được chuyển đến trang quản lý đơn
                      hàng.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmOrder}>
                      Xác nhận đặt hàng
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <p className="text-xs text-center text-muted-foreground">
                Bằng cách đặt hàng, bạn đồng ý với{" "}
                <Link to="#" className="underline">
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link to="#" className="underline">
                  Chính sách bảo mật
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* Sticky checkout bar for mobile */}
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-primary/20 bg-primary/10 backdrop-blur supports-[backdrop-filter]:bg-primary/20">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">Tổng cộng</div>
          <div className="text-lg font-bold text-primary truncate">
            {formatPrice(grandTotal)}
          </div>
        </div>
        <Button
          size="lg"
          onClick={() => {
            if (!selectedAddressId) {
              toast({
                title: "Lỗi",
                description: "Vui lòng chọn địa chỉ giao hàng",
                variant: "destructive",
              });
              return;
            }
            setShowConfirmDialog(true);
          }}
          disabled={isSubmitting || !selectedAddressId}
          className="flex-shrink-0"
        >
          Đặt hàng
        </Button>
      </div>
    </div>
    </>
  );
}
