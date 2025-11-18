import React, { useMemo, useState } from "react";
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
  FileDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axiosClient from "@/services/axiosClient";

// API Response Types
interface User {
  id: string;
  email: string;
  fullName: string;
  userName: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface PagedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// API Service for user management
const userApi = {
  async getUsers(
    page: number = 1,
    pageSize: number = 20,
    role?: string,
    isActive?: boolean,
    search?: string,
  ): Promise<PagedResult<User>> {
    const resp = await axiosClient.get(`/api/admin/users`, {
      params: {
        page,
        pageSize,
        role,
        isActive,
        search,
      },
    });
    return resp.data as PagedResult<User>;
  },

  async updateUserStatus(userId: string, isActive: boolean) {
    const resp = await axiosClient.put(
      `/api/admin/users/${userId}/status`,
      { isActive },
    );
    return resp.data;
  },

  async updateUserRole(userId: string, role: string) {
    const resp = await axiosClient.put(`/api/admin/users/${userId}/role`, {
      role,
    });
    return resp.data;
  },

  async deleteUser(userId: string) {
    const resp = await axiosClient.delete(`/api/admin/users/${userId}`);
    return resp.data;
  },
};

export default function AdminUserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] =
    useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("Customer");
  const [isExporting, setIsExporting] = useState(false);

  const pageSize = 20;

  // Fetch users from backend API
  const {
    data: usersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["adminUsers", currentPage, searchTerm, roleFilter, statusFilter],
    queryFn: () =>
      userApi.getUsers(
        currentPage,
        pageSize,
        roleFilter !== "all" ? roleFilter : undefined,
        statusFilter === "all"
          ? undefined
          : statusFilter === "active"
          ? true
          : false,
        searchTerm || undefined,
      ),
    staleTime: 30000,
  });

  const users = usersData?.data || [];
  const totalCount = usersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Mutation for updating user status
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      userApi.updateUserStatus(userId, isActive),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái người dùng.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Cập nhật trạng thái thất bại.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating user role
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      userApi.updateUserRole(userId, role),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật vai trò người dùng.",
      });
      setSelectedUserForRoleChange(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error ? error.message : "Cập nhật vai trò thất bại.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting user
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userApi.deleteUser(userId),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xoá người dùng.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error ? error.message : "Xoá người dùng thất bại.",
        variant: "destructive",
      });
    },
  });

  const handleStatusToggle = (userId: string, currentStatus: boolean) => {
    updateUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const handleRoleChange = (user: User) => {
    setSelectedUserForRoleChange(user);
    setNewRole(user.roles[0] || "Customer");
  };

  const handleConfirmRoleChange = () => {
    if (selectedUserForRoleChange) {
      updateUserRoleMutation.mutate({
        userId: selectedUserForRoleChange.id,
        role: newRole,
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Bạn chắc chắn muốn xoá người dùng này?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadge = (roles: string[]) => {
    const primaryRole = roles[0] || "Customer";
    switch (primaryRole) {
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
        return <Badge variant="secondary">{primaryRole}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Hoạt động
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Không hoạt động
        </Badge>
      );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "-";
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "-";
      const year = d.getFullYear();
      // Ẩn các giá trị mặc định như 0001-01-01 hoặc năm quá nhỏ
      if (year < 2000) return "-";
      return d.toLocaleDateString("vi-VN");
    } catch {
      return "N/A";
    }
  };

  const getStats = () => {
    const totalUsers = totalCount;
    const activeUsers = users.filter((u) => u.isActive).length;
    const sellers = users.filter((u) => u.roles.includes("Seller")).length;
    const customers = users.filter((u) => u.roles.includes("Customer")).length;

    return { totalUsers, activeUsers, sellers, customers };
  };

  const stats = getStats();

  const computeIsActiveFilter = () =>
    statusFilter === "all"
      ? undefined
      : statusFilter === "active"
      ? true
      : false;

  const createCSV = (rows: User[]) => {
    const headers = [
      "id",
      "fullName",
      "email",
      "userName",
      "roles",
      "isActive",
      "createdAt",
      "lastLoginAt",
    ];
    const escape = (val: unknown) => {
      const s = val === null || val === undefined ? "" : String(val);
      // Escape double quotes and wrap in quotes if needed
      const needsQuotes = /[",\n]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };
    const toISO = (d?: string) => {
      if (!d) return "";
      const nd = new Date(d);
      return isNaN(nd.getTime()) ? "" : nd.toISOString();
    };
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push(
        [
          escape(r.id),
          escape(r.fullName),
          escape(r.email),
          escape(r.userName),
          escape((r.roles || []).join(";")),
          escape(r.isActive ? "active" : "inactive"),
          escape(toISO(r.createdAt)),
          escape(toISO(r.lastLoginAt)),
        ].join(","),
      );
    }
    return lines.join("\n");
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      // Lấy toàn bộ dữ liệu theo bộ lọc hiện tại qua phân trang
      const exportPageSize = 200;
      const first = await userApi.getUsers(
        1,
        exportPageSize,
        roleFilter !== "all" ? roleFilter : undefined,
        computeIsActiveFilter(),
        searchTerm || undefined,
      );
      let allRows = first.data || [];
      const total = first.totalCount || allRows.length;
      const pages = Math.ceil(total / exportPageSize);
      for (let p = 2; p <= pages; p++) {
        const next = await userApi.getUsers(
          p,
          exportPageSize,
          roleFilter !== "all" ? roleFilter : undefined,
          computeIsActiveFilter(),
          searchTerm || undefined,
        );
        allRows = allRows.concat(next.data || []);
      }
      if (!allRows.length) {
        toast({
          title: "Không có dữ liệu",
          description: "Không có người dùng theo bộ lọc hiện tại.",
        });
        return;
      }
      const csv = createCSV(allRows);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      downloadCSV(csv, `users-${stamp}.csv`);
      toast({ title: "Đã xuất CSV", description: `Tổng ${allRows.length} người dùng.` });
    } catch (e: any) {
      toast({
        title: "Lỗi xuất CSV",
        description: e?.message || "Không thể xuất dữ liệu.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

        {/* Removed Active Users card as requested */}

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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
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
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExportCSV} disabled={isExporting} className="sm:ml-auto">
              {isExporting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                  Đang xuất...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  Xuất CSV
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Người dùng</CardTitle>
          <CardDescription>
            Quản lý và theo dõi tất cả người dùng trên nền tảng. Tổng cộng:{" "}
            {totalCount} người dùng
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
          ) : users.length === 0 ? (
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
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium">{user.fullName}</div>
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
                    <TableCell>{getRoleBadge(user.roles)}</TableCell>
                    <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRoleChange(user)}>
                            <Shield className="mr-2 h-4 w-4" /> Đổi vai trò
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusToggle(user.id, user.isActive)}>
                            {user.isActive ? (
                              <XCircle className="mr-2 h-4 w-4" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            {user.isActive ? "Khoá tài khoản" : "Mở khoá tài khoản"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Xoá
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                Trước
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    disabled={isLoading}
                  >
                    {page}
                  </Button>
                ),
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages || isLoading}
              >
                Tiếp
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Change Dialog */}
      <Dialog
        open={selectedUserForRoleChange !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUserForRoleChange(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thay đổi vai trò</DialogTitle>
            <DialogDescription>
              Cập nhật vai trò cho {selectedUserForRoleChange?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Seller">Seller</SelectItem>
                <SelectItem value="Customer">Customer</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedUserForRoleChange(null)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmRoleChange}
                disabled={updateUserRoleMutation.isPending}
              >
                {updateUserRoleMutation.isPending
                  ? "Đang cập nhật..."
                  : "Xác nhận"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
