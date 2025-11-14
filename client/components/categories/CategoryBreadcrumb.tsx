import { useEffect, useState } from "react";
import { globalCategoryService, GetGlobalCategory } from "@/services/globalCategoryService";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface CategoryBreadcrumbProps {
  categoryId: string;
}

export default function CategoryBreadcrumb({ categoryId }: CategoryBreadcrumbProps) {
  const [path, setPath] = useState<GetGlobalCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBreadcrumb();
  }, [categoryId]);

  const loadBreadcrumb = async () => {
    setLoading(true);
    try {
      const response = await globalCategoryService.getAll(false);
      if (response.succeeded && response.data) {
        const allCategories = globalCategoryService.flattenTree(response.data);
        const categoryPath = globalCategoryService.getCategoryPath(categoryId, allCategories);
        setPath(categoryPath);
      }
    } catch (error) {
      console.error("Error loading breadcrumb:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || path.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {path.map((category, index) => (
          <BreadcrumbItem key={category.id}>
            {index === path.length - 1 ? (
              <span className="font-medium">{category.name}</span>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={`/category/${category.id}`}>{category.name}</Link>
              </BreadcrumbLink>
            )}
            {index < path.length - 1 && <BreadcrumbSeparator />}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

