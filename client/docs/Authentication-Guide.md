# 📘 HƯỚNG DẪN TRIỂN KHAI AUTHENTICATION - FRONTEND AGENT

## 🔗 API BASE URL

```
Development: https://localhost:7109/api

Production: {TO_BE_CONFIGURED}
```

## 📋 1. API ENDPOINTS CHI TIẾT

### 1.1. Đăng ký (Registration)

**Endpoint:** `POST /api/Authencation/create`

**Rate Limit:** 5 requests / 60 seconds per IP

**Request Body:**

```typescript
interface CreateUserRequest {
  email: string;              // Required, valid email format
  password: string;           // Required, min 8 chars, must contain: uppercase, lowercase, digit, special char
  confirmPassword: string;     // Required, must match password
  fullname: string;           // Required, not empty
  role: "Customer" | "Seller"; // Required, default: "Customer"
}
```

**Example Request:**

```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd123",
  "confirmPassword": "P@ssw0rd123",
  "fullname": "John Doe",
  "role": "Customer"
}
```

**Success Response (200 OK):**

```json
{
  "succeeded": true,
  "message": "Account created! Please check your email to confirm your account."
}
```

**Error Response (400 Bad Request):**

```json
{
  "succeeded": false,
  "message": "Validation errors: Password must be at least 8 characters long.; Passwords do not match."
}
```

**Rate Limit Response (429 Too Many Requests):**

```json
{
  "succeeded": false,
  "message": "Rate limit exceeded. Maximum 5 requests per 60 seconds allowed."
}
```

**Implementation Steps:**

1. Validate form inputs (client-side)
2. Show password strength indicator
3. Send POST request
4. Show loading state
5. On success: Show email confirmation modal → Redirect to verify-email page
6. On error: Display validation errors
7. Handle rate limiting: Disable submit button, show countdown timer

---

### 1.2. Đăng nhập (Login)

**Endpoint:** `POST /api/Authencation/login`

**Rate Limit:** 5 requests / 60 seconds per IP

**Request Body:**

```typescript
interface LoginRequest {
  email: string;      // Required, valid email
  password: string;  // Required
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123xyz789...",
  "role": "Customer",
  "userId": "user-id-123",
  "fullname": "John Doe"
}
```

**Error Responses:**

**Email not found (200 OK - Backend returns this with success: false):**

```json
{
  "success": false,
  "message": "Email not found",
  "token": null,
  "refreshToken": null,
  "role": "",
  "userId": "",
  "fullname": ""
}
```

**Email not confirmed (200 OK - success: false):**

```json
{
  "success": false,
  "message": "Please confirm your email before logging in. Check your email for confirmation link.",
  "token": null,
  "refreshToken": null,
  "role": "",
  "userId": "",
  "fullname": ""
}
```

**Invalid password (200 OK - success: false):**

```json
{
  "success": false,
  "message": "Invalid credentials",
  "token": null,
  "refreshToken": null,
  "role": "",
  "userId": "",
  "fullname": ""
}
```

**Implementation Steps:**

1. Validate email format
2. Show loading state
3. POST request to login
4. Check `response.success` (NOT HTTP status)
5. If success: Store tokens → Fetch user info → Redirect to dashboard
6. If email not confirmed: Show modal with "Resend Email" button
7. If invalid: Show error message
8. Handle rate limiting

---

### 1.3. Refresh Token

**Endpoint:** `POST /api/Authencation/refresh`

**Note:** Backend hiện tại sử dụng `GET /api/Authencation/refresh/{refreshToken}` (xem code hiện tại)

**Rate Limit:** Không giới hạn

**Request Body:**

```typescript
interface RefreshTokenRequest {
  refreshToken: string; // Required
}
```

**Alternative (GET method - hiện tại backend đang dùng):**

```
GET /api/Authencation/refresh/{refreshToken}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "new-jwt-token-here",
  "refreshToken": "new-refresh-token-here",
  "role": "Customer",
  "userId": "user-id-123",
  "fullname": "John Doe"
}
```

**Error Response (200 OK - success: false):**

