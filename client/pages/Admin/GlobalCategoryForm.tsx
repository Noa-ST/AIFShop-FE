import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  createGlobalCategory,
  updateGlobalCategory,
  fetchGlobalCategories,
} from "@/lib/api";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormDataType = {
  name: string;
  description: string;
  parentId: string | null;
};

// Dùng cho cả CREATE và UPDATE
interface CategoryFormProps {
  initialData?: any; // Dữ liệu category hiện tại khi ở chế độ Edit
  onSuccess: () => void; // Callback khi thành công
}

// Hàm chuyển danh sách phẳng thành mảng có option (bao gồm cả danh mục con)
const flattenCategories = (
  categories: any[],
): { id: string; name: string }[] => {
  let result: { id: string; name: string }[] = [];
  categories.forEach((cat) => {
    result.push({ id: cat.id, name: cat.name });
    if (cat.children && cat.children.length > 0) {
      result = result.concat(flattenCategories(cat.children));
    }
  });
  return result;
};

export const GlobalCategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState<FormDataType>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    parentId: initialData?.parentId || null,
  });

  // Lấy danh sách các Global Category hiện có (để chọn Parent)
  const { data: allCategories = [], isLoading: isCategoriesLoading } = useQuery(
    {
      queryKey: ["globalCategories", "flat"],
      queryFn: fetchGlobalCategories,
    },
  );

  // Chuyển danh sách cây sang danh sách phẳng cho Select
  const flatCategories = React.useMemo(() => {
    return flattenCategories(allCategories);
  }, [allCategories]);

  // Cập nhật state khi prop initialData thay đổi (khi mở/đóng dialog)
  useEffect(() => {
    setFormData({
      name: initialData?.name || "",
      description: initialData?.description || "",
      parentId: initialData?.parentId || null,
    });
  }, [initialData]);

  // Mutation cho CREATE/UPDATE
  const mutation = useMutation({
    mutationFn: (data: FormDataType) => {
      const payload = {
        ...data,
        // Đảm bảo ParentId là null nếu chuỗi rỗng
        parentId: data.parentId === "" ? null : data.parentId,
      };

      if (isEditing) {
        // Mode UPDATE
        return updateGlobalCategory(initialData.id, {
          ...payload,
          id: initialData.id,
        });
      } else {
        // Mode CREATE
        return createGlobalCategory(payload);
      }
    },
    onSuccess: () => {
      toast({
        title: "Thành công!",
        description: isEditing
          ? "Cập nhật danh mục thành công."
          : "Tạo danh mục mới thành công.",
      });
      queryClient.invalidateQueries({ queryKey: ["globalCategories"] }); // Refresh list
      onSuccess(); // Đóng form
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || error.message || "Đã xảy ra lỗi!";
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.parentId === initialData.id) {
      toast({
        title: "Lỗi",
        description: "Danh mục cha không thể là chính nó.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Chỉnh sửa Danh mục" : "Tạo Danh mục Toàn cầu mới"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Tên Danh mục (*)</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={mutation.isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="parentId">Danh mục Cha (Parent Category)</Label>
          <Select
            value={formData.parentId || ""}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                parentId: value === "" ? null : value,
              })
            }
            disabled={mutation.isPending || isCategoriesLoading}
          >
            <SelectTrigger id="parentId">
              <SelectValue
                placeholder={
                  isCategoriesLoading
                    ? "Đang tải danh mục..."
                    : "Chọn danh mục cha (Tùy chọn)"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">-- (Danh mục cấp cao nhất) --</SelectItem>
              {flatCategories
                // Lọc chính nó ra khỏi danh sách cha khi đang ở chế độ chỉnh sửa
                .filter((cat) => !(isEditing && cat.id === initialData?.id))
                .map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Mô tả</Label>
          <Input
            id="description"
            name="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            disabled={mutation.isPending}
          />
        </div>

        <Button
          type="submit"
          className="mt-4"
          disabled={mutation.isPending || !formData.name}
        >
          {mutation.isPending
            ? isEditing
              ? "Đang lưu..."
              : "Đang tạo..."
            : isEditing
              ? "Cập nhật"
              : "Tạo Danh mục"}
        </Button>
      </form>
    </DialogContent>
  );
};
