import { useState, useEffect } from "react";
import { globalCategoryService, GetGlobalCategory } from "@/services/globalCategoryService";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryTreeProps {
  onSelectCategory?: (category: GetGlobalCategory) => void;
  selectedCategoryId?: string;
  expandAll?: boolean;
  showActions?: boolean;
  onEdit?: (category: GetGlobalCategory) => void;
  onDelete?: (category: GetGlobalCategory) => void;
}

export default function CategoryTree({
  onSelectCategory,
  selectedCategoryId,
  expandAll = false,
  showActions = false,
  onEdit,
  onDelete,
}: CategoryTreeProps) {
  const [categories, setCategories] = useState<GetGlobalCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (expandAll && categories.length > 0) {
      const allIds = globalCategoryService.flattenTree(categories).map((c) => c.id);
      setExpandedIds(new Set(allIds));
    }
  }, [categories, expandAll]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await globalCategoryService.getAll(true);
      if (response.succeeded && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderCategory = (category: GetGlobalCategory, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);
    const isSelected = selectedCategoryId === category.id;

    return (
      <div key={category.id} className="category-item">
        <div
          className={cn(
            "category-node group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
            isSelected
              ? "bg-blue-50 border border-blue-200"
              : "hover:bg-gray-50 border border-transparent"
          )}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => onSelectCategory?.(category)}
        >
          {hasChildren && (
            <button
              type="button"
              className="expand-btn p-1 hover:bg-gray-200 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(category.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4 h-4" />}

          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}

          <span className="category-name flex-1 font-medium">{category.name}</span>

          {category.description && (
            <span className="category-description text-sm text-gray-600 truncate max-w-xs">
              {category.description}
            </span>
          )}

          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(category);
                  }}
                >
                  ✏️
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(category);
                  }}
                >
                  🗑️
                </Button>
              )}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="category-children">
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Đang tải danh mục...</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center text-gray-500">
          <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Chưa có danh mục nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-tree space-y-1">
      {categories.map((category) => renderCategory(category, 0))}
    </div>
  );
}

