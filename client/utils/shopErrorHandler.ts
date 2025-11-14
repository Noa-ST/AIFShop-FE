interface ApiError {
  message: string;
  statusCode?: number;
}

export class ShopErrorHandler {
  private static readonly SHOP_ERROR_MESSAGES: Record<string, string> = {
    'Shop not found': 'Không tìm thấy shop',
    'Shop not found.': 'Không tìm thấy shop',
    'Seller này đã có shop': 'Bạn đã có shop. Mỗi seller chỉ được tạo 1 shop.',
    'Mỗi seller chỉ được tạo 1 shop': 'Bạn đã có shop. Mỗi seller chỉ được tạo 1 shop.',
    'Bạn không có quyền tạo shop cho seller khác': 'Bạn không có quyền tạo shop cho người khác',
    'Người dùng này không có quyền tạo shop': 'Bạn không có quyền tạo shop. Vui lòng liên hệ admin.',
    'Bạn không có quyền cập nhật shop này': 'Bạn chỉ có thể cập nhật shop của chính mình',
    'Bạn không có quyền xóa shop này': 'Bạn chỉ có thể xóa shop của chính mình',
  };

  private static readonly SHOP_CATEGORY_ERROR_MESSAGES: Record<string, string> = {
    'Không tìm thấy danh mục': 'Danh mục không tồn tại',
    'không có quyền truy cập': 'Bạn không có quyền truy cập danh mục này',
    'Người dùng hiện tại không phải là Seller hoặc chưa có Shop': 'Bạn không phải là Seller hoặc chưa có Shop',
    'đã tồn tại ở': 'Tên danh mục đã tồn tại. Vui lòng chọn tên khác',
    'Tên danh mục': 'Tên danh mục đã tồn tại. Vui lòng chọn tên khác',
    'Không thể xóa danh mục. Có': 'Không thể xóa vì có danh mục con',
    'Danh mục cha không thể là chính nó': 'Không thể đặt danh mục cha là chính nó',
    'vòng lặp tham chiếu': 'Không thể tạo vòng lặp phụ thuộc',
    'ParentId không hợp lệ': 'Danh mục cha không hợp lệ hoặc không thuộc Shop này',
  };

  static handleShopError(error: any): ApiError {
    const message = error.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
    const statusCode = error.response?.status || error.response?.data?.statusCode;

    // Try to find a user-friendly message
    let userFriendlyMessage = message;
    
    for (const [key, value] of Object.entries(this.SHOP_ERROR_MESSAGES)) {
      if (message.includes(key)) {
        userFriendlyMessage = value;
        break;
      }
    }

    return {
      message: userFriendlyMessage,
      statusCode,
    };
  }

  static handleShopCategoryError(error: any): ApiError {
    const message = error.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
    const statusCode = error.response?.status || error.response?.data?.statusCode;

    // Try to find a user-friendly message
    let userFriendlyMessage = message;
    
    for (const [key, value] of Object.entries(this.SHOP_CATEGORY_ERROR_MESSAGES)) {
      if (message.includes(key)) {
        userFriendlyMessage = value;
        break;
      }
    }

    return {
      message: userFriendlyMessage,
      statusCode,
    };
  }
}