```json
{
  "success": false,
  "message": "Invalid token",
  "token": null,
  "refreshToken": null,
  "role": "",
  "userId": "",
  "fullname": ""
}
```

**Implementation:**

- Tự động gọi khi JWT sắp hết hạn (trong 5 phút)
- Sử dụng Axios interceptor
- Cập nhật tokens trong storage sau khi refresh thành công

---

### 1.4. Logout

**Endpoint:** `POST /api/Authencation/logout`

**Authorization:** Required (Bearer token)

**Request Headers:**

```
Authorization: Bearer {accessToken}
```

**Request Body:**

```typescript
interface LogoutRequest {
  refreshToken: string; // Required
}
```

**Success Response (200 OK):**

```json
{
  "succeeded": true,
  "message": "Logged out successfully"
}
```

**Implementation:**

1. Gửi refresh token để revoke
2. Xóa tokens khỏi storage
3. Clear user state
4. Redirect to login page

---

### 1.5. Lấy thông tin user hiện tại

**Endpoint:** `GET /api/Authencation/me`

**Authorization:** Required

**Success Response (200 OK):**

```json
{
  "id": "user-id-123",
  "email": "user@example.com",
  "fullName": "John Doe",
  "phoneNumber": "+84123456789",
  "emailConfirmed": true,
  "roles": ["Customer"]
}
```

