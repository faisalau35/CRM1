import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a phone number to (XXX) XXX-XXXX format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  // Check if the input is valid
  if (cleaned.length !== 10) {
    return phoneNumber // Return original if not 10 digits
  }
  
  // Format as (XXX) XXX-XXXX
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
}

/**
 * Format a Social Security Number to XXX-XX-XXXX format
 */
export function formatSSN(ssn: string): string {
  // Remove all non-digit characters
  const cleaned = ssn.replace(/\D/g, '')
  
  // Check if the input is valid
  if (cleaned.length !== 9) {
    return ssn // Return original if not 9 digits
  }
  
  // Format as XXX-XX-XXXX
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`
}

/**
 * Format a credit card number with spaces after every 4 digits
 */
export function formatCreditCardNumber(cardNumber: string | undefined | null): string {
  // Return empty string if cardNumber is undefined or null
  if (!cardNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = cardNumber.replace(/\D/g, '')
  
  // Format with spaces after every 4 digits
  const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
  
  return formatted
}
