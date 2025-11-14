export interface CartValidationErrors {
  productId?: string;
  quantity?: string;
}

export interface AddCartItem {
  productId: string;
  quantity: number;
}

export interface UpdateCartItem {
  productId: string;
  quantity: number;
}

export class CartValidator {
  static validateAddItem(item: AddCartItem): CartValidationErrors {
    const errors: CartValidationErrors = {};

    if (!item.productId || item.productId.trim().length === 0) {
      errors.productId = 'Product ID là bắt buộc';
    }

    if (item.quantity <= 0) {
      errors.quantity = 'Số lượng phải lớn hơn 0';
    } else if (item.quantity > 999) {
      errors.quantity = 'Số lượng tối đa là 999';
    }

    return errors;
  }

  static validateUpdateItem(item: UpdateCartItem): CartValidationErrors {
    const errors: CartValidationErrors = {};

    if (!item.productId || item.productId.trim().length === 0) {
      errors.productId = 'Product ID là bắt buộc';
    }

    if (item.quantity < 0) {
      errors.quantity = 'Số lượng không được âm';
    } else if (item.quantity > 999) {
      errors.quantity = 'Số lượng tối đa là 999';
    }

    return errors;
  }

  static hasErrors(errors: CartValidationErrors): boolean {
    return Object.keys(errors).length > 0;
  }
}

