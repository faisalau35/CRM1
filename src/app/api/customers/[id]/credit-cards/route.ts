import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching credit cards for customer ID: ${customerId}`);

    // First check if the customer exists
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Fetch credit cards directly
    const creditCards = await db.creditCard.findMany({
      where: { customerId },
    });

    console.log(`Found ${creditCards.length} credit cards for customer ${customerId}`);

    // Mask sensitive data
    const sanitizedCards = creditCards.map(card => {
      const { cvv, ...cardData } = card;
      // Return full card number instead of masking it
      
      return {
        ...cardData,
        // Keep original card number
        cardNumber: card.cardNumber || '',
      };
    });

    return NextResponse.json({
      customerId,
      creditCards: sanitizedCards
    });
  } catch (error) {
    console.error('Error fetching credit cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit cards', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 