// Example JSON response for /api/Shops/getall-active
export const mockShopsResponse = {
  "success": true,
  "data": [
    {
      "id": "shop-1",
      "name": "Fashion Store VIP",
      "description": "Chuyên bán quần áo thời trang cao cấp cho nam nữ. Chất lượng tốt, giá cả hợp lý.",
      "logo": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop&crop=center",
      "averageRating": 4.9,
      "reviewCount": 1250,
      "sellerId": "seller-1",
      "seller": {
        "id": "seller-1",
        "fullname": "Nguyễn Văn A",
        "email": "seller1@example.com"
      },
      "isActive": true,
      "createdAt": "2022-01-15T00:00:00Z",
      "updatedAt": "2024-12-01T00:00:00Z",
      "status": "online",
      "yearsActive": 3,
      "totalProducts": 450,
      "location": "Hà Nội"
    },
    {
      "id": "shop-2",
      "name": "Tech Gadgets Pro",
      "description": "Cửa hàng điện tử và phụ kiện công nghệ hàng đầu. Cam kết chất lượng và bảo hành chính hãng.",
      "logo": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center",
      "averageRating": 4.7,
      "reviewCount": 890,
      "sellerId": "seller-2",
      "seller": {
        "id": "seller-2",
        "fullname": "Trần Thị B",
        "email": "seller2@example.com"
      },
      "isActive": true,
      "createdAt": "2021-06-20T00:00:00Z",
      "updatedAt": "2024-11-28T00:00:00Z",
      "status": "offline",
      "yearsActive": 4,
      "totalProducts": 320,
      "location": "TP. Hồ Chí Minh"
    },
    {
      "id": "shop-3",
      "name": "Home & Living",
      "description": "Nội thất và đồ gia dụng cho ngôi nhà của bạn. Thiết kế hiện đại, chất lượng cao.",
      "logo": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop&crop=center",
      "averageRating": 4.8,
      "reviewCount": 2100,
      "sellerId": "seller-3",
      "seller": {
        "id": "seller-3",
        "fullname": "Lê Văn C",
        "email": "seller3@example.com"
      },
      "isActive": true,
      "createdAt": "2020-03-10T00:00:00Z",
      "updatedAt": "2024-12-02T00:00:00Z",
      "status": "online",
      "yearsActive": 5,
      "totalProducts": 680,
      "location": "Đà Nẵng"
    },
    {
      "id": "shop-4",
      "name": "Beauty & Cosmetics",
      "description": "Mỹ phẩm và chăm sóc da chuyên nghiệp. Sản phẩm chính hãng từ các thương hiệu nổi tiếng.",
      "logo": "https://images.unsplash.com/photo-1596462502278-4bf4a3a3f4b3?w=200&h=200&fit=crop&crop=center",
      "averageRating": 4.6,
      "reviewCount": 1560,
      "sellerId": "seller-4",
      "seller": {
        "id": "seller-4",
        "fullname": "Phạm Thị D",
        "email": "seller4@example.com"
      },
      "isActive": true,
      "createdAt": "2023-08-05T00:00:00Z",
      "updatedAt": "2024-11-30T00:00:00Z",
      "status": "online",
      "yearsActive": 2,
      "totalProducts": 280,
      "location": "Hải Phòng"
    },
    {
      "id": "shop-5",
      "name": "Sports & Fitness",
      "description": "Thể thao và fitness equipment. Đồ tập gym, dụng cụ thể thao chất lượng cao.",
      "logo": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center",
      "averageRating": 4.5,
      "reviewCount": 750,
      "sellerId": "seller-5",
      "seller": {
        "id": "seller-5",
        "fullname": "Hoàng Văn E",
        "email": "seller5@example.com"
      },
      "isActive": true,
      "createdAt": "2022-11-12T00:00:00Z",
      "updatedAt": "2024-11-25T00:00:00Z",
      "status": "offline",
      "yearsActive": 2,
      "totalProducts": 190,
      "location": "Cần Thơ"
    },
    {
      "id": "shop-6",
      "name": "Books & Stationery",
      "description": "Sách và văn phòng phẩm. Từ sách giáo khoa đến tiểu thuyết, đồ dùng học tập đầy đủ.",
      "logo": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop&crop=center",
      "averageRating": 4.4,
      "reviewCount": 420,
      "sellerId": "seller-6",
      "seller": {
        "id": "seller-6",
        "fullname": "Vũ Thị F",
        "email": "seller6@example.com"
      },
      "isActive": true,
      "createdAt": "2023-02-18T00:00:00Z",
      "updatedAt": "2024-11-20T00:00:00Z",
      "status": "online",
      "yearsActive": 2,
      "totalProducts": 850,
      "location": "Hà Nội"
    }
  ],
  "message": "Successfully retrieved active shops"
};

// Example JSON response for /api/Shops/get-single/{id}
export const mockShopDetailResponse = {
  "success": true,
  "data": {
    "id": "shop-1",
    "name": "Fashion Store VIP",
    "description": "Chuyên bán quần áo thời trang cao cấp cho nam nữ. Chất lượng tốt, giá cả hợp lý. Chúng tôi cam kết mang đến những sản phẩm chất lượng nhất với giá cả cạnh tranh.",
    "logo": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop&crop=center",
    "averageRating": 4.9,
    "reviewCount": 1250,
    "sellerId": "seller-1",
    "seller": {
      "id": "seller-1",
      "fullname": "Nguyễn Văn A",
      "email": "seller1@example.com"
    },
    "isActive": true,
    "createdAt": "2022-01-15T00:00:00Z",
    "updatedAt": "2024-12-01T00:00:00Z",
    "status": "online",
    "yearsActive": 3,
    "totalProducts": 450,
    "location": "Hà Nội",
    "businessHours": "8:00 - 22:00",
    "contactPhone": "0123456789",
    "socialMedia": {
      "facebook": "https://facebook.com/fashionstorevip",
      "instagram": "https://instagram.com/fashionstorevip"
    },
    "categories": [
      { "id": "cat-1", "name": "Áo thun" },
      { "id": "cat-2", "name": "Quần jean" },
      { "id": "cat-3", "name": "Áo sơ mi" }
    ]
  },
  "message": "Successfully retrieved shop details"
};
