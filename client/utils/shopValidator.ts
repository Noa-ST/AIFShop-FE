import { CreateShop, UpdateShop } from '@/services/shopService';
import { CreateShopCategory, UpdateShopCategory } from '@/services/shopCategoryService';

export interface ShopValidationErrors {
  name?: string;
  street?: string;
  city?: string;
  sellerId?: string;
}

export class ShopValidator {
  static validateCreate(shop: CreateShop): ShopValidationErrors {
    const errors: ShopValidationErrors = {};

    // Name validation
    if (!shop.name || shop.name.trim().length === 0) {
      errors.name = 'Tên shop là bắt buộc';
    } else if (shop.name.length > 100) {
      errors.name = 'Tên shop không được vượt quá 100 ký tự';
    }

    // Street validation
    if (!shop.street || shop.street.trim().length === 0) {
      errors.street = 'Địa chỉ đường là bắt buộc';
    }

    // City validation
    if (!shop.city || shop.city.trim().length === 0) {
      errors.city = 'Tỉnh/Thành phố là bắt buộc';
    }

    // SellerId validation
    if (!shop.sellerId || shop.sellerId.trim().length === 0) {
      errors.sellerId = 'Seller ID là bắt buộc';
    }

    return errors;
  }

  static validateUpdate(shop: UpdateShop): ShopValidationErrors {
    const errors: ShopValidationErrors = {};

    // ID validation
    if (!shop.id || shop.id.trim().length === 0) {
      throw new Error('Shop ID là bắt buộc khi cập nhật');
    }

    // Name validation
    if (!shop.name || shop.name.trim().length === 0) {
      errors.name = 'Tên shop là bắt buộc';
    } else if (shop.name.length > 100) {
      errors.name = 'Tên shop không được vượt quá 100 ký tự';
    }

    // Street validation
    if (!shop.street || shop.street.trim().length === 0) {
      errors.street = 'Địa chỉ đường là bắt buộc';
    }

    // City validation
    if (!shop.city || shop.city.trim().length === 0) {
      errors.city = 'Tỉnh/Thành phố là bắt buộc';
    }

    return errors;
  }

  static hasErrors(errors: ShopValidationErrors): boolean {
    return Object.keys(errors).length > 0;
  }
}

export interface ShopCategoryValidationErrors {
  name?: string;
  description?: string;
  parentId?: string;
}

export class ShopCategoryValidator {
  static validateCreate(category: CreateShopCategory): ShopCategoryValidationErrors {
    const errors: ShopCategoryValidationErrors = {};

    // Name validation
    if (!category.name || category.name.trim().length === 0) {
      errors.name = 'Tên danh mục là bắt buộc';
    } else if (category.name.length > 100) {
      errors.name = 'Tên danh mục không được vượt quá 100 ký tự';
    }

    // Description validation
    if (category.description && category.description.length > 500) {
      errors.description = 'Mô tả không được vượt quá 500 ký tự';
    }

    return errors;
  }

  static validateUpdate(category: UpdateShopCategory): ShopCategoryValidationErrors {
    const errors: ShopCategoryValidationErrors = {};

    // ID validation
    if (!category.id || category.id.trim().length === 0) {
      throw new Error('Category ID là bắt buộc khi cập nhật');
    }

    // Name validation
    if (!category.name || category.name.trim().length === 0) {
      errors.name = 'Tên danh mục là bắt buộc';
    } else if (category.name.length > 100) {
      errors.name = 'Tên danh mục không được vượt quá 100 ký tự';
    }

    // Description validation
    if (category.description && category.description.length > 500) {
      errors.description = 'Mô tả không được vượt quá 500 ký tự';
    }

    return errors;
  }

  static hasErrors(errors: ShopCategoryValidationErrors): boolean {
    return Object.keys(errors).length > 0;
  }
}

