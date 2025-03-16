// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Only import db in server environment
let db: any = null;
if (!isBrowser) {
  // Use require instead of import to avoid bundling issues
  try {
    // This will only run on the server
    db = require("@/lib/db").db;
  } catch (error) {
    console.error("Failed to import db:", error);
  }
}

// Interface for card details
export interface CardDetails {
  bankName?: string;
  cardType?: string;
  scheme?: string;
  country?: string;
  isValid?: boolean;
  cardTier?: string;
}

// Handy API response interface
interface HandyAPIResponse {
  Status: string;
  Scheme: string;
  Type: string;
  Issuer: string;
  CardTier: string;
  Country: {
    A2: string;
    A3: string;
    N3: string;
    ISD: string;
    Name: string;
    Cont: string;
  };
  Luhn: boolean;
}

// API keys for Handy API
const HANDY_API_KEYS = {
  frontend: process.env.NEXT_PUBLIC_HANDY_API_KEY || '',
  backend: process.env.HANDY_API_KEY || '',
};

// Validate card number using Luhn algorithm
export function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  
  let sum = 0;
  let shouldDouble = false;
  
  // Loop through digits in reverse
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i));
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
}

// Import LOCAL_BINS from binDatabase
import { LOCAL_BINS } from './binDatabase';

// Detect card scheme from card number (fallback)
function detectCardScheme(cardNumber: string): string | undefined {
  const digits = cardNumber.replace(/\D/g, '');
  
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(?:011|5)/.test(digits)) return "discover";
  if (/^(?:2131|1800|35)/.test(digits)) return "jcb";
  if (/^3(?:0[0-5]|[68])/.test(digits)) return "diners club";
  if (/^(?:5[0678]|6[37])/.test(digits)) return "maestro";
  
  return undefined;
}

// Detect bank name from card number using LOCAL_BINS database
function detectBankNameFallback(cardNumber: string): string | undefined {
  const digits = cardNumber.replace(/\D/g, '');
  
  // Check for matches from longest to shortest BIN
  for (let length = 6; length >= 1; length--) {
    const prefix = digits.slice(0, length);
    if (LOCAL_BINS[prefix]) {
      return LOCAL_BINS[prefix];
    }
  }
  
  return undefined;
}

