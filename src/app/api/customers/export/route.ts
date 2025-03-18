import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { customerIds } = await request.json();

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or missing customerIds' },
        { status: 400 }
      );
    }

    console.log('Export API called with customer IDs:', customerIds);

    // First, check if credit cards exist for these customers
    const creditCardCheck = await db.creditCard.findMany({
      where: {
        customerId: {
          in: customerIds,
        },
      },
      select: {
        id: true,
        customerId: true,
      },
    });

    console.log(`Found ${creditCardCheck.length} credit cards in database for these customers`);
    
    if (creditCardCheck.length > 0) {
      console.log('Sample credit card IDs:', creditCardCheck.slice(0, 3).map(c => c.id));
      console.log('Customer IDs with cards:', [...new Set(creditCardCheck.map(c => c.customerId))]);
    }

    // Fetch complete customer data including all fields and related credit cards
    const customers = await db.customer.findMany({
      where: {
        id: {
          in: customerIds,
        },
      },
      include: {
        creditCards: true, // Simplified to ensure it works
      },
    });

    // Log the number of customers and credit cards for debugging
    console.log(`Exporting ${customers.length} customers`);
    const totalCards = customers.reduce((sum, customer) => sum + (customer.creditCards?.length || 0), 0);
    console.log(`Total credit cards: ${totalCards}`);

    // Check if any customers have credit cards
    const customersWithCards = customers.filter(c => c.creditCards && c.creditCards.length > 0);
    console.log(`${customersWithCards.length} customers have credit cards`);

    if (customersWithCards.length > 0) {
      // Log a sample customer with cards
      const sampleCustomer = customersWithCards[0];
      console.log('Sample customer with cards:', {
        id: sampleCustomer.id,
        cardCount: sampleCustomer.creditCards.length,
        firstCard: sampleCustomer.creditCards[0] ? {
          id: sampleCustomer.creditCards[0].id,
          cardNumber: sampleCustomer.creditCards[0].cardNumber,
          hasCardholderName: !!sampleCustomer.creditCards[0].cardholderName
        } : 'No cards'
      });
    } else if (creditCardCheck.length > 0) {
      // We found cards in the direct query but not in the customer include - this indicates a problem
      console.log('WARNING: Found credit cards in direct query but not in customer include!');
      
      // Try a direct join to debug
      const customerWithCardsRaw = await db.$queryRaw`
        SELECT c.id as customer_id, c."fullName", 
               cc.id as card_id, cc."cardNumber", cc."cardholderName"
        FROM "Customer" c
        JOIN "CreditCard" cc ON c.id = cc."customerId"
        WHERE c.id IN (${customerIds.join(',')})
        LIMIT 5
      `;
      
      console.log('Raw query results:', customerWithCardsRaw);
    }

    // Remove sensitive data from credit cards if included
    const sanitizedCustomers = customers.map(customer => {
      const { creditCards, ...customerData } = customer;
      
      // If credit cards are included, sanitize them
      if (creditCards && creditCards.length > 0) {
        console.log(`Customer ${customer.id} has ${creditCards.length} credit cards`);
        
        const sanitizedCards = creditCards.map(card => {
          // Remove CVV but keep full card number
          const { cvv, ...cardData } = card;
          
          return {
            ...cardData,
            // Keep the original card number instead of masking it
            cardNumber: card.cardNumber || '',
          };
        });
        
        return {
          ...customerData,
          creditCards: sanitizedCards,
        };
      }
      
      return {
        ...customerData,
        creditCards: [], // Ensure creditCards is always an array, even if empty
      };
    });

    // Final check of the response data
    const responseCheck = {
      totalCustomers: sanitizedCustomers.length,
      customersWithCards: sanitizedCustomers.filter(c => c.creditCards && c.creditCards.length > 0).length,
      totalCardsInResponse: sanitizedCustomers.reduce((sum, c) => sum + (c.creditCards?.length || 0), 0)
    };
    
    console.log('Response check:', responseCheck);

    return NextResponse.json(sanitizedCustomers);
  } catch (error) {
    console.error('Error exporting customers:', error);
    return NextResponse.json(
      { error: 'Failed to export customers', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 