export interface ApiError {
  type: 'VALIDATION' | 'AUTH' | 'RATE_LIMIT' | 'SERVER' | 'NETWORK' | 'UNKNOWN';
  message: string;
  fieldErrors?: Record<string, string>;
  retryAfter?: number;
}

export class ErrorHandler {
  private readonly ERROR_MESSAGES: Record<string, string> = {
    'Email not found': 'Email không tồn tại. Vui lòng kiểm tra lại.',
    'Invalid credentials': 'Email hoặc mật khẩu không đúng.',
    'Please confirm your email': 'Vui lòng xác nhận email trước khi đăng nhập.',
    'Please confirm your email before logging in': 'Vui lòng xác nhận email trước khi đăng nhập. Kiểm tra email của bạn để xác nhận tài khoản.',
    'Rate limit exceeded': 'Bạn đã gửi quá nhiều requests. Vui lòng đợi một chút.',
    'Token expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    'Invalid token': 'Token không hợp lệ. Vui lòng đăng nhập lại.',
    'User not found': 'Người dùng không tồn tại.',
    'Email is already confirmed': 'Email đã được xác nhận rồi.',
    'Password must be at least 8 characters long': 'Mật khẩu phải có ít nhất 8 ký tự.',
    'Passwords do not match': 'Mật khẩu không khớp.',
  };

  handleError(error: any): ApiError {
    // Network error
    if (!error.response && !error.message) {
      return {
        type: 'NETWORK',
        message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.',
      };
    }

    // Handle login response with success: false (200 OK but error)
    if (error.response?.data?.success === false) {
      const message = error.response.data.message || error.message || 'Đã xảy ra lỗi';
      return {
        type: 'AUTH',
        message: this.getUserFriendlyMessage(message),
      };
    }

    // Handle standard HTTP errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message = data?.message || error.message || 'Đã xảy ra lỗi';

      switch (status) {
        case 400:
          return {
            type: 'VALIDATION',
            message: this.getUserFriendlyMessage(message),
            fieldErrors: this.parseFieldErrors(data),
          };
        case 401:
          return {
            type: 'AUTH',
            message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          };
        case 403:
          return {
            type: 'AUTH',
            message: 'Bạn không có quyền thực hiện hành động này.',
          };
        case 429:
          return {
            type: 'RATE_LIMIT',
            message: 'Bạn đã gửi quá nhiều requests. Vui lòng đợi.',
            retryAfter: error.retryAfter || 60,
          };
        case 500:
          return {
            type: 'SERVER',
            message: 'Lỗi server. Vui lòng thử lại sau.',
          };
        default:
          return {
            type: 'UNKNOWN',
            message: this.getUserFriendlyMessage(message) || 'Đã xảy ra lỗi không xác định.',
          };
      }
    }

    // Generic error
    return {
      type: 'UNKNOWN',
      message: this.getUserFriendlyMessage(error.message) || 'Đã xảy ra lỗi không xác định.',
    };
  }

  private getUserFriendlyMessage(message: string): string {
    // Try exact match first
    if (this.ERROR_MESSAGES[message]) {
      return this.ERROR_MESSAGES[message];
    }

    // Try partial match
    for (const [key, value] of Object.entries(this.ERROR_MESSAGES)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    return message;
  }

  private parseFieldErrors(data: any): Record<string, string> {
    // Parse validation errors if backend returns field-specific errors
    if (data?.errors && typeof data.errors === 'object') {
      const fieldErrors: Record<string, string> = {};
      for (const [field, messages] of Object.entries(data.errors)) {
        if (Array.isArray(messages) && messages.length > 0) {
          fieldErrors[field] = messages[0] as string;
        }
      }
      return fieldErrors;
    }
    return {};
  }
}

export const errorHandler = new ErrorHandler();
