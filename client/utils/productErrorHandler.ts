import { errorHandler, ApiError } from '@/utils/errorHandler';

export class ProductErrorHandler {
  private static readonly PRODUCT_ERROR_MESSAGES: Record<string, string> = {
    'Product not found': 'Không tìm thấy sản phẩm',
    'Shop not found': 'Không tìm thấy cửa hàng',
    'Category not found': 'Không tìm thấy danh mục',
    'You are not the owner of this shop': 'Bạn không phải chủ cửa hàng này',
    'Cannot delete product with existing orders': 'Không thể xóa sản phẩm đã có đơn hàng',
    'Product status cannot be changed': 'Không thể thay đổi trạng thái sản phẩm',
    'Invalid status transition': 'Chuyển trạng thái không hợp lệ',
  };

  static handleError(error: any): ApiError {
    const baseError = errorHandler.handleError(error);
    const message = error.response?.data?.message || error.message;
    const userFriendlyMessage = this.PRODUCT_ERROR_MESSAGES[message] || baseError.message;

    return {
      ...baseError,
      message: userFriendlyMessage,
    };
  }

  static handleImageError(error: any): string {
    if (error.message.includes('Base64')) {
      return 'Định dạng ảnh không hợp lệ. Vui lòng chọn ảnh khác.';
    }
    if (error.message.includes('size') || error.message.includes('Size')) {
      return 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.';
    }
    return 'Lỗi khi tải ảnh. Vui lòng thử lại.';
  }
}
