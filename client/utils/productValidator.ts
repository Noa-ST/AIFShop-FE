import { CreateProduct, UpdateProduct } from '@/services/productService';

export interface ProductValidationErrors {
  name?: string;
  price?: string;
  stockQuantity?: string;
  categoryId?: string;
  shopId?: string;
  imageUrls?: string;
}

export class ProductValidator {
  static validateCreateProduct(product: CreateProduct): ProductValidationErrors {
    const errors: ProductValidationErrors = {};

    // Name validation
    if (!product.name || product.name.trim().length === 0) {
      errors.name = 'Tên sản phẩm là bắt buộc';
    } else if (product.name.length > 200) {
      errors.name = 'Tên sản phẩm không được vượt quá 200 ký tự';
    }

    // Price validation
    if (product.price === undefined || product.price === null) {
      errors.price = 'Giá sản phẩm là bắt buộc';
    } else if (product.price < 0) {
      errors.price = 'Giá sản phẩm phải lớn hơn hoặc bằng 0';
    } else if (product.price > 10000000000) {
      errors.price = 'Giá sản phẩm quá lớn';
    }

    // Stock validation
    if (product.stockQuantity === undefined || product.stockQuantity === null) {
      errors.stockQuantity = 'Số lượng tồn kho là bắt buộc';
    } else if (product.stockQuantity < 0) {
      errors.stockQuantity = 'Số lượng tồn kho phải lớn hơn hoặc bằng 0';
    } else if (!Number.isInteger(product.stockQuantity)) {
      errors.stockQuantity = 'Số lượng tồn kho phải là số nguyên';
    }

    // Category validation
    if (!product.categoryId) {
      errors.categoryId = 'Danh mục là bắt buộc';
    }

    // Shop validation
    if (!product.shopId) {
      errors.shopId = 'Cửa hàng là bắt buộc';
    }

    // Image validation
    if (product.imageUrls && product.imageUrls.length > 10) {
      errors.imageUrls = 'Tối đa 10 ảnh cho mỗi sản phẩm';
    }

    return errors;
  }

  static validateUpdateProduct(product: UpdateProduct): ProductValidationErrors {
    const errors: ProductValidationErrors = {};

    // Similar validations as create, but categoryId and shopId are not in UpdateProduct
    if (!product.name || product.name.trim().length === 0) {
      errors.name = 'Tên sản phẩm là bắt buộc';
    } else if (product.name.length > 200) {
      errors.name = 'Tên sản phẩm không được vượt quá 200 ký tự';
    }

    if (product.price === undefined || product.price === null) {
      errors.price = 'Giá sản phẩm là bắt buộc';
    } else if (product.price < 0) {
      errors.price = 'Giá sản phẩm phải lớn hơn hoặc bằng 0';
    }

    if (product.stockQuantity === undefined || product.stockQuantity === null) {
      errors.stockQuantity = 'Số lượng tồn kho là bắt buộc';
    } else if (product.stockQuantity < 0) {
      errors.stockQuantity = 'Số lượng tồn kho phải lớn hơn hoặc bằng 0';
    }

    if (!product.categoryId) {
      errors.categoryId = 'Danh mục là bắt buộc';
    }

    return errors;
  }

  static hasErrors(errors: ProductValidationErrors): boolean {
    return Object.keys(errors).length > 0;
  }
}
