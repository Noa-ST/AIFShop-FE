import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Placeholder from "@/pages/Placeholder";
import CartPage from "@/pages/Cart/Index";
import CheckoutPage from "@/pages/Checkout/Index";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import VerifyEmail from "@/pages/Auth/VerifyEmail";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import ResetPassword from "@/pages/Auth/ResetPassword";
import ProductList from "@/pages/Products/List";
import ProductDetail from "@/pages/Products/Detail";
import ProductManagement from "@/pages/Seller/ProductManagement";
import ShopInfo from "@/pages/Seller/ShopInfo";
import ShopManagement, {
  ShopInfoPage,
  ShopProductsPage,
} from "@/pages/Seller/ShopManagement";
import SettingsPage from "@/pages/Seller/Settings";
import SellerLayout from "@/components/layout/SellerLayout";
import React from "react";
import CreateProduct from "@/pages/Seller/CreateProduct";
import UpdateProduct from "@/pages/Seller/UpdateProduct";
import CreateCategory from "@/pages/Seller/CreateCategory";
import ShopCategories from "@/pages/Seller/ShopCategories";
import SellerBalancePage from "@/pages/Seller/Balance";
import ShopDetail from "@/pages/Shop/Detail";
import ShopListPage from "@/pages/ShopListPage";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminFeatured from "@/pages/Admin/Featured";
import GlobalCategoryDashboard from "@/pages/Admin/GlobalCategoryDashboard";
import CreateGlobalCategory from "@/pages/Admin/CreateGlobalCategory";
import AdminProductManagement from "@/pages/Admin/ProductManagement";
import AdminUserManagement from "@/pages/Admin/UserManagement";
import AdminAnalytics from "@/pages/Admin/Analytics";
import AdminSettings from "@/pages/Admin/Settings";
import AdminReviews from "@/pages/Admin/Reviews";
// Đổi các import relative dưới đây sang alias "@"
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider, useChat } from "@/contexts/ChatContext";
import { CartProvider } from "@/contexts/CartContext";
import ProfilePage from "@/pages/Profile/Index";
import MyOrdersPage from "@/pages/Orders/MyOrdersPage";
import ShopOrdersPage from "@/pages/Orders/ShopOrdersPage";
import AdminOrdersPage from "@/pages/Orders/AdminOrdersPage";
import OrderDetailPage from "@/pages/Orders/OrderDetailPage";
import AddressManagementPage from "@/pages/Address/Index";
import PaymentReturnPage from "@/pages/Payment/Return";
import PaymentCancelPage from "@/pages/Payment/Cancel";
// Đổi import CreateShopPage sang alias "@"
import CreateShopPage from "@/pages/Seller/CreateShop";

const queryClient = new QueryClient();

// Component to auto-enable chat when on chat routes
// ✅ This component is rendered inside ChatProvider, so useChat() is safe
const ChatRouteWatcher = () => {
  const location = useLocation();
  const pathname = location.pathname || "/";

  // ✅ Component is inside ChatProvider, so useChat() is safe
  // If error occurs during hot reload, it will resolve on next render
  const { enableChat } = useChat();

  React.useEffect(() => {
    // Enable chat when pathname contains "/chat" or is on specific chat-related routes
    if (pathname.includes("/chat") || pathname.includes("/messages")) {
      enableChat();
    }
  }, [pathname, enableChat]);

  return null;
};

function InnerApp() {
  const location = useLocation();
  const pathname = location.pathname || "/";
  const isSellerDashboardPage =
    pathname.startsWith("/seller/") && pathname !== "/seller/create-shop";
  const showHeader = !isSellerDashboardPage;

  return (
    <AuthProvider>
      <CartProvider>
        <ChatProvider>
          <ChatRouteWatcher />
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {isSellerDashboardPage ? (
              <Routes>
                <Route path="/seller" element={<SellerLayout />}>
                  <Route index element={<ShopManagement />} />
                  <Route path="shop-management" element={<ShopManagement />}>
                    <Route path="info" element={<ShopInfoPage />} />
                    <Route path="categories" element={<ShopCategories />} />
                    <Route path="products" element={<ShopProductsPage />} />
                    <Route index element={<ShopInfoPage />} />
                  </Route>
                  <Route path="products" element={<ProductManagement />} />
                  <Route path="shop" element={<ShopInfo />} />
                  <Route path="orders" element={<ShopOrdersPage />} />
                  <Route path="balance" element={<SellerBalancePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="products/create" element={<CreateProduct />} />
                  <Route path="products/edit/:id" element={<UpdateProduct />} />
                  <Route
                    path="category/create"
                    element={
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <CreateCategory />
                      </React.Suspense>
                    }
                  />
                </Route>
              </Routes>
            ) : (
              <div className="min-h-screen flex flex-col bg-background text-foreground">
                {showHeader && <SiteHeader />}
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/home" element={<Index />} />
                    <Route path="/shops" element={<ShopListPage />} />
                    <Route path="/shops/:id" element={<ShopDetail />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route
                      path="/addresses"
                      element={<AddressManagementPage />}
                    />
                    {/* Order routes - specific routes must come before dynamic route */}
                    <Route path="/orders/my" element={<MyOrdersPage />} />
                    <Route path="/orders/shop" element={<ShopOrdersPage />} />
                    <Route path="/orders/admin" element={<AdminOrdersPage />} />
                    <Route path="/orders/:id" element={<OrderDetailPage />} />
                    <Route
                      path="/payment/return"
                      element={<PaymentReturnPage />}
                    />
                    <Route
                      path="/payment/cancel"
                      element={<PaymentCancelPage />}
                    />
                    <Route
                      path="/seller/create-shop"
                      element={<CreateShopPage />}
                    />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="featured" element={<AdminFeatured />} />
                      <Route
                        path="global-categories"
                        element={<GlobalCategoryDashboard />}
                      />
                      <Route
                        path="global-categories/create"
                        element={<CreateGlobalCategory />}
                      />
                      <Route
                        path="products"
                        element={<AdminProductManagement />}
                      />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route path="reviews" element={<AdminReviews />} />
                      <Route path="users" element={<AdminUserManagement />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <SiteFooter />
              </div>
            )}
          </TooltipProvider>
        </ChatProvider>
      </CartProvider>
    </AuthProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <InnerApp />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
