import { useState, useEffect } from "react";
import { shopCategoryService, GetShopCategory } from "@/services/shopCategoryService";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShopCategoryTreeProps {
  categories: GetShopCategory[];
  onSelectCategory?: (category: GetShopCategory) => void;
  selectedCategoryId?: string;
  excludeId?: string; // Category ID to exclude from tree (e.g., current category in edit mode)
  showActions?: boolean;
  onEdit?: (category: GetShopCategory) => void;
  onDelete?: (category: GetShopCategory) => void;
}

export default function ShopCategoryTree({
  categories,
  onSelectCategory,
  selectedCategoryId,
  excludeId,
  showActions = false,
  onEdit,
  onDelete,
}: ShopCategoryTreeProps) {
  // ✅ Auto-expand root categories mặc định để thấy subcategories
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  // Auto-expand root categories lần đầu khi categories load (chỉ một lần)
  useEffect(() => {
    if (!hasAutoExpanded && categories.length > 0) {
      const rootIds = new Set<string>();
      categories.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
          rootIds.add(cat.id);
        }
      });
      setExpandedIds(rootIds);
      setHasAutoExpanded(true);
    }
  }, [categories, hasAutoExpanded]);

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

  // Filter out excluded category and its children
  const filterCategory = (cat: GetShopCategory): GetShopCategory | null => {
    if (cat.id === excludeId) {
      return null;
    }
    
    const filteredChildren = cat.children
      ?.map(child => filterCategory(child))
      .filter((child): child is GetShopCategory => child !== null) || [];

    return {
      ...cat,
      children: filteredChildren.length > 0 ? filteredChildren : undefined,
    };
  };

  const filteredCategories = categories
    .map(cat => filterCategory(cat))
    .filter((cat): cat is GetShopCategory => cat !== null);

  const renderCategory = (category: GetShopCategory, level: number = 0) => {
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
              : level > 0
              ? "bg-gray-50/50 hover:bg-gray-100 border-l-2 border-gray-300"
              : "hover:bg-gray-50 border border-transparent"
          )}
          style={{ 
            paddingLeft: `${level * 24 + 8}px`,
            marginLeft: level > 0 ? '12px' : '0',
            marginTop: level > 0 ? '4px' : '0'
          }}
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
          <div className="category-children ml-4 border-l-2 border-gray-200 pl-2">
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (filteredCategories.length === 0) {
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
      {filteredCategories.map((category) => renderCategory(category, 0))}
    </div>
  );
}

