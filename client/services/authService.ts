import axiosClient from '@/services/axiosClient';
import { ACCESS_TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from '@/services/axiosClient';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                     import.meta.env.VITE_API_BASE || 
                     'https://aifshop-backend.onrender.com';

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
  username?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  role: string;
  userId?: string;
  id?: string;
  fullname?: string;
  name?: string;
  user?: {
    id?: string;
  };
  data?: {
    id?: string;
  };
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
  success?: boolean;
  message: string;
}

class AuthService {
  readonly STORAGE_KEYS = {
    ACCESS_TOKEN: ACCESS_TOKEN_STORAGE_KEY,
    REFRESH_TOKEN: REFRESH_TOKEN_STORAGE_KEY,
  };

  // Registration
  async createUser(data: CreateUserRequest): Promise<ServiceResponse> {
    const payload = {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      fullname: data.fullname,
      role: data.role,
      username: data.username ?? data.email,
    };
    const response = await axiosClient.post('/api/Authencation/create', payload, {
      timeout: 60000, // tăng timeout cho luồng đăng ký
    });
    return response.data;
  }

  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await axiosClient.post('/api/Authencation/login', credentials);
    const data: LoginResponse = response.data;
    
    // Handle different response formats
    const accessToken = data.accessToken || data.token;
    const refreshToken = data.refreshToken;
    
    if (data.success && accessToken && refreshToken) {
      this.setTokens(accessToken, refreshToken);
      
      // Store additional user info
      if (data.role) {
        localStorage.setItem('aifshop_role', data.role);
      }
      if (credentials.email) {
        localStorage.setItem('aifshop_email', credentials.email);
      }
      if (data.fullname || data.name) {
        localStorage.setItem('aifshop_fullname', data.fullname || data.name || '');
      }
      const userId = data.userId || data.id || data.user?.id || data.data?.id;
      if (userId) {
        localStorage.setItem('aifshop_userid', String(userId));
      }
    }
    
    return data;
  }

  // Logout
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    const accessToken = this.getAccessToken();
    
    try {
      if (refreshToken && accessToken) {
        await axiosClient.post(
          '/api/Authencation/logout',
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
      this.clearUserInfo();
    }
  }

  // Get current user
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const response = await axiosClient.get('/api/Authencation/me');
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

    try {
      // Try GET endpoint first (current backend implementation)
      const response = await axios.get(
        `/api/Authencation/refresh/${encodeURIComponent(refreshToken)}`
      );

      const responseData = response?.data?.data || response?.data || {};
      const accessToken = responseData.accessToken || responseData.token;
      const newRefreshToken = responseData.refreshToken;

      if (accessToken) {
        this.setTokens(accessToken, newRefreshToken || refreshToken);
        
        // Update user info if available
        if (responseData.role) {
          localStorage.setItem('aifshop_role', responseData.role);
        }
        if (responseData.email) {
          localStorage.setItem('aifshop_email', responseData.email);
        }
        if (responseData.fullname) {
          localStorage.setItem('aifshop_fullname', responseData.fullname);
        }
        const userId = responseData.userId || responseData.id;
        if (userId) {
          localStorage.setItem('aifshop_userid', String(userId));
        }

        return {
          success: true,
          message: 'Token refreshed successfully',
          token: accessToken,
          accessToken,
          refreshToken: newRefreshToken || refreshToken,
          role: responseData.role || '',
          userId: String(userId || ''),
          fullname: responseData.fullname || '',
        };
      }
      
      throw new Error('Invalid refresh token response');
    } catch (error: any) {
      // If GET fails, try POST (for future compatibility)
      try {
        const response = await axios.post(`/api/Authencation/refresh`, {
          refreshToken,
        });
        const data: LoginResponse = response.data;
        if (data.success && data.token && data.refreshToken) {
          this.setTokens(data.token, data.refreshToken);
          return data;
        }
      } catch (postError) {
        console.error('Refresh token failed:', postError);
      }
      
      throw error;
    }
  }

  // Confirm email
  async confirmEmail(email: string, token: string): Promise<ServiceResponse> {
    const response = await axiosClient.post('/api/Authencation/confirm-email', {
      email,
      token,
    });
    return response.data;
  }

  // Send email confirmation
  async sendEmailConfirmation(email: string): Promise<ServiceResponse> {
    const response = await axiosClient.post('/api/Authencation/send-email-confirmation', {
      email,
    });
    return response.data;
  }

  // Forgot password
  async forgotPassword(email: string): Promise<ServiceResponse> {
    const response = await axiosClient.post('/api/Authencation/forgot-password', {
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
    const response = await axiosClient.post('/api/Authencation/reset-password', data);
    return response.data;
  }

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ServiceResponse> {
    const response = await axiosClient.post(
      '/api/Authencation/change-password',
      data
    );
    return response.data;
  }

  // Update profile
  async updateProfile(data: {
    fullName?: string;
    phoneNumber?: string;
  }): Promise<ServiceResponse> {
    const response = await axiosClient.put('/api/Authencation/profile', data);
    return response.data;
  }

  // Token management
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    
    // Update axios client header
    axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
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
    delete axiosClient.defaults.headers.common['Authorization'];
  }

  clearUserInfo(): void {
    localStorage.removeItem('aifshop_role');
    localStorage.removeItem('aifshop_email');
    localStorage.removeItem('aifshop_fullname');
    localStorage.removeItem('aifshop_userid');
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
