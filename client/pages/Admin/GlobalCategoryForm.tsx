import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGlobalCategory, updateGlobalCategory } from "@/lib/api";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

// Định danh an toàn cho giá trị NULL trong Select (để tránh lỗi Radix)
const NULL_PARENT_VALUE = "NULL_PARENT_ID";

interface GlobalCategory {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  parent?: GlobalCategory | null;
  children?: GlobalCategory[];
  createdAt: string;
  // Giả định categories từ cache không phải là dạng cây,
  // nếu là dạng cây, cần hàm flattenCategories
}

interface GlobalCategoryFormProps {
  initialData?: GlobalCategory;
  onSuccess: () => void;
  mode?: "modal" | "embedded";
}

// Hàm chuyển đổi danh sách cây thành danh sách phẳng (Cần thiết cho Select)
const flattenCategories = (categories: GlobalCategory[]): GlobalCategory[] => {
  let result: GlobalCategory[] = [];
  categories.forEach((cat) => {
    result.push(cat);
    if (cat.children && cat.children.length > 0) {
      result = result.concat(flattenCategories(cat.children));
    }
  });
  return result;
};

export function GlobalCategoryForm({
  initialData,
  onSuccess,
  mode = "modal",
}: GlobalCategoryFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: NULL_PARENT_VALUE, // ✅ Đặt giá trị mặc định là NULL_PARENT_VALUE
  });

  // Fetch categories for parent selection from cache
  // Cache key phải khớp với key trong GlobalCategoryDashboard.tsx
  const cachedCategories =
    (queryClient.getQueryData(["globalCategories"]) as
      | { data?: GlobalCategory[] } // Giả định response bọc trong { data: [] }
      | GlobalCategory[]
      | undefined) ?? [];

  // Lấy dữ liệu thực tế và làm phẳng
  const rawCategories: GlobalCategory[] = Array.isArray(cachedCategories)
    ? cachedCategories
    : cachedCategories.data || [];
  const flatCategories = flattenCategories(rawCategories);

  // Initialize form with initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        // ✅ [SỬA]: Chuyển null sang NULL_PARENT_VALUE để Select hiển thị đúng
        parentId: initialData.parentId || NULL_PARENT_VALUE,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        parentId: NULL_PARENT_VALUE, // ✅ Reset về NULL_PARENT_VALUE
      });
    }
  }, [initialData]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createGlobalCategory,
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo danh mục mới thành công.",
      });
      // ✅ Invalidate cả key 'flat' và 'tree' (nếu bạn dùng key khác)
      queryClient.invalidateQueries({ queryKey: ["globalCategories"] });
      onSuccess();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Tạo danh mục thất bại.";
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateGlobalCategory(id, data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật danh mục thành công.",
      });
      queryClient.invalidateQueries({ queryKey: ["globalCategories"] });
      onSuccess();
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || "Cập nhật danh mục thất bại.";
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên danh mục không được để trống.",
        variant: "destructive",
      });
      return;
    }

    // ✅ [SỬA LỖI LOGIC]: Đảm bảo danh mục cha không thể là chính nó
    if (initialData && formData.parentId === initialData.id) {
      toast({
        title: "Lỗi",
        description: "Danh mục cha không thể là chính nó.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      // ✅ [SỬA LỖI GỐC]: Chuyển NULL_PARENT_VALUE thành null khi gửi lên BE
      parentId:
        formData.parentId === NULL_PARENT_VALUE ? null : formData.parentId,
    };

    if (initialData) {
      // Update existing category
      updateMutation.mutate({ id: initialData.id, data: payload });
    } else {
      // Create new category
      createMutation.mutate(payload);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const FormFields = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên danh mục *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Nhập tên danh mục..."
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Nhập mô tả danh mục..."
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentId">Danh mục cha</Label>
        <Select
          // ✅ [SỬA]: Luôn dùng giá trị NULL_PARENT_VALUE trong state
          value={formData.parentId}
          onValueChange={(value) => handleInputChange("parentId", value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn danh mục cha (tùy chọn)" />
          </SelectTrigger>
          <SelectContent>
            {/* ✅ [SỬA LỖI RADIX]: Dùng NULL_PARENT_VALUE thay cho "" */}
            <SelectItem value={NULL_PARENT_VALUE}>
              -- Không có danh mục cha (Cấp cao nhất) --
            </SelectItem>
            {flatCategories
              // Lọc chính nó ra khỏi danh sách cha khi chỉnh sửa
              .filter((cat) => !initialData || cat.id !== initialData.id)
              .map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={isLoading}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name.trim()}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </form>
  );

  if (mode === "embedded") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            {initialData ? "Chỉnh sửa Danh mục" : "Tạo Danh mục mới"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {initialData
              ? "Cập nhật thông tin danh mục global."
              : "Tạo một danh mục global mới cho hệ thống."}
          </p>
        </div>
        {FormFields}
      </div>
    );
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {initialData ? "Chỉnh sửa Danh mục" : "Tạo Danh mục mới"}
        </DialogTitle>
        <DialogDescription>
          {initialData
            ? "Cập nhật thông tin danh mục global."
            : "Tạo một danh mục global mới cho hệ thống."}
        </DialogDescription>
      </DialogHeader>
      {FormFields}
    </DialogContent>
  );
}
