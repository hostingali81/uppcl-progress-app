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

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
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