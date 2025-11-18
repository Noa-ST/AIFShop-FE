import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Search, Filter, Star, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import ShopCard from "@/components/ShopCard";
import { CascadeAddressSelect } from "@/components/CascadeAddressSelect";
import { fetchAllActiveShops } from "@/lib/api";
// provinces list no longer needed after using CascadeAddressSelect
import { Shop, ShopFilters, ShopListPageProps } from "@/types/shop";
import { mockShopsResponse } from "@/mock/shopData";

const ShopListPage: React.FC<ShopListPageProps> = ({ locale = "vi" }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const loadStartRef = useRef<number | null>(null);
  const [filters, setFilters] = useState<ShopFilters>({
    search: "",
    category: "",
    location: "",
    minRating: 0,
    sortBy: "rating",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loadMoreMode, setLoadMoreMode] = useState(false);
  const [lastLoadMs, setLastLoadMs] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // Initialize from URL/localStorage
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const location = searchParams.get("location") || "";
    const minRatingStr = searchParams.get("minRating") || "0";
    const sortBy = (searchParams.get("sortBy") as ShopFilters["sortBy"]) || "rating";
    const p = Number(searchParams.get("page") || "1");
    const psFromUrl = Number(searchParams.get("pageSize") || "");
    const psSaved = Number((typeof window !== "undefined" && window.localStorage.getItem("shops.pageSize")) || "");
    const vmSaved = (typeof window !== "undefined" && window.localStorage.getItem("shops.viewMode")) as ("grid"|"list"|null);

    setFilters((prev) => ({
      ...prev,
      search: q,
      location: location === "all" ? "" : location,
      minRating: Number(minRatingStr) || 0,
      sortBy,
    }));
    setSearchInput(q);
    if (!Number.isNaN(p) && p > 0) setPage(p);
    const effectivePs = !Number.isNaN(psFromUrl) && psFromUrl > 0 ? psFromUrl : (!Number.isNaN(psSaved) && psSaved > 0 ? psSaved : 12);
    setPageSize(effectivePs);
    if (vmSaved === "grid" || vmSaved === "list") setViewMode(vmSaved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem("shops.pageSize", String(pageSize)); } catch {}
  }, [pageSize]);

  useEffect(() => {
    try { window.localStorage.setItem("shops.viewMode", viewMode); } catch {}
  }, [viewMode]);

  // Fetch shops data with fallback to mock data
  const {
    data: shopsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shops", "active"],
    queryFn: fetchAllActiveShops,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
    retryDelay: 1000,
  });

  // Use mock data as fallback when API fails
  const shops: Shop[] =
    (shopsResponse?.data ?? shopsResponse) ||
    (error ? mockShopsResponse.data : []);

  // Track load time
  useEffect(() => {
    if (error) return; // skip timing on error
    if (shopsResponse === undefined) {
      loadStartRef.current = Date.now();
    } else {
      const start = loadStartRef.current;
      if (start) {
        setLastLoadMs(Date.now() - start);
        loadStartRef.current = null;
      }
    }
  }, [shopsResponse, error]);
  // Filter and sort shops
  const filteredShops = useMemo(() => {
    let filtered = [...shops];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (shop) =>
          shop.name.toLowerCase().includes(searchLower) ||
          shop.description?.toLowerCase().includes(searchLower),
      );
    }

    // Helpers for robust province/city matching
    const normalizeProvinceName = (name?: string) =>
      (name || "")
        .toLowerCase()
        .replace(/^tp\.?\s*/i, "")
        .replace(/^thành phố\s*/i, "")
        .replace(/^tỉnh\s*/i, "")
        .trim();
    const extractShopProvince = (shop: Shop) => {
      const city = (shop as any).city || "";
      if (city) return normalizeProvinceName(city);
      const lastSegment = (shop.location || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .pop() || "";
      return normalizeProvinceName(lastSegment);
    };

    // Location filter (use province from CascadeAddressSelect)
    if (filters.location && filters.location !== "all") {
      const selected = normalizeProvinceName(filters.location);
      filtered = filtered.filter((shop) => {
        const province = extractShopProvince(shop);
        return province === selected || province.includes(selected);
      });
    }

    // Rating filter
    if (filters.minRating && filters.minRating > 0) {
      filtered = filtered.filter(
        (shop) => shop.averageRating >= filters.minRating!,
      );
    }

    // Sort
    switch (filters.sortBy) {
      case "rating":
        filtered.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [shops, filters]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };
  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const handleLocationChange = (value: string) => {
    setFilters((prev) => ({ ...prev, location: value === "all" ? "" : value }));
  };

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({ ...prev, sortBy: value as ShopFilters["sortBy"] }));
  };

  const handleViewShop = (shopId: string) => {
    navigate(`/shops/${shopId}`);
  };

  const handleChat = (shopId: string) => {
    // TODO: Implement chat functionality
    console.log("Chat with shop:", shopId);
  };

  const handleAddToFavorites = (shopId: string) => {
    // TODO: Implement favorites functionality
    console.log("Add to favorites:", shopId);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      location: "",
      minRating: 0,
      sortBy: "rating",
    });
    setSearchInput("");
    setPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value && value !== "" && value !== 0 && value !== "rating",
  ).length;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="p-8 text-center">
            <CardContent>
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Lỗi tải dữ liệu
              </h2>
              <p className="text-gray-600 mb-4">
                Không thể tải danh sách shop. Vui lòng thử lại sau.
              </p>
              <Button onClick={() => window.location.reload()}>Thử lại</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Sync filters and pagination to URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (filters.search && filters.search.trim()) next.set("q", filters.search.trim()); else next.delete("q");
    if (filters.location) next.set("location", filters.location); else next.delete("location");
    if (filters.minRating && !Number.isNaN(Number(filters.minRating))) next.set("minRating", String(filters.minRating)); else next.delete("minRating");
    if (filters.sortBy) next.set("sortBy", String(filters.sortBy)); else next.delete("sortBy");
    next.set("page", String(page));
    next.set("pageSize", String(pageSize));
    setSearchParams(next);
  }, [filters.search, filters.location, filters.minRating, filters.sortBy, page, pageSize]);

  // Visible shops with client-side pagination
  const visibleShops = useMemo(() => {
    const count = page * pageSize;
    return filteredShops.slice(0, count);
  }, [filteredShops, page, pageSize]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="mb-2 text-sm text-slate-600">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-rose-600 font-medium">Shop</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Danh sách Shop
          </h1>
          <p className="text-gray-600">
            Khám phá các shop uy tín và chất lượng trên AIFShop
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Bộ lọc
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Tên shop..."
                      value={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tỉnh/Thành phố
                  </label>
                  <div>
                    <CascadeAddressSelect
                      mode="provinceOnly"
                      onChange={(addr) => {
                        const provinceLabel = addr.labels.province?.trim() || "";
                        setFilters((prev) => ({ ...prev, location: provinceLabel }));
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Đánh giá tối thiểu
                  </label>
                  <Select
                    value={filters.minRating?.toString()}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        minRating: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đánh giá" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Tất cả</SelectItem>
                      <SelectItem value="3">3+ sao</SelectItem>
                      <SelectItem value="4">4+ sao</SelectItem>
                      <SelectItem value="4.5">4.5+ sao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Xóa bộ lọc ({activeFiltersCount})
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4" aria-live="polite">
                <span className="text-sm text-gray-600">
                  Hiển thị {visibleShops.length}/{filteredShops.length} shop{lastLoadMs != null ? ` • tải ${lastLoadMs}ms` : ""}
                </span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount} bộ lọc</Badge>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <Select value={filters.sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                    <SelectItem value="name">Tên A-Z</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* PageSize and Load More */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Hiển thị</span>
                  <Select value={String(pageSize)} onValueChange={(v) => {
                    const ns = Number(v);
                    setPageSize(ns);
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="12" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="36">36</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Xem thêm</span>
                    <Switch
                      checked={loadMoreMode}
                      onCheckedChange={(checked) => {
                        setLoadMoreMode(checked);
                        setPage(1);
                      }}
                      aria-label="Bật/tắt chế độ xem thêm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shops Grid/List */}
            {isLoading ? (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {Array.from({ length: pageSize }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="w-20 h-20 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredShops.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <div className="text-gray-400 mb-4">
                    <Search className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Không tìm thấy shop nào
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Xóa bộ lọc
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div
                className={`grid gap-6 items-stretch ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {(loadMoreMode ? visibleShops : filteredShops).map((shop) => (
                  <div key={shop.id} className="h-full">
                    <ShopCard
                      shop={shop}
                      locale={locale}
                      onViewShop={handleViewShop}
                      onChat={handleChat}
                      onAddToFavorites={handleAddToFavorites}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Load More button */}
            {loadMoreMode && visibleShops.length < filteredShops.length && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Xem thêm shop"
                >
                  Xem thêm
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ShopListPage;
