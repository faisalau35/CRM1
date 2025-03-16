import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check database tables
    const tables = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    // Check Customer table columns
    const customerColumns = await db.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Customer'
      ORDER BY ordinal_position;
    `;
    
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
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    // Count records in each table
    const customerCount = await db.customer.count();
    const creditCardCount = await db.creditCard.count();
    
    // Sample data
    const sampleCustomers = await db.customer.findMany({
      take: 3,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    
    const sampleCreditCards = await db.creditCard.findMany({
      take: 3,
      select: {
        id: true,
        customerId: true,
        cardholderName: true
      }
    });
    
    // Check if any credit cards exist for the sample customers
    const sampleCustomerIds = sampleCustomers.map(c => c.id);
    const linkedCards = await db.creditCard.findMany({
      where: {
        customerId: {
          in: sampleCustomerIds
        }
      },
      select: {
        id: true,
        customerId: true
      }
    });
    
    return NextResponse.json({
      tables,
      customerColumns,
      creditCardColumns,
      foreignKeys,
      counts: {
        customers: customerCount,
        creditCards: creditCardCount
      },
      samples: {
        customers: sampleCustomers,
        creditCards: sampleCreditCards,
        linkedCards
      }
    });
  } catch (error) {
    console.error('Error checking schema:', error);
    return NextResponse.json(
      { error: 'Failed to check schema', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 