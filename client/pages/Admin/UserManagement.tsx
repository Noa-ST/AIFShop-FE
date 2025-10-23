import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  User,
  UserPlus,
  MoreHorizontal,
  Shield,
  Store,
  ShoppingCart,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data interface - replace with actual API types
interface User {
  id: string;
  email: string;
  fullname: string;
  role: "Admin" | "Seller" | "Customer";
  status: "active" | "inactive" | "pending";
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
  shop?: {
    id: string;
    name: string;
    status: "active" | "inactive" | "pending";
  };
  stats?: {
    totalOrders?: number;
    totalSpent?: number;
    totalProducts?: number;
  };
}

// Mock data - replace with actual API calls
const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@aifshop.com",
    fullname: "Admin User",
    role: "Admin",
    status: "active",
    createdAt: "2024-01-01",
    lastLoginAt: "2024-01-20",
  },
  {
    id: "2",
    email: "seller1@aifshop.com",
    fullname: "Nguyễn Văn A",
    role: "Seller",
    status: "active",
    createdAt: "2024-01-05",
    lastLoginAt: "2024-01-19",
    shop: {
      id: "shop1",
      name: "TechStore",
      status: "active",
    },
    stats: {
      totalProducts: 25,
    },
  },
  {
    id: "3",
    email: "customer1@aifshop.com",
    fullname: "Trần Thị B",
    role: "Customer",
    status: "active",
    createdAt: "2024-01-10",
    lastLoginAt: "2024-01-18",
    stats: {
      totalOrders: 15,
      totalSpent: 2500000,
    },
  },
  {
    id: "4",
    email: "seller2@aifshop.com",
    fullname: "Lê Văn C",
    role: "Seller",
    status: "pending",
    createdAt: "2024-01-15",
    shop: {
      id: "shop2",
      name: "FashionStore",
      status: "pending",
    },
    stats: {
      totalProducts: 0,
    },
  },
  {
    id: "5",
    email: "customer2@aifshop.com",
    fullname: "Phạm Thị D",
    role: "Customer",
    status: "inactive",
    createdAt: "2024-01-12",
    lastLoginAt: "2024-01-10",
    stats: {
      totalOrders: 3,
      totalSpent: 500000,
    },
  },
];

export default function AdminUserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock query - replace with actual API call
  const { data: users = mockUsers, isLoading } = useQuery({
    queryKey: ["adminUsers", searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockUsers;
    },
  });

  // Mock mutation for user status update
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { id, status };
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái người dùng.",
      });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Cập nhật trạng thái thất bại.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (userId: string, newStatus: string) => {
    updateUserStatusMutation.mutate({ id: userId, status: newStatus });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case "Seller":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Store className="w-3 h-3 mr-1" />
            Seller
          </Badge>
        );
      case "Customer":
        return (
          <Badge className="bg-green-100 text-green-800">
            <ShoppingCart className="w-3 h-3 mr-1" />
            Customer
          </Badge>
        );
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Hoạt động
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Không hoạt động
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Chờ duyệt
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + "₫";
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const pendingUsers = users.filter((u) => u.status === "pending").length;
    const sellers = users.filter((u) => u.role === "Seller").length;
    const customers = users.filter((u) => u.role === "Customer").length;

    return { totalUsers, activeUsers, pendingUsers, sellers, customers };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Quản lý Người dùng
        </h2>
        <p className="text-muted-foreground">
          Quản lý và giám sát tất cả người dùng trên nền tảng.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng người dùng
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> từ tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đang hoạt động
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Người dùng tích cực</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingUsers}</div>
            <p className="text-xs text-muted-foreground">Cần xem xét</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sellers</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sellers}</div>
            <p className="text-xs text-muted-foreground">Người bán</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers}</div>
            <p className="text-xs text-muted-foreground">Khách hàng</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc và Tìm kiếm</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc người dùng theo các tiêu chí khác nhau.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Seller">Seller</SelectItem>
                <SelectItem value="Customer">Customer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Người dùng</CardTitle>
          <CardDescription>
            Quản lý và theo dõi tất cả người dùng trên nền tảng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p>Đang tải người dùng...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Không tìm thấy người dùng nào.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Thống kê</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium">{user.fullname}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                          {user.lastLoginAt && (
                            <div className="text-xs text-gray-400">
                              Đăng nhập: {formatDate(user.lastLoginAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.shop ? (
                        <div>
                          <div className="font-medium">{user.shop.name}</div>
                          <Badge
                            variant={
                              user.shop.status === "active"
                                ? "default"
                                : user.shop.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {user.shop.status === "active"
                              ? "Hoạt động"
                              : user.shop.status === "pending"
                                ? "Chờ duyệt"
                                : "Không hoạt động"}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-gray-400">Không có</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.stats ? (
                        <div className="space-y-1">
                          {user.stats.totalOrders && (
                            <div className="text-sm">
                              <span className="text-gray-500">Đơn hàng:</span>{" "}
                              {user.stats.totalOrders}
                            </div>
                          )}
                          {user.stats.totalSpent && (
                            <div className="text-sm">
                              <span className="text-gray-500">Chi tiêu:</span>{" "}
                              {formatCurrency(user.stats.totalSpent)}
                            </div>
                          )}
                          {user.stats.totalProducts && (
                            <div className="text-sm">
                              <span className="text-gray-500">Sản phẩm:</span>{" "}
                              {user.stats.totalProducts}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          {user.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(user.id, "active")
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Duyệt người dùng
                            </DropdownMenuItem>
                          )}
                          {user.status === "active" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(user.id, "inactive")
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Vô hiệu hóa
                            </DropdownMenuItem>
                          )}
                          {user.status === "inactive" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(user.id, "active")
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Kích hoạt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
