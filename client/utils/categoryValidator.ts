import { CreateGlobalCategory, UpdateGlobalCategory } from "@/services/globalCategoryService";

export interface CategoryValidationErrors {
  name?: string;
  description?: string;
  parentId?: string;
}

export class CategoryValidator {
  static validateCreate(category: CreateGlobalCategory): CategoryValidationErrors {
    const errors: CategoryValidationErrors = {};

    // Name validation
    if (!category.name || category.name.trim().length === 0) {
      errors.name = "Tên danh mục là bắt buộc";
    } else if (category.name.length > 100) {
      errors.name = "Tên danh mục không được vượt quá 100 ký tự";
    }

    // Description validation
    if (category.description && category.description.length > 500) {
      errors.description = "Mô tả không được vượt quá 500 ký tự";
    }

    return errors;
  }

  static validateUpdate(category: UpdateGlobalCategory): CategoryValidationErrors {
    return this.validateCreate(category);
  }

  static hasErrors(errors: CategoryValidationErrors): boolean {
    return Object.keys(errors).length > 0;
  }
}