// Check if we have the BIN in our database cache - SERVER ONLY
async function checkBinCache(bin: string): Promise<CardDetails | null> {
  if (isBrowser || !db) {
    return null; // Skip cache check in browser or if db is not available
  }
  
  try {
    const cachedBin = await db.binCache.findUnique({
      where: { bin },
    });
    
    if (cachedBin) {
      return {
        bankName: cachedBin.bankName || undefined,
        cardType: cachedBin.cardType || undefined,
        scheme: cachedBin.scheme || undefined,
        country: cachedBin.country || undefined,
        isValid: cachedBin.isValid,
        cardTier: cachedBin.cardTier || undefined,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error checking BIN cache:", error);
    return null;
  }
}

// Save BIN details to our database cache - SERVER ONLY
async function saveBinToCache(bin: string, details: CardDetails): Promise<void> {
  if (isBrowser || !db) {
    return; // Skip cache save in browser or if db is not available
  }
  
  try {
    await db.binCache.upsert({
      where: { bin },
      update: {
        bankName: details.bankName,
        cardType: details.cardType,
        scheme: details.scheme,
        country: details.country,
        cardTier: details.cardTier,
        isValid: details.isValid ?? true,
        updatedAt: new Date(),
      },
      create: {
        bin,
        bankName: details.bankName,
        cardType: details.cardType,
        scheme: details.scheme,
        country: details.country,
        cardTier: details.cardTier,
        isValid: details.isValid ?? true,
      },
    });
  } catch (error) {
    console.error("Error saving BIN to cache:", error);
  }
}

// Fetch BIN details from Handy API directly
async function fetchBinFromHandyAPI(bin: string): Promise<CardDetails | null> {
  try {
    // Use the frontend key for client-side requests
    const apiKey = isBrowser ? HANDY_API_KEYS.frontend : HANDY_API_KEYS.backend;
    
    const response = await fetch(`https://data.handyapi.com/bin/${bin}`, {
      headers: {
        'x-api-key': apiKey
      },
      // Add cache control
      cache: 'force-cache',
    });
    
    if (!response.ok) {
      console.error(`Handy API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data: HandyAPIResponse = await response.json();
    
    if (data.Status !== "SUCCESS") {
      console.error(`Handy API returned non-success status: ${data.Status}`);
      return null;
    }
    
    // Map Handy API response to our CardDetails interface
    return {
      bankName: data.Issuer,
      cardType: data.Type.toLowerCase(),
      scheme: data.Scheme.toLowerCase(),
      country: data.Country.Name,
      cardTier: data.CardTier,
      isValid: data.Luhn,
    };
  } catch (error) {
    console.error("Error fetching from Handy API:", error);
    return null;
  }
}

// Fetch BIN details from our API route (browser-safe)
async function fetchBinFromApiRoute(bin: string): Promise<CardDetails | null> {
  try {
    const response = await fetch(`/api/bin-lookup?bin=${bin}`);
    
    if (!response.ok) {
      console.error(`API route error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Map API response to our CardDetails interface
    return {
      bankName: data.bank,
      cardType: data.type.toLowerCase(),
      scheme: data.scheme.toLowerCase(),
      country: data.country,
      cardTier: data.category,
      isValid: true, // Assume valid since our API doesn't return this
    };
  } catch (error) {
    console.error("Error fetching from API route:", error);
    return null;
  }
}

// Main function to lookup card details
export async function lookupCardDetails(cardNumber: string): Promise<CardDetails> {
  const digits = cardNumber.replace(/\D/g, '');
  
  // Use first 6 digits as BIN
  const bin = digits.slice(0, 6);
  
  // In browser environment, use the API route
  if (isBrowser) {
    try {
      // Try to fetch from our API route first
      const apiRouteDetails = await fetchBinFromApiRoute(bin);
      if (apiRouteDetails) {
        return apiRouteDetails;
      }
      
      // If API route fails, try direct HandyAPI call
      const apiDetails = await fetchBinFromHandyAPI(bin);
      if (apiDetails) {
        return apiDetails;
      }
    } catch (error) {
      console.error("Error in browser BIN lookup:", error);
      // Fall through to fallback
    }
  } else {
    // Server-side flow with cache
    // Check if we have this BIN in our cache
    const cachedDetails = await checkBinCache(bin);
    if (cachedDetails) {
      console.log("Using cached BIN data:", bin);
      return cachedDetails;
    }
    
    // Try to fetch from Handy API
    const apiDetails = await fetchBinFromHandyAPI(bin);
    if (apiDetails) {
      console.log("Got BIN data from Handy API:", bin);
      
      // Save to cache for future lookups
      await saveBinToCache(bin, apiDetails);
      
      return apiDetails;
    }
  }
  
  // Fallback to local detection if API fails
  console.log("Using fallback BIN detection for:", bin);
  
  // Validate card number
  const isValid = validateCardNumber(digits);
  
  // Get card scheme
  const scheme = detectCardScheme(digits);
  
  // Get bank name from local database
  const bankName = detectBankNameFallback(digits);
  
  // Create card details object
  const fallbackDetails: CardDetails = {
    bankName,
    cardType: scheme === "visa" || scheme === "mastercard" ? "credit" : undefined,
    scheme,
    country: "Unknown", // We don't have country data in our fallback
    isValid,
  };
  
  // Save fallback data to cache (server-side only)
  if (!isBrowser) {
    await saveBinToCache(bin, fallbackDetails);
  }
  
  return fallbackDetails;
} 