import { NextRequest, NextResponse } from 'next/server';

// Get API key from environment variables or use the provided key as fallback
const API_KEY = process.env.HANDY_API_KEY || 'HAS-0YFgDJ6nsyHbMu7KdY92';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bin = searchParams.get('bin');
  
  if (!bin || bin.length < 6) {
    return NextResponse.json(
      { error: 'Invalid BIN. Must be at least 6 digits.' },
      { status: 400 }
    );
  }
  
  try {
    // Make the request to HandyAPI using the correct endpoint and API key
    const response = await fetch(`https://data.handyapi.com/bin/${bin}`, {
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'application/json'
      },
      // Use no-store to ensure fresh data
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      console.error(`BIN lookup failed with status: ${response.status}`);
      
      // Return a fallback response with default values
      return NextResponse.json({
        bank: 'Unknown',
        type: 'Unknown',
        category: 'Unknown',
        country: 'Unknown',
        scheme: detectCardScheme(bin) || 'Unknown',
        bin: bin
      });
    }
    
    const data = await response.json();
    
    // Transform the response to match our expected format
    const transformedData = {
      bank: data.Issuer || 'Unknown',
      type: data.Type || 'Unknown',
      category: data.CardTier || data.Scheme || 'Unknown',
      country: data.Country?.Name || 'Unknown',
      scheme: data.Scheme || detectCardScheme(bin) || 'Unknown',
      bin: bin
    };
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('BIN lookup error:', error);
    
    // Return a fallback response with default values
    return NextResponse.json({
      bank: 'Unknown',
      type: 'Unknown',
      category: 'Unknown',
      country: 'Unknown',
      scheme: detectCardScheme(bin) || 'Unknown',
      bin: bin
    });
  }
}

// Helper function to detect card scheme from BIN
function detectCardScheme(bin: string): string | undefined {
  if (/^4/.test(bin)) return "VISA";
  if (/^5[1-5]/.test(bin)) return "MASTERCARD";
  if (/^3[47]/.test(bin)) return "AMEX";
  if (/^6(?:011|5)/.test(bin)) return "DISCOVER";
  if (/^(?:2131|1800|35)/.test(bin)) return "JCB";
  if (/^3(?:0[0-5]|[68])/.test(bin)) return "DINERS CLUB";
  if (/^(?:5[0678]|6[37])/.test(bin)) return "MAESTRO";
  return undefined;
} 