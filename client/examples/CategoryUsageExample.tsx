/**
 * Example file demonstrating Global Category usage patterns
 * This file is for reference purposes and not part of the production build
 */

import { useState, useEffect } from "react";
import { globalCategoryService, GetGlobalCategory } from "@/services/globalCategoryService";
import CategoryTree from "@/components/categories/CategoryTree";
import CategorySelect from "@/components/categories/CategorySelect";
import CategoryBreadcrumb from "@/components/categories/CategoryBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryValidator } from "@/utils/categoryValidator";

/**
 * Example 1: Display Category Tree with Actions
 */
export function CategoryTreeExample() {
  const [selectedCategory, setSelectedCategory] = useState<GetGlobalCategory | null>(null);

  const handleEdit = (category: GetGlobalCategory) => {
    console.log("Edit category:", category);
    // Open edit modal or navigate to edit page
  };

  const handleDelete = async (category: GetGlobalCategory) => {
    if (window.confirm(`Delete category "${category.name}"?`)) {
      const response = await globalCategoryService.delete(category.id);
      if (response.succeeded) {
        console.log("Category deleted successfully");
      } else {
        alert(`Error: ${response.message}`);
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Category Tree</h2>
      
      {selectedCategory && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p>Selected: {selectedCategory.name}</p>
          <p className="text-sm text-gray-600">{selectedCategory.description}</p>
        </div>
      )}

      <CategoryTree
        onSelectCategory={setSelectedCategory}
        selectedCategoryId={selectedCategory?.id}
        expandAll={false}
        showActions={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

/**
 * Example 2: Category Selection in Product Form
 */
export function ProductCategorySelectExample() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Product Category Selection</h2>
      
      <div className="space-y-2">
        <Label>Category</Label>
        <CategorySelect
          value={selectedCategoryId}
          onChange={setSelectedCategoryId}
          placeholder="Choose a product category"
        />
      </div>

      {/* If you need to filter by parent category */}
      <div className="space-y-2">
        <Label>Main Category (Filter by Parent)</Label>
        <CategorySelect
          value={parentCategoryId || ""}
          onChange={(id) => setParentCategoryId(id || null)}
          placeholder="Choose a parent category"
          parentId={null}
        />
      </div>

      {selectedCategoryId && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p>Selected Category ID: {selectedCategoryId}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Category Breadcrumb Navigation
 */
export function CategoryBreadcrumbExample() {
  const [categoryId, setCategoryId] = useState("");

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Category Breadcrumb</h2>
      
      <div className="space-y-2">
        <Label>Enter a Category ID to display breadcrumb</Label>
        <Input
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          placeholder="Category ID (GUID)"
        />
      </div>

      {categoryId && (
        <div className="p-4 bg-gray-50 border rounded">
          <CategoryBreadcrumb categoryId={categoryId} />
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Create Category Form
 */
export function CreateCategoryFormExample() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const category = {
      name: name.trim(),
      description: description.trim() || undefined,
      parentId: parentId || undefined,
    };

    // Validate
    const validationErrors = CategoryValidator.validateCreate(category);
    if (CategoryValidator.hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    // Submit
    setLoading(true);
    try {
      const response = await globalCategoryService.create(category);
      
      if (response.succeeded) {
        alert("Category created successfully!");
        setName("");
        setDescription("");
        setParentId(null);
      } else {
        setErrors({ general: response.message });
      }
    } catch (error: any) {
      setErrors({ general: error.message || "Failed to create category" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Create Category</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {errors.general}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Electronics"
            required
            disabled={loading}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Category description (optional)"
            rows={3}
            disabled={loading}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Parent Category (Optional)</Label>
          <CategorySelect
            value={parentId || ""}
            onChange={(id) => setParentId(id || null)}
            placeholder="Choose a parent category (optional)"
          />
          {!parentId && (
            <p className="text-sm text-gray-500">Leave empty for root category</p>
          )}
        </div>

        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? "Creating..." : "Create Category"}
        </Button>
      </form>
    </div>
  );
}

/**
 * Example 5: Load and Display Categories Manually
 */
export function ManualCategoryLoadExample() {
  const [categories, setCategories] = useState<GetGlobalCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await globalCategoryService.getAll(true);
      
      if (response.succeeded && response.data) {
        setCategories(response.data);
      } else {
        setError(response.message || "Failed to load categories");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Manual Category Loading</h2>
        <Button onClick={loadCategories} disabled={loading}>
          Reload
        </Button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading categories...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-4">
            Loaded {globalCategoryService.flattenTree(categories).length} categories
          </p>
          
          <CategoryTree expandAll={false} />
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Get Category Path (Breadcrumb)
 */
export function CategoryPathExample() {
  const [categoryId, setCategoryId] = useState("");
  const [path, setPath] = useState<GetGlobalCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPath = async () => {
    if (!categoryId) return;

    setLoading(true);
    try {
      const response = await globalCategoryService.getAll(false);
      
      if (response.succeeded && response.data) {
        const allCategories = globalCategoryService.flattenTree(response.data);
        const categoryPath = globalCategoryService.getCategoryPath(categoryId, allCategories);
        setPath(categoryPath);
      }
    } catch (error) {
      console.error("Failed to load path:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Category Path</h2>
      
      <div className="flex gap-2">
        <Input
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          placeholder="Enter category ID"
          className="flex-1"
        />
        <Button onClick={loadPath} disabled={loading || !categoryId}>
          Load Path
        </Button>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading...</p>}

      {path.length > 0 && (
        <div className="p-4 bg-gray-50 border rounded">
          <p className="font-semibold mb-2">Category Path:</p>
          <div className="flex gap-2 flex-wrap">
            {path.map((cat, idx) => (
              <span key={cat.id}>
                <span className="font-medium">{cat.name}</span>
                {idx < path.length - 1 && <span className="mx-2 text-gray-400">→</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

