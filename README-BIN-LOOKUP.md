# Credit Card BIN Lookup Implementation

This document explains how the credit card BIN (Bank Identification Number) lookup feature is implemented in the CRM system.

## Overview

The BIN lookup feature allows the system to automatically detect and display information about a credit card based on its first 6-8 digits (the BIN). This information includes:

- The issuing bank name
- Card type/brand (e.g., Classic, Gold, Platinum)
- Card scheme (Visa, Mastercard, Amex, etc.)
- Country of issuance
- Card validity

## Implementation Details

### 1. BIN Lookup Service

The core functionality is implemented in `src/lib/binLookup.ts`, which provides:

- `lookupCardDetails(cardNumber)`: Fetches card details using local database with API enhancement
- `validateCardNumber(cardNumber)`: Validates a card number using the Luhn algorithm

### 2. Local BIN Database

The system uses a comprehensive local BIN database (`src/lib/binDatabase.ts`) as the primary source of information. This database includes:

- Major card networks (Visa, Mastercard, Amex, Discover, JCB, etc.)
- Specific bank cards from various regions (US, UK, Europe, Asia, etc.)
- Card types and brands

The local database is used as the first lookup source, ensuring that the system works reliably even without internet connectivity or when API rate limits are reached.

### 3. API Enhancement

When available, the system attempts to enhance the local data with information from the binlist.net API:

```typescript
// Call the BIN lookup API through our server-side proxy
const response = await fetch(`/api/bin-lookup?bin=${bin}`);
```

The API can provide additional details such as:
- More specific bank information
- Country details
- Card type (debit/credit)
- Prepaid status

### 4. Server-side Proxy

To avoid CORS issues, the system uses a server-side proxy (`src/app/api/bin-lookup/route.ts`) to make requests to the binlist.net API:

```typescript
// Make the request from the server side to avoid CORS issues
const response = await fetch(`https://lookup.binlist.net/${bin}`, {
  headers: {
    'Accept-Version': '3',
  },
  cache: 'force-cache',
});
```

### 5. Caching

To improve performance and reduce API calls, results are cached:

```typescript
// Cache BIN lookup results to avoid repeated API calls
const binCache: Record<string, CardDetails> = {};
```

### 6. Card Icons

Card scheme icons are implemented in `src/components/icons.tsx` and displayed based on the detected scheme.

## Usage in Forms

The BIN lookup is integrated into both the "New Customer" and "Edit Customer" forms:

1. As the user types a card number, it's formatted with spaces for readability
2. Once at least 6 digits are entered, a lookup is triggered
3. The system first checks the local database for a match
4. If online, it attempts to enhance the data with API information
5. The card details are displayed, including:
   - Card scheme icon
   - Bank name
   - Card type
   - Country of issuance
   - Validity indicator

## Extending the System

### Adding More BINs to Local Database

To add more BINs to the local database, edit the `LOCAL_BINS` object in `src/lib/binDatabase.ts`:

```typescript
export const LOCAL_BINS: Record<string, string> = {
  // Add new BINs here
  "123456": "New Bank - Card Type",
};
```

### Using a Different BIN API

To use a different BIN lookup API:

1. Modify the server-side proxy in `src/app/api/bin-lookup/route.ts`
2. Update the response parsing in `lookupCardDetails` function to match the new API's format

## Handling API Limitations

The binlist.net API has the following limitations:

- Rate limit of 5 requests per hour with a burst allowance of 5
- Returns 429 status code when rate limit is exceeded
- May not have information for all BINs

Our implementation handles these limitations by:

1. Using the local database as the primary source of information
2. Only attempting API enhancement if the local lookup succeeds
3. Gracefully falling back to local data if the API fails
4. Caching results to minimize API calls

## Security Considerations

- The BIN lookup only uses the first 6-8 digits of the card, which are not considered sensitive information
- Full card numbers are never sent to external services
- Card numbers are masked in the UI and database for security
- The system validates card numbers using the Luhn algorithm to prevent obviously invalid entries 