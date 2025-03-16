import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check if CreditCard table exists
    const tables = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'CreditCard';
    `;
    
    const creditCardTableExists = Array.isArray(tables) && tables.length > 0;
    
    if (!creditCardTableExists) {
      return NextResponse.json({
        exists: false,
        message: 'CreditCard table does not exist in the database'
      });
    }
    
    // Check CreditCard table columns
    const creditCardColumns = await db.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'CreditCard'
      ORDER BY ordinal_position;
    `;
    
    // Check foreign key relationships
    const foreignKeys = await db.$queryRaw`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu 
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = 'CreditCard' OR ccu.table_name = 'CreditCard')
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    // Count credit cards
    const creditCardCount = await db.creditCard.count();
    
    // Get distribution of credit cards per customer
    const creditCardDistribution = await db.$queryRaw`
      SELECT "customerId", COUNT(*) as card_count
      FROM "CreditCard"
      GROUP BY "customerId"
      ORDER BY card_count DESC
      LIMIT 10;
    `;
    
    // Sample credit card data (unmasked)
    const sampleCreditCards = await db.creditCard.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Remove CVV but keep full card numbers
    const sanitizedCards = sampleCreditCards.map(card => {
      const { cvv, ...cardData } = card;
      
      return {
        ...cardData,
        // Keep original card number
        cardNumber: card.cardNumber || '',
      };
    });
    
    // Check if any customers have multiple credit cards
    const customersWithMultipleCards = await db.$queryRaw`
      SELECT "customerId", COUNT(*) as card_count
      FROM "CreditCard"
      GROUP BY "customerId"
      HAVING COUNT(*) > 1
      ORDER BY card_count DESC
      LIMIT 5;
    `;
    
    return NextResponse.json({
      exists: true,
      columns: creditCardColumns,
      foreignKeys,
      count: creditCardCount,
      distribution: creditCardDistribution,
      sampleCards: sanitizedCards,
      customersWithMultipleCards
    });
  } catch (error) {
    console.error('Error checking credit card schema:', error);
    return NextResponse.json(
      { error: 'Failed to check credit card schema', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 