**Error Response (401 Unauthorized):**

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401
}
```

---

### 1.6. Xác nhận Email

**Endpoint:** `POST /api/Authencation/confirm-email`

**Request Body:**

```typescript
interface ConfirmEmailRequest {
  email: string;  // Required
  token: string;   // Required (from email link)
}
```

**Success Response (200 OK):**

```json
{
  "succeeded": true,
  "message": "Email confirmed successfully"
}
```

**Implementation:**

- Token được gửi qua email link
- URL format: `/verify-email?email=xxx&token=xxx`
- Sau khi confirm thành công → Redirect to login

---

### 1.7. Gửi lại Email Confirmation

**Endpoint:** `POST /api/Authencation/send-email-confirmation`

**Request Body:**

```typescript
interface SendEmailConfirmationRequest {
  email: string; // Required
}
```

**Success Response (200 OK):**

```json
{
  "succeeded": true,
  "message": "Confirmation email sent"
}
```

---

### 1.8. Quên mật khẩu

**Endpoint:** `POST /api/Authencation/forgot-password`

**Request Body:**

```typescript
interface ForgotPasswordRequest {
  email: string; // Required
}
```

**Success Response (200 OK):**

```json
{
  "succeeded": true,
  "message": "If email exists, password reset link has been sent"
}
```

**Note:** Backend luôn trả về success (không tiết lộ email có tồn tại không - security)

---

### 1.9. Reset mật khẩu

**Endpoint:** `POST /api/Authencation/reset-password`

**Request Body:**

```typescript
interface ResetPasswordRequest {
  email: string;           // Required
  token: string;           // Required (from email link)
  newPassword: string;     // Required
  confirmPassword: string; // Required, must match newPassword
}
```

**Success Response (200 OK):**

```json
{
  "succeeded": true,
  "message": "Password reset successfully"
}
```

---

### 1.10. Đổi mật khẩu

**Endpoint:** `POST /api/Authencation/change-password`

**Authorization:** Required

**Request Body:**

```typescript
interface ChangePasswordRequest {
  currentPassword: string;  // Required
  newPassword: string;       // Required
  confirmPassword: string;   // Required, must match newPassword
}
```

---

### 1.11. Cập nhật Profile

**Endpoint:** `PUT /api/Authencation/profile`

**Authorization:** Required

**Request Body:**

```typescript
interface UpdateProfileRequest {
  fullName?: string;      // Optional
  phoneNumber?: string;   // Optional
}
```

---

## 💻 2. CODE IMPLEMENTATION TEMPLATES

### 2.1. API Client Setup

```typescript
// api/client.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7109/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies if using
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Auto refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        const response = await axios.post(
          `${API_BASE_URL}/Authencation/refresh`,
          { refreshToken }
        );
        const { token, refreshToken: newRefreshToken } = response.data;
        if (token && newRefreshToken) {
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      error.retryAfter = parseInt(retryAfter);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### 2.2. Auth Service

```typescript
// services/authService.ts
import apiClient from '@/api/client';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullname: string;
  role: 'Customer' | 'Seller';
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string | null;
  refreshToken: string | null;
  role: string;
  userId: string;
  fullname: string;
}

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  emailConfirmed: boolean;
  roles: string[];
}

export interface ServiceResponse {
  succeeded: boolean;
  message: string;
}

class AuthService {
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
  };

  // Registration
  async createUser(data: CreateUserRequest): Promise<ServiceResponse> {
    const response = await apiClient.post('/Authencation/create', data);
    return response.data;
  }

  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/Authencation/login', credentials);
    const data: LoginResponse = response.data;
    
    if (data.success && data.token && data.refreshToken) {
      this.setTokens(data.token, data.refreshToken);
    }
    
    return data;
  }

  // Logout
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    try {
      if (refreshToken) {
        await apiClient.post(
          '/Authencation/logout',
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${this.getAccessToken()}`,
            },
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Get current user
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const response = await apiClient.get('/Authencation/me');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Refresh token
  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await apiClient.post('/Authencation/refresh', {
      refreshToken,
    });
    const data: LoginResponse = response.data;
    if (data.success && data.token && data.refreshToken) {
      this.setTokens(data.token, data.refreshToken);
    }
    return data;
  }

  // Confirm email
  async confirmEmail(email: string, token: string): Promise<ServiceResponse> {
    const response = await apiClient.post('/Authencation/confirm-email', {
      email,
      token,
    });
    return response.data;
  }

  // Send email confirmation
  async sendEmailConfirmation(email: string): Promise<ServiceResponse> {
    const response = await apiClient.post('/Authencation/send-email-confirmation', {
      email,
    });
    return response.data;
  }

  // Forgot password
  async forgotPassword(email: string): Promise<ServiceResponse> {
    const response = await apiClient.post('/Authencation/forgot-password', {
      email,
    });
    return response.data;
  }

  // Reset password
  async resetPassword(data: {
    email: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ServiceResponse> {
    const response = await apiClient.post('/Authencation/reset-password', data);
    return response.data;
  }

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ServiceResponse> {
    const response = await apiClient.post(
      '/Authencation/change-password',
      data
    );
    return response.data;
  }

  // Update profile
  async updateProfile(data: {
    fullName?: string;
    phoneNumber?: string;
  }): Promise<ServiceResponse> {
    const response = await apiClient.put('/Authencation/profile', data);
    return response.data;
  }

  // Token management
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
  }

  clearTokens(): void {
    localStorage.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Check if token is expiring soon (within 5 minutes)
  isTokenExpiringSoon(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      const fiveMinutes = 5 * 60 * 1000;
      return Date.now() > (expiry - fiveMinutes);
    } catch {
      return true;
    }
  }
}

export const authService = new AuthService();
export default authService;
```

---

### 2.3. Rate Limiting Handler

```typescript
// utils/rateLimitHandler.ts
class RateLimitHandler {
  private cooldownEndTime: number = 0;
  private isCooldownActive: boolean = false;

  handleRateLimitError(retryAfter: number): void {
    this.cooldownEndTime = Date.now() + retryAfter * 1000;
    this.isCooldownActive = true;
    // Show toast/notification
    this.showRateLimitMessage(retryAfter);
    // Auto-enable after cooldown
    setTimeout(() => {
      this.isCooldownActive = false;
    }, retryAfter * 1000);
  }

  canMakeRequest(): boolean {
    return !this.isCooldownActive || Date.now() >= this.cooldownEndTime;
  }

  getRemainingCooldown(): number {
    if (!this.isCooldownActive) return 0;
    const remaining = Math.ceil((this.cooldownEndTime - Date.now()) / 1000);
    return Math.max(0, remaining);
  }

  private showRateLimitMessage(retryAfter: number): void {
    // Use your toast/notification library
    console.warn(`Rate limit exceeded. Please wait ${retryAfter} seconds.`);
  }
}

