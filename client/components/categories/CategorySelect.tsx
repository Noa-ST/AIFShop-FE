import { useState, useEffect } from "react";
import { globalCategoryService, GetGlobalCategory } from "@/services/globalCategoryService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategorySelectProps {
  value?: string;
  onChange: (categoryId: string) => void;
  parentId?: string | null;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CategorySelect({
  value,
  onChange,
  parentId,
  placeholder = "Chọn danh mục",
  disabled = false,
  className,
}: CategorySelectProps) {
  const [categories, setCategories] = useState<GetGlobalCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [parentId]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await globalCategoryService.getByParentId(parentId || null);
      if (response.succeeded && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={value || ""}
      onValueChange={onChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? "Đang tải..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">{placeholder}</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

