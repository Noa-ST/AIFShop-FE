import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  Settings,
  Save,
  Bell,
  Shield,
  Globe,
  Mail,
  Database,
  Key,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

// Mock settings interface
interface PlatformSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    adminEmail: string;
    notificationFrequency: string;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    loginAttempts: number;
    ipWhitelist: string[];
  };
  business: {
    currency: string;
    taxRate: number;
    commissionRate: number;
    minOrderAmount: number;
    maxOrderAmount: number;
  };
  features: {
    userRegistration: boolean;
    sellerRegistration: boolean;
    productReviews: boolean;
    wishlist: boolean;
    coupons: boolean;
    analytics: boolean;
  };
}

// Mock initial settings
const initialSettings: PlatformSettings = {
  general: {
    siteName: "AIFShop",
    siteDescription: "Nền tảng thương mại điện tử hàng đầu",
    siteUrl: "https://aifshop.com",
    timezone: "Asia/Ho_Chi_Minh",
    language: "vi",
    maintenanceMode: false,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    adminEmail: "admin@aifshop.com",
    notificationFrequency: "daily",
  },
  security: {
    twoFactorAuth: true,
    sessionTimeout: 30,
    passwordMinLength: 8,
    loginAttempts: 5,
    ipWhitelist: [],
  },
  business: {
    currency: "VND",
    taxRate: 10,
    commissionRate: 5,
    minOrderAmount: 50000,
    maxOrderAmount: 50000000,
  },
  features: {
    userRegistration: true,
    sellerRegistration: true,
    productReviews: true,
    wishlist: true,
    coupons: true,
    analytics: true,
  },
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState("general");

  // Mock mutation for saving settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: PlatformSettings) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return newSettings;
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã lưu cài đặt thành công.",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Lưu cài đặt thất bại.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleGeneralChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        [field]: value,
      },
    }));
  };

  const handleNotificationChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
  };

  const handleSecurityChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [field]: value,
      },
    }));
  };

  const handleBusinessChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      business: {
        ...prev.business,
        [field]: value,
      },
    }));
  };

  const handleFeatureChange = (field: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [field]: value,
      },
    }));
  };

  const tabs = [
    { id: "general", label: "Tổng quan", icon: Settings },
    { id: "notifications", label: "Thông báo", icon: Bell },
    { id: "security", label: "Bảo mật", icon: Shield },
    { id: "business", label: "Kinh doanh", icon: Globe },
    { id: "features", label: "Tính năng", icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cài đặt Hệ thống</h2>
        <p className="text-muted-foreground">
          Quản lý cài đặt và cấu hình của nền tảng.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Danh mục</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-rose-50 text-rose-700 border-r-2 border-rose-200"
                        : "text-gray-700 hover:bg-rose-50 hover:text-rose-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* General Settings */}
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt Tổng quan</CardTitle>
                <CardDescription>
                  Cấu hình thông tin cơ bản của nền tảng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Tên trang web</Label>
                    <Input
                      id="siteName"
                      value={settings.general.siteName}
                      onChange={(e) =>
                        handleGeneralChange("siteName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl">URL trang web</Label>
                    <Input
                      id="siteUrl"
                      value={settings.general.siteUrl}
                      onChange={(e) =>
                        handleGeneralChange("siteUrl", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Mô tả trang web</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={(e) =>
                      handleGeneralChange("siteDescription", e.target.value)
                    }
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Múi giờ</Label>
                    <Select
                      value={settings.general.timezone}
                      onValueChange={(value) =>
                        handleGeneralChange("timezone", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Ho_Chi_Minh">
                          Asia/Ho_Chi_Minh
                        </SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">
                          America/New_York
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Ngôn ngữ</Label>
                    <Select
                      value={settings.general.language}
                      onValueChange={(value) =>
                        handleGeneralChange("language", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenanceMode"
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) =>
                      handleGeneralChange("maintenanceMode", checked)
                    }
                  />
                  <Label htmlFor="maintenanceMode">Chế độ bảo trì</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt Thông báo</CardTitle>
                <CardDescription>
                  Quản lý các loại thông báo và tần suất gửi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="emailNotifications">
                        Thông báo Email
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Gửi thông báo qua email
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("emailNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="smsNotifications">Thông báo SMS</Label>
                      <p className="text-sm text-muted-foreground">
                        Gửi thông báo qua tin nhắn SMS
                      </p>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={settings.notifications.smsNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("smsNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="pushNotifications">Thông báo Push</Label>
                      <p className="text-sm text-muted-foreground">
                        Gửi thông báo push đến trình duyệt
                      </p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.notifications.pushNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("pushNotifications", checked)
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email Admin</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={settings.notifications.adminEmail}
                      onChange={(e) =>
                        handleNotificationChange("adminEmail", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notificationFrequency">
                      Tần suất thông báo
                    </Label>
                    <Select
                      value={settings.notifications.notificationFrequency}
                      onValueChange={(value) =>
                        handleNotificationChange("notificationFrequency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Thời gian thực</SelectItem>
                        <SelectItem value="hourly">Hàng giờ</SelectItem>
                        <SelectItem value="daily">Hàng ngày</SelectItem>
                        <SelectItem value="weekly">Hàng tuần</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt Bảo mật</CardTitle>
                <CardDescription>
                  Cấu hình các biện pháp bảo mật cho hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="twoFactorAuth">Xác thực 2 yếu tố</Label>
                      <p className="text-sm text-muted-foreground">
                        Yêu cầu xác thực 2 yếu tố cho tài khoản admin
                      </p>
                    </div>
                    <Switch
                      id="twoFactorAuth"
                      checked={settings.security.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        handleSecurityChange("twoFactorAuth", checked)
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">
                      Thời gian hết hạn phiên (phút)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) =>
                        handleSecurityChange(
                          "sessionTimeout",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">
                      Độ dài tối thiểu mật khẩu
                    </Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) =>
                        handleSecurityChange(
                          "passwordMinLength",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginAttempts">
                    Số lần đăng nhập sai tối đa
                  </Label>
                  <Input
                    id="loginAttempts"
                    type="number"
                    value={settings.security.loginAttempts}
                    onChange={(e) =>
                      handleSecurityChange(
                        "loginAttempts",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Business Settings */}
          {activeTab === "business" && (
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt Kinh doanh</CardTitle>
                <CardDescription>
                  Cấu hình các thông số kinh doanh và tài chính
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                    <Select
                      value={settings.business.currency}
                      onValueChange={(value) =>
                        handleBusinessChange("currency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VND">VND (₫)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Thuế suất (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={settings.business.taxRate}
                      onChange={(e) =>
                        handleBusinessChange(
                          "taxRate",
                          parseFloat(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">Tỷ lệ hoa hồng (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.1"
                      value={settings.business.commissionRate}
                      onChange={(e) =>
                        handleBusinessChange(
                          "commissionRate",
                          parseFloat(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minOrderAmount">
                      Giá trị đơn hàng tối thiểu
                    </Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      value={settings.business.minOrderAmount}
                      onChange={(e) =>
                        handleBusinessChange(
                          "minOrderAmount",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxOrderAmount">
                    Giá trị đơn hàng tối đa
                  </Label>
                  <Input
                    id="maxOrderAmount"
                    type="number"
                    value={settings.business.maxOrderAmount}
                    onChange={(e) =>
                      handleBusinessChange(
                        "maxOrderAmount",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features Settings */}
          {activeTab === "features" && (
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt Tính năng</CardTitle>
                <CardDescription>
                  Bật/tắt các tính năng của nền tảng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="userRegistration">
                        Đăng ký người dùng
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Cho phép người dùng mới đăng ký tài khoản
                      </p>
                    </div>
                    <Switch
                      id="userRegistration"
                      checked={settings.features.userRegistration}
                      onCheckedChange={(checked) =>
                        handleFeatureChange("userRegistration", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="sellerRegistration">Đăng ký seller</Label>
                      <p className="text-sm text-muted-foreground">
                        Cho phép đăng ký tài khoản seller
                      </p>
                    </div>
                    <Switch
                      id="sellerRegistration"
                      checked={settings.features.sellerRegistration}
                      onCheckedChange={(checked) =>
                        handleFeatureChange("sellerRegistration", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="productReviews">Đánh giá sản phẩm</Label>
                      <p className="text-sm text-muted-foreground">
                        Cho phép người dùng đánh giá sản phẩm
                      </p>
                    </div>
                    <Switch
                      id="productReviews"
                      checked={settings.features.productReviews}
                      onCheckedChange={(checked) =>
                        handleFeatureChange("productReviews", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="wishlist">Danh sách yêu thích</Label>
                      <p className="text-sm text-muted-foreground">
                        Cho phép người dùng lưu sản phẩm yêu thích
                      </p>
                    </div>
                    <Switch
                      id="wishlist"
                      checked={settings.features.wishlist}
                      onCheckedChange={(checked) =>
                        handleFeatureChange("wishlist", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="coupons">Mã giảm giá</Label>
                      <p className="text-sm text-muted-foreground">
                        Cho phép sử dụng mã giảm giá
                      </p>
                    </div>
                    <Switch
                      id="coupons"
                      checked={settings.features.coupons}
                      onCheckedChange={(checked) =>
                        handleFeatureChange("coupons", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="analytics">Phân tích dữ liệu</Label>
                      <p className="text-sm text-muted-foreground">
                        Thu thập và phân tích dữ liệu người dùng
                      </p>
                    </div>
                    <Switch
                      id="analytics"
                      checked={settings.features.analytics}
                      onCheckedChange={(checked) =>
                        handleFeatureChange("analytics", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6">
            <Button
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
              className="min-w-[120px]"
            >
              {saveSettingsMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu cài đặt
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

