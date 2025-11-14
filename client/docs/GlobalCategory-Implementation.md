# Global Category Implementation Guide

This document outlines the complete implementation of the Global Category feature in the AIFShop frontend.

## Overview

The Global Category system provides hierarchical category management with full CRUD operations. Categories can be nested at multiple levels, and the implementation follows the backend API specification.

## Architecture

### Services

#### `client/services/globalCategoryService.ts`

Main service class that provides all API interactions with the Global Category backend.

**Key Methods:**

- `getAll(includeChildren: boolean)`: Get all categories (with optional children)
- `getById(id: string)`: Get a single category by ID
- `getByParentId(parentId: string | null)`: Get categories filtered by parent
- `create(category: CreateGlobalCategory)`: Create a new category
- `update(id: string, category: UpdateGlobalCategory)`: Update an existing category
- `delete(id: string)`: Delete a category
- `getStatistics()`: Get category statistics (Admin only)

**Helper Methods:**

- `buildTree(categories)`: Convert flat array to tree structure
- `flattenTree(categories)`: Convert tree to flat array
- `getCategoryPath(categoryId, allCategories)`: Get breadcrumb path for a category

**Types:**

```typescript
interface GetGlobalCategory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string | null;
  isDeleted: boolean;
  parent?: GetGlobalCategory | null;
  children?: GetGlobalCategory[] | null;
}

interface ServiceResponse<T> {
  succeeded: boolean;
  message: string;
  data: T;
  statusCode?: number;
}
```

### Components

#### `CategoryTree.tsx`

Displays categories in a hierarchical tree structure with expand/collapse functionality.

**Props:**

- `onSelectCategory?: (category) => void`: Callback when a category is selected
- `selectedCategoryId?: string`: Currently selected category ID
- `expandAll?: boolean`: Whether to expand all nodes by default
- `showActions?: boolean`: Show edit/delete buttons
- `onEdit?: (category) => void`: Callback for edit action
- `onDelete?: (category) => void`: Callback for delete action

**Usage:**

```tsx
import CategoryTree from "@/components/categories/CategoryTree";

<CategoryTree
  onSelectCategory={(category) => console.log(category)}
  selectedCategoryId={selectedId}
  expandAll={false}
  showActions={true}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

#### `CategorySelect.tsx`

Dropdown component for selecting a category from a specific parent level.

**Props:**

- `value?: string`: Selected category ID
- `onChange: (categoryId: string) => void`: Change handler
- `parentId?: string | null`: Filter by parent category
- `placeholder?: string`: Placeholder text
- `disabled?: boolean`: Disable the select
- `className?: string`: Additional CSS classes

**Usage:**

```tsx
import CategorySelect from "@/components/categories/CategorySelect";

<CategorySelect
  value={selectedId}
  onChange={(id) => setSelectedId(id)}
  placeholder="Choose a category"
  parentId={parentCategoryId}
/>
```

#### `CategoryBreadcrumb.tsx`

Displays a breadcrumb navigation for a category and its ancestors.

**Props:**

- `categoryId: string`: The category ID to show breadcrumb for

**Usage:**

```tsx
import CategoryBreadcrumb from "@/components/categories/CategoryBreadcrumb";

<CategoryBreadcrumb categoryId="category-id-here" />
```

### Utilities

#### `categoryValidator.ts`

Provides validation for category forms.

**Methods:**

- `validateCreate(category)`: Validate a new category
- `validateUpdate(category)`: Validate category updates
- `hasErrors(errors)`: Check if validation errors exist

**Usage:**

```tsx
import { CategoryValidator } from "@/utils/categoryValidator";

const errors = CategoryValidator.validateCreate({
  name: "Electronics",
  description: "Electronic devices"
});

