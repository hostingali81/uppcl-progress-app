// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

type DateFormatOptions = {
  includeTime?: boolean;
  locale?: string;
};

export function formatDate(dateString: string, options: DateFormatOptions = {}): string {
  const { includeTime = true, locale = 'en-IN' } = options;
  const date = new Date(dateString);

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  return date.toLocaleDateString(locale, formatOptions);
}

/**
 * Convert an amount stored in lacs to rupees and format with Indian grouping.
 * Example: 12.5 (lacs) => "₹12,50,000" (when withCurrency is true)
 */
export function formatAmountFromLacs(amountLacs?: number | null, withCurrency = true, fractionDigits = 0): string {
  if (amountLacs === null || amountLacs === undefined) return 'N/A';
  const rupees = amountLacs * 100000;
  const formatted = rupees.toLocaleString('en-IN', { maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits });
  return withCurrency ? `₹${formatted}` : formatted;
}

/**
 * Format a date into dd-mm-yyyy. Accepts Date or ISO date string.
 */
export function formatDateDDMMYYYY(dateInput?: string | Date | null): string {
  if (!dateInput) return 'N/A';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  const day = `${d.getDate()}`.padStart(2, '0');
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function (...args: Parameters<T>): void {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}