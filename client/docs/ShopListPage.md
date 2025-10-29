# ShopListPage Component

## Tổng quan
ShopListPage là một trang React component hiển thị danh sách các shop với đầy đủ tính năng tìm kiếm, lọc và sắp xếp.

## Cấu trúc Files

### 1. Types (`/types/shop.ts`)
- `Shop`: Interface chính cho dữ liệu shop
- `ShopCardProps`: Props cho ShopCard component
- `ShopListPageProps`: Props cho ShopListPage component
- `ShopFilters`: Interface cho bộ lọc

### 2. Components

#### ShopCard (`/components/ShopCard.tsx`)
- Hiển thị thông tin shop trong card format
- Hover effects với animation
- Rating stars với tính toán động
- Online/offline status indicator
- Action buttons: Xem shop, Chat, Thêm yêu thích

#### ShopListPage (`/pages/ShopListPage.tsx`)
- Layout chính với sidebar filters và main content
- Search và filter functionality
- Responsive grid layout
- Loading states và error handling

### 3. API Functions (`/lib/api.ts`)
- `fetchAllActiveShops()`: Lấy danh sách shop đang hoạt động
- `fetchShopDetail(id)`: Lấy chi tiết shop theo ID

## Tính năng

### ✅ Đã implement
- **Responsive Design**: Grid 1/2/3/4 cột tùy breakpoint
- **Search**: Tìm kiếm theo tên shop và mô tả
- **Filters**: Lọc theo tỉnh/thành, đánh giá tối thiểu
- **Sorting**: Sắp xếp theo rating, ngày tạo, tên
- **View Modes**: Grid và List view
- **Loading States**: Skeleton loading
- **Error Handling**: Error states với retry
- **Accessibility**: ARIA labels, alt text
- **i18n Support**: Locale prop (mặc định 'vi')

### 🎨 UI/UX Features
- **Hover Effects**: Scale + shadow animation
- **Rating Stars**: Dynamic star rendering
- **Status Indicators**: Online/offline với animation
- **Badge System**: "Top" badge cho shop rating >= 4.8
- **Favorite Button**: Xuất hiện khi hover
- **Modern Design**: Tailwind CSS + shadcn/ui

## Cách sử dụng

### 1. Import và sử dụng trong App.tsx
```tsx
import ShopListPage from "./pages/ShopListPage";

// Trong Routes
<Route path="/shops" element={<ShopListPage />} />
```

### 2. Sử dụng với custom props
```tsx
<ShopListPage locale="vi" />
```

### 3. Custom handlers
```tsx
const handleViewShop = (shopId: string) => {
  navigate(`/shops/${shopId}`);
};

const handleChat = (shopId: string) => {
  // Implement chat functionality
};

const handleAddToFavorites = (shopId: string) => {
  // Implement favorites functionality
};
```

## API Endpoints

### GET /api/Shops/getall-active
Trả về danh sách tất cả shop đang hoạt động.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "shop-1",
      "name": "Fashion Store VIP",
      "description": "Chuyên bán quần áo thời trang cao cấp...",
      "logo": "https://example.com/logo.jpg",
      "averageRating": 4.9,
      "reviewCount": 1250,
      "sellerId": "seller-1",
      "isActive": true,
      "createdAt": "2022-01-15T00:00:00Z",
      "updatedAt": "2024-12-01T00:00:00Z",
      "status": "online",
      "yearsActive": 3,
      "totalProducts": 450,
      "location": "Hà Nội"
    }
  ],
  "message": "Successfully retrieved active shops"
}
```

### GET /api/Shops/get-single/{id}
Trả về chi tiết shop theo ID.

## CSS Classes & Styling

### Tailwind Classes được sử dụng:
- **Layout**: `container`, `mx-auto`, `px-4`, `py-8`
- **Grid**: `grid`, `grid-cols-1`, `md:grid-cols-2`, `lg:grid-cols-3`, `xl:grid-cols-4`
- **Cards**: `bg-white`, `rounded-lg`, `shadow-lg`, `hover:shadow-xl`
- **Colors**: `text-gray-900`, `bg-rose-600`, `text-rose-400`
- **Animations**: `transition-all`, `duration-300`, `hover:scale-105`
- **Responsive**: `sm:`, `md:`, `lg:`, `xl:` breakpoints

### Custom CSS Classes:
- `.line-clamp-2`: Giới hạn text 2 dòng
- `.animate-pulse`: Pulse animation cho loading states

## Dependencies

### Required:
- `react`: ^18.3.1
- `react-router-dom`: ^6.30.1
- `@tanstack/react-query`: ^5.84.2
- `lucide-react`: ^0.539.0
- `tailwindcss`: ^3.4.17

### shadcn/ui Components:
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button`
- `Input`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Badge`
- `Skeleton`

## Testing

### Mock Data
Sử dụng mock data từ `/mock/shopData.ts` để test:

```tsx
import { mockShopsResponse } from '@/mock/shopData';

// Mock API response
const mockApi = () => Promise.resolve(mockShopsResponse);
```

### Test Cases
1. **Loading State**: Hiển thị skeleton loading
2. **Empty State**: Không có shop nào
3. **Error State**: Lỗi API
4. **Search**: Tìm kiếm theo tên
5. **Filters**: Lọc theo location, rating
6. **Sorting**: Sắp xếp theo các tiêu chí
7. **Responsive**: Test trên các breakpoints
8. **Hover Effects**: Animation và interactions

## Performance

### Optimizations:
- **React Query**: Caching và stale time 5 phút
- **useMemo**: Memoized filtering và sorting
- **Lazy Loading**: Component lazy loading
- **Image Optimization**: Alt text và proper sizing

### Bundle Size:
- Component size: ~15KB (gzipped)
- Dependencies: ~50KB (shared với app)

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility
- **ARIA Labels**: Tất cả buttons có aria-label
- **Alt Text**: Images có alt text mô tả
- **Keyboard Navigation**: Tab navigation support
- **Screen Reader**: Semantic HTML structure
- **Color Contrast**: WCAG AA compliant

## Future Enhancements
- [ ] Infinite scroll pagination
- [ ] Advanced filters (price range, categories)
- [ ] Map integration
- [ ] Real-time updates
- [ ] Analytics tracking
- [ ] A/B testing support
