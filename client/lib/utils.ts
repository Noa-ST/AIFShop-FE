import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number to Vietnamese Dong currency (VND)
export function formatCurrencyVND(value: number | string | null | undefined): string {
  const amount = typeof value === "string" ? Number(value) : value ?? 0;
  if (Number.isNaN(amount as number)) return "0₫";
  try {
    return (amount as number).toLocaleString("vi-VN") + "₫";
  } catch {
    return `${amount}₫`;
  }
}

// Format price with currency symbol (more flexible)
export function formatPrice(price: number | string | null | undefined): string {
  const amount = typeof price === "string" ? Number(price) : price ?? 0;
  if (Number.isNaN(amount as number)) return "0₫";
  
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount as number);
  } catch {
    return formatCurrencyVND(amount);
  }
}

// Format price without currency symbol (just number with separators)
export function formatPriceNumber(price: number | string | null | undefined): string {
  const amount = typeof price === "string" ? Number(price) : price ?? 0;
  if (Number.isNaN(amount as number)) return "0";
  
  try {
    return new Intl.NumberFormat('vi-VN').format(amount as number);
  } catch {
    return String(amount);
  }
}