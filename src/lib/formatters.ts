// src/lib/formatters.ts

/**
 * Format number to Indian currency format (with commas)
 * Example: 1234567 -> 12,34,567
 */
export function formatIndianCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return 'N/A';
  }

  // Convert to string and split into integer and decimal parts
  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering system: last 3 digits, then groups of 2
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  
  // Return with decimal part if not .00
  if (decimalPart && decimalPart !== '00') {
    return `₹${formatted}.${decimalPart}`;
  }
  
  return `₹${formatted}`;
}

/**
 * Format number to Indian currency format without rupee symbol
 */
export function formatIndianNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return 'N/A';
  }

  // Convert to string
  const integerPart = Math.floor(num).toString();

  // Indian numbering system: last 3 digits, then groups of 2
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
}

/**
 * Format number to Indian currency in Lakhs
 * Example: 1234567 -> ₹12.35 Lakhs
 */
export function formatIndianLakhs(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return 'N/A';
  }

  const lakhs = num / 100000;
  return `₹${lakhs.toFixed(2)} Lakhs`;
}

/**
 * Parse Indian formatted number back to number
 * Example: "12,34,567" -> 1234567
 */
export function parseIndianNumber(value: string): number | null {
  if (!value || value === 'N/A') {
    return null;
  }

  // Remove rupee symbol, commas, and spaces
  const cleaned = value.replace(/[₹,\s]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}