export const rateLimitHandler = new RateLimitHandler();
```

---

### 2.4. Error Handler

```typescript
// utils/errorHandler.ts
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
    'Rate limit exceeded': 'Bạn đã gửi quá nhiều requests. Vui lòng đợi một chút.',
    'Token expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    'Invalid token': 'Token không hợp lệ. Vui lòng đăng nhập lại.',
    'User not found': 'Người dùng không tồn tại.',
    'Email is already confirmed': 'Email đã được xác nhận rồi.',
  };

  handleError(error: any): ApiError {
    // Network error
    if (!error.response) {
      return {
        type: 'NETWORK',
        message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.',
      };
    }

    const status = error.response.status;
    const data = error.response.data;
    const message = data?.message || error.message;

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

  private getUserFriendlyMessage(message: string): string {
    return this.ERROR_MESSAGES[message] || message;
  }

  private parseFieldErrors(data: any): Record<string, string> {
    // Parse validation errors if needed
    return {};
  }
}

export const errorHandler = new ErrorHandler();
```

---

## 🎨 3. UI COMPONENTS TEMPLATES

### 3.1. Login Form (React Example)

```tsx
// components/auth/LoginForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import { errorHandler } from '@/utils/errorHandler';
import { rateLimitHandler } from '@/utils/rateLimitHandler';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!rateLimitHandler.canMakeRequest()) {
      const remaining = rateLimitHandler.getRemainingCooldown();
      setError(`Vui lòng đợi ${remaining} giây trước khi thử lại.`);
      setLoading(false);
      return;
    }

    try {
      const response = await authService.login({ email, password });

      if (!response.success) {
        // Check specific error types
        if (response.message.includes('confirm your email')) {
          setShowEmailModal(true);
        } else {
          setError(errorHandler.handleError({ response: { data: response } }).message);
        }
        return;
      }

      // Login successful
      const user = await authService.getCurrentUser();
      if (user) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      const apiError = errorHandler.handleError(error);
      setError(apiError.message);
      if (apiError.type === 'RATE_LIMIT' && apiError.retryAfter) {
        rateLimitHandler.handleRateLimitError(apiError.retryAfter);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      await authService.sendEmailConfirmation(email);
      alert('Email xác nhận đã được gửi lại!');
    } catch (error) {
      console.error('Resend email error:', error);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || !rateLimitHandler.canMakeRequest()}
          />
        </div>
        <div>
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || !rateLimitHandler.canMakeRequest()}
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button
          type="submit"
          disabled={loading || !rateLimitHandler.canMakeRequest()}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
        {!rateLimitHandler.canMakeRequest() && (
          <div className="rate-limit-warning">
            Vui lòng đợi {rateLimitHandler.getRemainingCooldown()} giây
          </div>
        )}
      </form>

      {/* Email Confirmation Modal */}
      {showEmailModal && (
        <div className="modal">
          <h3>Email chưa được xác nhận</h3>
          <p>Vui lòng xác nhận email trước khi đăng nhập.</p>
          <button onClick={handleResendEmail}>Gửi lại email xác nhận</button>
          <button onClick={() => setShowEmailModal(false)}>Đóng</button>
        </div>
      )}
    </>
  );
}
```

---

## ✅ 4. CHECKLIST TRIỂN KHAI

### Phase 1: Setup cơ bản

- [ ] Tạo API client với interceptors
- [ ] Tạo AuthService với tất cả methods
- [ ] Setup error handler
- [ ] Setup rate limit handler
- [ ] Configure routing

### Phase 2: Authentication flows

- [ ] Registration form với validation
- [ ] Login form với error handling
- [ ] Email confirmation flow
- [ ] Logout functionality
- [ ] Protected routes

### Phase 3: Token management

- [ ] Auto-refresh token setup
- [ ] Token expiration check
- [ ] Secure token storage
- [ ] Token cleanup on logout

### Phase 4: UX enhancements

- [ ] Loading states
- [ ] Error messages
- [ ] Rate limit UI feedback
- [ ] Email confirmation modal
- [ ] Password strength indicator

---

## 📝 5. IMPORTANT NOTES

### ⚠️ Lưu ý quan trọng:

1. **Login Response**: Kiểm tra `response.success` thay vì HTTP status code
   - Backend có thể trả về 200 OK nhưng `success: false`

2. **Email Confirmation**: Bắt buộc phải confirm email trước khi login
   - Luôn kiểm tra `emailConfirmed` trong user info

3. **Rate Limiting**: 
   - 5 requests / 60 seconds cho login và register
   - Hiển thị countdown timer cho user

4. **Token Expiry**:
   - JWT: 2 hours
   - Refresh Token: 7 days
   - Auto-refresh khi còn 5 phút

5. **Error Messages**: 
   - Backend trả về tiếng Anh
   - Frontend cần translate sang tiếng Việt

6. **CORS**: 
   - Backend đã config cho `localhost:5173`
   - Nếu dùng port khác, cần update backend

7. **Refresh Token Endpoint**:
   - Backend hiện tại sử dụng `GET /api/Authencation/refresh/{refreshToken}`
   - Có thể backend sẽ update sang `POST /api/Authencation/refresh` với body
   - Cần kiểm tra backend để đảm bảo đúng endpoint

---

## 🔍 6. TESTING GUIDE

### Test Cases cần test:

```typescript
// Test Login Flow
✅ Login với valid credentials → Success
✅ Login với invalid password → Error message
✅ Login với email chưa confirmed → Show modal
✅ Login khi rate limited → Show countdown
✅ Login với network error → Show error

