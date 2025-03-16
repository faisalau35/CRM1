import { NextRequest, NextResponse } from 'next/server';

// Get API key from environment variables
const API_KEY = process.env.HANDY_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bin = searchParams.get('bin');
  
  if (!bin || bin.length < 6) {
    return NextResponse.json(
      { error: 'Invalid BIN. Must be at least 6 digits.' },
      { status: 400 }
    );
  }
  
  if (!API_KEY) {
    console.error('HANDY_API_KEY environment variable is not set');
    return NextResponse.json(
      { error: 'API configuration error' },
      { status: 500 }
    );
  }
  
  try {
    // Make the request to HandyAPI using the correct endpoint and API key
    const response = await fetch(`https://data.handyapi.com/bin/${bin}`, {
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'application/json'
      },
      // Add cache control
      cache: 'force-cache',
    });
    
    if (!response.ok) {
      throw new Error(`BIN lookup failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the response to match our expected format
    const transformedData = {
      bank: data.Issuer || 'Unknown',
      type: data.Type || 'Unknown',
      category: data.CardTier || data.Scheme || 'Unknown',
      country: data.Country?.Name || 'Unknown',
      scheme: data.Scheme || 'Unknown',
      bin: bin
    };
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('BIN lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup BIN information' },
      { status: 500 }
    );
  }
} 