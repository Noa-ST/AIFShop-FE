import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Placeholder from "./pages/Placeholder";
import SiteHeader from "./components/layout/SiteHeader";
import SiteFooter from "./components/layout/SiteFooter";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ProductList from "./pages/Products/List";
import ProductDetail from "./pages/Products/Detail";
import CreateShopPage from "./pages/Seller/CreateShop";
import ProductManagement from "./pages/Seller/ProductManagement";
import ShopInfo from "./pages/Seller/ShopInfo";
import ShopManagement from "./pages/Seller/ShopManagement";
import SellerLayout from "./components/layout/SellerLayout";
import React from "react";
import CreateProduct from "./pages/Seller/CreateProduct";
import CreateCategory from "./pages/Seller/CreateCategory";
import ShopDetail from "./pages/Shop/Detail";
import ProfilePage from "./pages/Profile/Index";
import { AuthProvider } from "./contexts/AuthContext";
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard";
import GlobalCategoryDashboard from "./pages/Admin/GlobalCategoryDashboard";
import CreateGlobalCategory from "./pages/Admin/CreateGlobalCategory";
import AdminProductManagement from "./pages/Admin/ProductManagement";
import AdminUserManagement from "./pages/Admin/UserManagement";
import AdminAnalytics from "./pages/Admin/Analytics";
import AdminSettings from "./pages/Admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            <SiteHeader />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Index />} />
                <Route
                  path="/shops"
                  element={<Placeholder title="Danh sách Shop" />}
                />
                <Route path="/shops/:id" element={<ShopDetail />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route
                  path="/cart"
                  element={<Placeholder title="Giỏ hàng" />}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<ProfilePage />} />
                {/* Seller area with Admin-like navigation */}
                <Route path="/seller" element={<SellerLayout />}>
                  <Route index element={<ShopManagement />} />
                  <Route path="shop-management" element={<ShopManagement />} />
                  <Route path="products" element={<ProductManagement />} />
                  <Route path="shop" element={<ShopInfo />} />
                  <Route path="products/create" element={<CreateProduct />} />
                  <Route
                    path="category/create"
                    element={
                      // Lazy load new CreateCategory page if needed
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <CreateCategory />
                      </React.Suspense>
                    }
                  />
                </Route>
                {/* Route outside seller layout for onboarding new sellers */}
                <Route path="/seller/create-shop" element={<CreateShopPage />} />

                {/* Admin Routes with nested layout */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route
                    path="global-categories"
                    element={<GlobalCategoryDashboard />}
                  />
                  <Route
                    path="global-categories/create"
                    element={<CreateGlobalCategory />}
                  />
                  <Route path="products" element={<AdminProductManagement />} />
                  <Route path="users" element={<AdminUserManagement />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <SiteFooter />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
