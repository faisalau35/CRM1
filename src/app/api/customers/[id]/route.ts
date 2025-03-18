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

// Next.js 15 compliant route handler
export async function PATCH(
  request: Request,
  context: { params: { id: string }}
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const customerId = context.params.id;
    const json = await request.json();
    const { 
      fullName,
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
      ipAddress,
      status,
      creditCards 
    } = json;

    // Check if customer exists and belongs to the user
    const existingCustomer = await db.customer.findFirst({
      where: {
        id: customerId,
        userId: user.id,
      },
      include: {
        creditCards: true,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Update the customer with fullName instead of firstName and lastName
    let updatedCustomer;
    try {
      updatedCustomer = await db.customer.update({
        where: {
          id: customerId,
        },
        data: {
          fullName,
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
          ipAddress: ipAddress || null,
          status: status || undefined,
        },
      });
      console.log("Customer updated successfully:", updatedCustomer.id);
    } catch (error) {
      console.error("Error updating customer:", error);
      return NextResponse.json(
        { error: "Failed to update customer data" },
        { status: 500 }
      );
    }

    // Handle credit cards
    if (creditCards && creditCards.length > 0) {
      // Get existing credit card IDs
      const existingCardIds = existingCustomer.creditCards.map(card => card.id);
      
      // Get IDs of cards to keep
      const updatedCardIds = creditCards
        .filter((card: CreditCardData) => card.id)
        .map((card: CreditCardData) => card.id);
      
      // Delete cards that are no longer in the list
      const cardsToDelete = existingCardIds.filter(id => !updatedCardIds.includes(id));
      if (cardsToDelete.length > 0) {
        await db.creditCard.deleteMany({
          where: {
            id: {
              in: cardsToDelete,
            },
          },
        });
      }
      
      // Update or create cards
      await Promise.all(creditCards.map(async (card: CreditCardData) => {
        if (card.id) {
          // Update existing card
          await db.creditCard.update({
            where: {
              id: card.id,
            },
            data: {
              cardholderName: card.cardholderName,
              cardNumber: card.cardNumber,
              expiryMonth: card.expiryMonth,
              expiryYear: card.expiryYear,
              cvv: card.cvv,
              isDefault: card.isDefault || false,
            },
          });
        } else {
          // Create new card
          await db.creditCard.create({
            data: {
              cardholderName: card.cardholderName,
              cardNumber: card.cardNumber,
              expiryMonth: card.expiryMonth,
              expiryYear: card.expiryYear,
              cvv: card.cvv,
              isDefault: card.isDefault || false,
              customerId: updatedCustomer.id,
            },
          });
        }
        
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

    // Fetch updated customer with credit cards
    const updatedCustomerWithCards = await db.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        creditCards: true,
      },
    });

    // Sanitize sensitive data before returning
    const sanitizedCustomer = {
      ...updatedCustomerWithCards,
      ssn: updatedCustomerWithCards?.ssn,
      creditCards: updatedCustomerWithCards?.creditCards.map(card => ({
        ...card,
        cardNumber: card.cardNumber,
        cvv: card.cvv,
      })),
    };

    return NextResponse.json(sanitizedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// Next.js 15 compliant route handler
export async function GET(
  request: Request,
  context: { params: { id: string }}
) {
  try {
    // Get the id from the params
    const id = context.params.id;
    
    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }
    
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await db.customer.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        creditCards: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Next.js 15 compliant route handler
export async function DELETE(
  request: Request,
  context: { params: { id: string }}
) {
  try {
    // Get the id from the params
    const id = context.params.id;
    
    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if customer exists and belongs to the user
    const existingCustomer = await db.customer.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Delete all credit cards associated with the customer
    await db.creditCard.deleteMany({
      where: {
        customerId: id,
      },
    });

    // Delete the customer
    await db.customer.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
} 