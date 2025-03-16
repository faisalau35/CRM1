import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Define interface for credit card data
interface CreditCardData {
  id?: string;
  cardholderName: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  isDefault?: boolean;
  bin?: string;
  bankName?: string;
  cardType?: string;
  scheme?: string;
  country?: string;
}

export async function POST(request: Request) {
  try {
    // Get the session from the request
    const session = await getServerSession(authOptions);
    console.log("Session in API route:", session ? "Session exists" : "No session", 
      session?.user ? `User: ${session.user.email}` : "No user in session");
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "No valid session or user email found" 
      }, { status: 401 });
    }

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    
    console.log("User lookup result:", user ? `User found with ID: ${user.id}` : "User not found");

    if (!user) {
      return NextResponse.json({ 
        error: "User not found", 
        details: `No user found with email: ${session.user.email}` 
      }, { status: 404 });
    }

    const json = await request.json();
    console.log("Received customer data:", JSON.stringify({
      ...json,
      ssn: json.ssn ? "***-**-****" : null
    }, null, 2));
    
    const { 
      firstName, 
      lastName, 
      email, 
      secondaryEmail, 
      phone, 
      secondaryPhone, 
      address, 
      city, 
      state, 
      zipCode, 
      dateOfBirth, 
      ssn, 
      driverLicense,
      notes,
      creditCards
    } = json;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }

    // Create the customer
    console.log("Creating customer with data:", { firstName, lastName, email, phone });
    const customer = await db.customer.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        secondaryEmail: secondaryEmail || null,
        phone: phone || null,
        secondaryPhone: secondaryPhone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        ssn: ssn || null,
        driverLicense: driverLicense || null,
        notes: notes || null,
        status: "IN_PROGRESS",
        userId: user.id,
      },
    });
    console.log("Customer created successfully:", customer.id);

    // Handle credit cards if provided
    if (creditCards && creditCards.length > 0) {
      console.log(`Processing ${creditCards.length} credit cards for customer ${customer.id}`);
      
      // Create credit cards for the customer
      await Promise.all(creditCards.map(async (card: CreditCardData) => {
        // Create new card
        const newCard = await db.creditCard.create({
          data: {
            cardholderName: card.cardholderName,
            cardNumber: card.cardNumber,
            expiryMonth: card.expiryMonth,
            expiryYear: card.expiryYear,
            cvv: card.cvv,
            isDefault: card.isDefault || false,
            customerId: customer.id,
          },
        });
        
        console.log(`Created credit card ${newCard.id} for customer ${customer.id}`);
        
        // If BIN data is provided, store it in the cache
        if (card.bin) {
          await db.binCache.upsert({
            where: { bin: card.bin },
            update: {
              bankName: card.bankName,
              cardType: card.cardType,
              scheme: card.scheme,
              country: card.country,
              updatedAt: new Date(),
            },
            create: {
              bin: card.bin,
              bankName: card.bankName,
              cardType: card.cardType,
              scheme: card.scheme,
              country: card.country,
            },
          });
        }
      }));
    }

    // Sanitize sensitive data before returning
    const sanitizedCustomer = {
      ...customer,
      ssn: customer.ssn ? `XXX-XX-${customer.ssn.slice(-4)}` : null,
    };

    console.log("Returning sanitized customer data");
    return NextResponse.json(sanitizedCustomer);
  } catch (error) {
    console.error("Error creating customer:", error);
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: "Failed to create customer", 
        message: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const customers = await db.customer.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return new NextResponse(JSON.stringify(customers));
  } catch (error) {
    console.error("Error getting customers:", error);
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new NextResponse(JSON.stringify({ 
      error: "Failed to get customers", 
      message: errorMessage,
      stack: process.env.NODE_ENV === "development" ? errorStack : undefined 
    }), { status: 500 });
  }
}