if (CategoryValidator.hasErrors(errors)) {
  console.error("Validation failed:", errors);
}
```

## API Integration

### Endpoints

All endpoints are prefixed with `/api/GlobalCategory`:

- `GET /api/GlobalCategory/all` - Get all categories
- `GET /api/GlobalCategory/{id}` - Get category by ID
- `GET /api/GlobalCategory/by-parent` - Get categories by parent
- `POST /api/GlobalCategory/add` - Create category (Admin only)
- `PUT /api/GlobalCategory/update/{id}` - Update category (Admin only)
- `DELETE /api/GlobalCategory/delete/{id}` - Delete category (Admin only)
- `GET /api/GlobalCategory/admin/statistics` - Get statistics (Admin only)

### Response Format

All responses follow the `ServiceResponse<T>` wrapper:

```json
{
  "succeeded": true,
  "message": "Success",
  "data": { /* response data */ },
  "statusCode": 200
}
```

### Error Handling

The service methods return wrapped responses. Always check the `succeeded` flag:

```typescript
const response = await globalCategoryService.getAll(true);

if (response.succeeded && response.data) {
  // Handle success
  const categories = response.data;
} else {
  // Handle error
  console.error(response.message);
}
```

## Backward Compatibility

The existing codebase uses `/api/Admin/GlobalCategory/*` endpoints. To maintain compatibility:

1. Old implementations are preserved as `*Legacy` functions
2. New service uses the correct `/api/GlobalCategory/*` endpoints
3. Re-exported wrappers in `lib/api.ts` ensure existing code continues to work

## Example Implementations

### Admin Dashboard Integration

The existing `GlobalCategoryDashboard.tsx` and `GlobalCategoryForm.tsx` components work with the new service through the re-exported wrappers in `lib/api.ts`.

### Creating a New Category Form

```tsx
import { useState } from "react";
import { globalCategoryService } from "@/services/globalCategoryService";
import { CategoryValidator } from "@/utils/categoryValidator";

function CreateCategoryForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const category = { name, description };
    const validationErrors = CategoryValidator.validateCreate(category);
    
    if (CategoryValidator.hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    const response = await globalCategoryService.create(category);
    
    if (response.succeeded) {
      alert("Category created!");
      setName("");
      setDescription("");
    } else {
      alert(`Error: ${response.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### Displaying Category Tree

```tsx
import { useState, useEffect } from "react";
import { globalCategoryService } from "@/services/globalCategoryService";
import CategoryTree from "@/components/categories/CategoryTree";

function CategoryPage() {
  const [selectedId, setSelectedId] = useState<string | undefined>();

  return (
    <div>
      <h1>Categories</h1>
      <CategoryTree
        onSelectCategory={(cat) => {
          console.log("Selected:", cat.name);
          setSelectedId(cat.id);
        }}
        selectedCategoryId={selectedId}
        expandAll={false}
      />
    </div>
  );
}
```

## Validation Rules

### Create/Update Category

1. **Name**: Required, max 100 characters
2. **Description**: Optional, max 500 characters
3. **ParentId**: Optional GUID

### Business Rules

1. Cannot duplicate category names at the same level (same parentId)
2. Cannot set a category as its own parent (self-reference)
3. Cannot create circular references (A → B → A)
4. Cannot delete categories that have children
5. Cannot delete categories that have products

### Admin-Only Operations

- Create category
- Update category
- Delete category
- View statistics

Frontend should check user role before displaying these features.

## Integration Points

### Product Forms

Use `CategorySelect` to let sellers choose product categories:

```tsx
<CategorySelect
  value={product.globalCategoryId}
  onChange={(id) => setGlobalCategoryId(id)}
  placeholder="Select product category"
/>
```

### Navigation

Use `CategoryBreadcrumb` on product listing pages:

```tsx
<CategoryBreadcrumb categoryId={product.globalCategoryId} />
```

### Filtering

Use category IDs to filter products by category in listing pages.

## Testing

Recommended test scenarios:

1. Load and display category tree
2. Create a root category
3. Create a child category
4. Update category details
5. Attempt to delete category with children (should fail)
6. Attempt to delete category with products (should fail)
7. Display breadcrumb for nested category
8. Select category from dropdown

## Future Enhancements

Potential improvements:

1. Category search/filter functionality
2. Drag & drop reordering
3. Bulk operations
4. Category statistics dashboard
5. Category-based product recommendations

