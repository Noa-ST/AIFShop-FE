import { CreateAddress, UpdateAddress } from "@/services/addressService";

export interface AddressValidationErrors {
  recipientName?: string;
  phoneNumber?: string;
  fullStreet?: string;
  ward?: string;
  district?: string;
  province?: string;
  country?: string;
}

export class AddressValidator {
  private static readonly PHONE_PATTERN = /^(0|\+84)[1-9][0-9]{8,9}$/;

  static validate(
    address: CreateAddress | UpdateAddress
  ): AddressValidationErrors {
    const errors: AddressValidationErrors = {};

    // Recipient name
    if (!address.recipientName || address.recipientName.trim().length === 0) {
      errors.recipientName = "Tên người nhận là bắt buộc";
    } else if (address.recipientName.length > 100) {
      errors.recipientName =
        "Tên người nhận không được vượt quá 100 ký tự";
    }

    // Phone number
    if (!address.phoneNumber || address.phoneNumber.trim().length === 0) {
      errors.phoneNumber = "Số điện thoại là bắt buộc";
    } else {
      const cleanPhone = address.phoneNumber.replace(/\s/g, "").replace(/-/g, "");
      if (!this.PHONE_PATTERN.test(cleanPhone)) {
        errors.phoneNumber =
          "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0 hoặc +84).";
      }
    }

    // Full street
    if (!address.fullStreet || address.fullStreet.trim().length === 0) {
      errors.fullStreet = "Địa chỉ đường là bắt buộc";
    } else if (address.fullStreet.length > 200) {
      errors.fullStreet = "Địa chỉ đường không được vượt quá 200 ký tự";
    }

    // Ward
    if (!address.ward || address.ward.trim().length === 0) {
      errors.ward = "Phường/Xã là bắt buộc";
    } else if (address.ward.length > 100) {
      errors.ward = "Phường/Xã không được vượt quá 100 ký tự";
    }

    // District
    if (!address.district || address.district.trim().length === 0) {
      errors.district = "Quận/Huyện là bắt buộc";
    } else if (address.district.length > 100) {
      errors.district = "Quận/Huyện không được vượt quá 100 ký tự";
    }

    // Province
    if (!address.province || address.province.trim().length === 0) {
      errors.province = "Tỉnh/Thành phố là bắt buộc";
    } else if (address.province.length > 100) {
      errors.province = "Tỉnh/Thành phố không được vượt quá 100 ký tự";
    }

    return errors;
  }

  static hasErrors(errors: AddressValidationErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  static formatPhoneNumber(phone: string): string {
    // Remove spaces and dashes
    let cleaned = phone.replace(/\s/g, "").replace(/-/g, "");

    // Convert +84 to 0 if needed
    if (cleaned.startsWith("+84")) {
      cleaned = "0" + cleaned.substring(3);
    }

    return cleaned;
  }
}

