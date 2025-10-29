import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MapPin, Star, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ShopCard from "@/components/ShopCard";
import { fetchAllActiveShops } from "@/lib/api";
import { Shop, ShopFilters, ShopListPageProps } from "@/types/shop";
import { mockShopsResponse } from "@/mock/shopData";

const ShopListPage: React.FC<ShopListPageProps> = ({ locale = 'vi' }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ShopFilters>({
    search: '',
    category: '',
    location: '',
    minRating: 0,
    sortBy: 'rating'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch shops data with fallback to mock data
  const { data: shopsResponse, isLoading, error } = useQuery({
    queryKey: ['shops', 'active'],
    queryFn: fetchAllActiveShops,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
    retryDelay: 1000,
  });

  // Use mock data as fallback when API fails
  const shops: Shop[] = shopsResponse?.data || (error ? mockShopsResponse.data : []);

  // Filter and sort shops
  const filteredShops = useMemo(() => {
    let filtered = [...shops];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(shop => 
        shop.name.toLowerCase().includes(searchLower) ||
        shop.description?.toLowerCase().includes(searchLower)
      );
    }

    // Location filter
    if (filters.location && filters.location !== 'all') {
      filtered = filtered.filter(shop => 
        shop.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    // Rating filter
    if (filters.minRating && filters.minRating > 0) {
      filtered = filtered.filter(shop => shop.averageRating >= filters.minRating!);
    }

    // Sort
    switch (filters.sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [shops, filters]);

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleLocationChange = (value: string) => {
    setFilters(prev => ({ ...prev, location: value === 'all' ? '' : value }));
  };

  const handleSortChange = (value: string) => {
    setFilters(prev => ({ ...prev, sortBy: value as ShopFilters['sortBy'] }));
  };

  const handleViewShop = (shopId: string) => {
    navigate(`/shops/${shopId}`);
  };

  const handleChat = (shopId: string) => {
    // TODO: Implement chat functionality
    console.log('Chat with shop:', shopId);
  };

  const handleAddToFavorites = (shopId: string) => {
    // TODO: Implement favorites functionality
    console.log('Add to favorites:', shopId);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      minRating: 0,
      sortBy: 'rating'
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== '' && value !== 0 && value !== 'rating'
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
              <Button onClick={() => window.location.reload()}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
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
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Select value={filters.location} onValueChange={handleLocationChange}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Chọn tỉnh/thành" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="hanoi">Hà Nội</SelectItem>
                        <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                        <SelectItem value="danang">Đà Nẵng</SelectItem>
                        <SelectItem value="haiphong">Hải Phòng</SelectItem>
                        <SelectItem value="cantho">Cần Thơ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Đánh giá tối thiểu
                  </label>
                  <Select 
                    value={filters.minRating?.toString()} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: parseInt(value) }))}
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
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Hiển thị {filteredShops.length} shop
                </span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">
                    {activeFiltersCount} bộ lọc
                  </Badge>
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
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Shops Grid/List */}
            {isLoading ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {Array.from({ length: 8 }).map((_, index) => (
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
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {filteredShops.map((shop) => (
                  <ShopCard
                    key={shop.id}
                    shop={shop}
                    locale={locale}
                    onViewShop={handleViewShop}
                    onChat={handleChat}
                    onAddToFavorites={handleAddToFavorites}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ShopListPage;
