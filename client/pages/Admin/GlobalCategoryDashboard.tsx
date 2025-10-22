import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchGlobalCategories, deleteGlobalCategory } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, CornerDownRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { GlobalCategoryForm } from "./GlobalCategoryForm";

// Tái sử dụng interface để hiển thị (Nếu không dùng DTO từ BE)
interface GlobalCategory {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  parent?: GlobalCategory | null;
  children?: GlobalCategory[];
  createdAt: string;
}

// Component hiển thị một hàng (Row) và đệ quy các hàng con
const CategoryRow: React.FC<{
  category: GlobalCategory;
  level: number;
  onEdit: (cat: GlobalCategory) => void;
  onDelete: (id: string) => void;
}> = ({ category, level, onEdit, onDelete }) => {
  // Hàm hiển thị tên danh mục cha (Nếu có)
  const getParentName = (parent: GlobalCategory | null | undefined): string => {
    if (!parent) return "---";
    return parent.name;
  };

  return (
    <React.Fragment>
      <TableRow>
        <TableCell
          style={{ paddingLeft: `${10 + level * 20}px` }}
          className="font-medium"
        >
          {level > 0 && (
            <CornerDownRight className="w-4 h-4 inline mr-2 text-muted-foreground" />
          )}
          {category.name}
        </TableCell>
        <TableCell>{category.description || "Không có mô tả"}</TableCell>
        <TableCell>{category.id}</TableCell>
        <TableCell>{getParentName(category.parent)}</TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(category)}
            className="mr-2"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(category.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
      {/* Đệ quy hiển thị các danh mục con */}
      {category.children &&
        category.children.map((child) => (
          <CategoryRow
            key={child.id}
            category={child}
            level={level + 1}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </React.Fragment>
  );
};

export default function GlobalCategoryDashboard() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    GlobalCategory | undefined
  >(undefined);

  // ✅ QUERY: Lấy danh sách Global Categories (dạng cây)
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["globalCategories"],
    queryFn: fetchGlobalCategories,
  });

  // MUTATION: Xóa mềm
  const deleteMutation = useMutation({
    mutationFn: deleteGlobalCategory,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa mềm danh mục." });
      queryClient.invalidateQueries({ queryKey: ["globalCategories"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Xóa danh mục thất bại.";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    },
  });

  // Xử lý khi nhấn nút Chỉnh sửa
  const handleEdit = (category: GlobalCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  // Xử lý khi nhấn nút Xóa
  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mềm danh mục này không?")) {
      deleteMutation.mutate(id);
    }
  };

  // Xử lý khi Form hoàn tất (Tạo hoặc Sửa)
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCategory(undefined);
  };

  // Xử lý khi mở/đóng Dialog tạo mới
  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingCategory(undefined); // Đặt lại về chế độ tạo mới khi đóng
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Quản lý Global Category</h1>

      <div className="flex justify-end mb-6">
        {/* ✅ Dialog cho chức năng Tạo/Sửa */}
        <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditingCategory(undefined)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Tạo Danh mục mới
            </Button>
          </DialogTrigger>
          <GlobalCategoryForm
            initialData={editingCategory}
            onSuccess={handleFormSuccess}
          />
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Tên Danh mục</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Danh mục Cha</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Đang tải danh mục...
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Chưa có Global Category nào.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category: GlobalCategory) => (
              <CategoryRow
                key={category.id}
                category={category}
                level={0}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </TableBody>
      </Table>

      {/* Hiển thị trạng thái xóa (optional) */}
      {deleteMutation.isPending && (
        <p className="mt-4 text-sm text-red-500">Đang thực hiện xóa...</p>
      )}
    </div>
  );
}
