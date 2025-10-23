import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchGlobalCategories, deleteGlobalCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
} from "lucide-react";
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

// Component hiển thị một danh mục với tính năng collapsible
const CategoryItem: React.FC<{
  category: GlobalCategory;
  level: number;
  onEdit: (cat: GlobalCategory) => void;
  onDelete: (id: string) => void;
}> = ({ category, level, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  const getParentName = (parent: GlobalCategory | null | undefined): string => {
    if (!parent) return "Cấp cao nhất";
    return parent.name;
  };

  return (
    <div className="border rounded-lg mb-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <div
                style={{ marginLeft: `${level * 20}px` }}
                className="flex items-center gap-2"
              >
                {hasChildren ? (
                  isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )
                ) : (
                  <div className="w-4 h-4" />
                )}
                {hasChildren ? (
                  isOpen ? (
                    <FolderOpen className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Folder className="w-5 h-5 text-blue-500" />
                  )
                ) : (
                  <div className="w-5 h-5" />
                )}
                <div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-sm text-gray-600">
                    {category.description || "Không có mô tả"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                ID: {category.id}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Cha: {getParentName(category.parent)}
              </Badge>
              {hasChildren && (
                <Badge variant="default" className="text-xs">
                  {category.children?.length} con
                </Badge>
              )}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(category);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(category.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        {hasChildren && (
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {category.children?.map((child) => (
                  <CategoryItem
                    key={child.id}
                    category={child}
                    level={level + 1}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Danh sách Global Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p>Đang tải danh mục...</p>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Chưa có Global Category nào.</p>
                <p className="text-sm">Nhấn "Tạo Danh mục mới" để bắt đầu.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category: GlobalCategory) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  level={0}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hiển thị trạng thái xóa (optional) */}
      {deleteMutation.isPending && (
        <p className="mt-4 text-sm text-red-500">Đang thực hiện xóa...</p>
      )}
    </div>
  );
}