// Test Registration Flow
✅ Register với valid data → Success + Email sent
✅ Register với invalid password → Validation errors
✅ Register với existing email → Error
✅ Register khi rate limited → Show countdown

// Test Token Management
✅ Auto-refresh token trước khi expire
✅ Logout revokes token
✅ Invalid token redirects to login
✅ Token được lưu securely

// Test Email Confirmation
✅ Click email link → Confirm → Success
✅ Expired token → Error
✅ Resend email → New email sent
```

---

## 🔗 7. INTEGRATION với Codebase Hiện Tại

### So sánh với Implementation Hiện Tại

Dự án đã có một số implementation cơ bản:

**File hiện tại:**
- `client/contexts/AuthContext.tsx` - Context provider cho auth
- `client/services/axiosClient.ts` - Axios client với interceptors
- `client/lib/api.ts` - API functions

**Những gì cần bổ sung/thay đổi:**

1. **Thêm AuthService class** - Tổ chức lại các auth methods thành một service class
2. **Cải thiện Error Handling** - Thêm error handler utility với translation
3. **Rate Limiting Handler** - Thêm rate limit handler cho UX tốt hơn
4. **Email Confirmation Flow** - Triển khai đầy đủ flow xác nhận email
5. **Password Reset Flow** - Triển khai forgot/reset password
6. **Profile Management** - Thêm update profile và change password

### Migration Steps

1. **Bước 1**: Tạo `services/authService.ts` với đầy đủ methods
2. **Bước 2**: Update `axiosClient.ts` để align với template (nếu cần)
3. **Bước 3**: Tạo `utils/errorHandler.ts` và `utils/rateLimitHandler.ts`
4. **Bước 4**: Update `AuthContext.tsx` để sử dụng `authService`
5. **Bước 5**: Update Login/Register pages với error handling và rate limiting
6. **Bước 6**: Thêm các pages mới: VerifyEmail, ForgotPassword, ResetPassword

---

## 📚 8. TÀI LIỆU THAM KHẢO

- [React Router Documentation](https://reactrouter.com/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

Tài liệu này bao gồm:

- ✅ Tất cả API endpoints với examples
- ✅ Code templates sẵn sàng sử dụng
- ✅ Error handling patterns
- ✅ UI component templates
- ✅ Implementation checklist
- ✅ Testing guide
- ✅ Integration guide với codebase hiện tại

**Lưu ý**: Đây là tài liệu tham khảo chi tiết. Khi triển khai, cần kiểm tra và đối chiếu với backend API thực tế để đảm bảo tính nhất quán.
