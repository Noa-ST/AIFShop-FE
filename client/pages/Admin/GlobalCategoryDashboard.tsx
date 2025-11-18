import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchGlobalCategories, deleteGlobalCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  productCount?: number;
  totalProductCount?: number;
}

// Component hiển thị một danh mục với tính năng collapsible
const CategoryItem: React.FC<{
  category: GlobalCategory;
  level: number;
  onEdit: (cat: GlobalCategory) => void;
  onDelete: (cat: GlobalCategory) => void;
  expandAll: boolean;
}> = ({ category, level, onEdit, onDelete, expandAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  const getParentName = (parent: GlobalCategory | null | undefined): string => {
    if (!parent) return "Cấp cao nhất";
    return parent.name;
  };

  // Đồng bộ trạng thái mở/đóng theo nút Mở rộng/Thu gọn tất cả
  useEffect(() => {
    setIsOpen(expandAll);
  }, [expandAll]);

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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    {typeof category.productCount === "number" && (
                      <Badge variant="secondary" className="text-xs">SP: {category.productCount}</Badge>
                    )}
                    {typeof category.totalProductCount === "number" && (
                      <Badge className="text-xs">Tổng: {category.totalProductCount}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {category.description || "Không có mô tả"}
                  </p>
                  <p className="text-xs text-muted-foreground">Cha: {getParentName(category.parent)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">


              
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
                    onDelete(category);
                  }}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:hover:text-gray-300"
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
                    expandAll={expandAll}
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
  const [search, setSearch] = useState("");
  const [expandAll, setExpandAll] = useState(false);

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
  const handleDelete = (category: GlobalCategory) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mềm danh mục này không?")) {
      deleteMutation.mutate(category.id);
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

  // Lọc cây danh mục theo từ khóa tìm kiếm (theo name/description)
  const filterTree = (nodes: GlobalCategory[], term: string): GlobalCategory[] => {
    if (!term.trim()) return nodes;
    const t = term.toLowerCase();
    const walk = (list: GlobalCategory[]): GlobalCategory[] => {
      const results: GlobalCategory[] = [];
      for (const n of list) {
        const selfMatch =
          (n.name && n.name.toLowerCase().includes(t)) ||
          (n.description && n.description.toLowerCase().includes(t));
        const children = n.children ? walk(n.children) : [];
        if (selfMatch || children.length) {
          results.push({ ...n, children });
        }
      }
      return results;
    };
    return walk(nodes);
  };

  const filteredCategories = useMemo(
    () => filterTree(categories as GlobalCategory[], search),
    [categories, search],
  );

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Quản lý Global Category</h1>

      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-2 w-full max-w-md">
          <Input
            placeholder="Tìm kiếm danh mục theo tên hoặc mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" onClick={() => setSearch("")}>Xóa</Button>
        </div>
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
          <CardTitle className="flex items-center gap-2 justify-between">
            <Folder className="w-5 h-5" />
            <span>Danh sách Global Categories</span>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Tổng: {Array.isArray(categories) ? categories.length : 0}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setExpandAll(true)}>Mở rộng tất cả</Button>
              <Button variant="ghost" size="sm" onClick={() => setExpandAll(false)}>Thu gọn tất cả</Button>
            </div>
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
          ) : filteredCategories.length === 0 ? (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>
                  {search.trim()
                    ? "Không tìm thấy danh mục phù hợp."
                    : "Chưa có Global Category nào."}
                </p>
                <p className="text-sm">
                  {search.trim()
                    ? "Thử từ khóa khác hoặc xóa tìm kiếm."
                    : "Nhấn \"Tạo Danh mục mới\" để bắt đầu."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCategories.map((category: GlobalCategory) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  level={0}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  expandAll={expandAll}
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
