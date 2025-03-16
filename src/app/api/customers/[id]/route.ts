import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { type Prisma } from "@prisma/client";

type CreditCardInput = {
  id?: string;
  cardholderName: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  isDefault?: boolean;
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
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

    const customerId = params.id;
    const json = await request.json();
    const { firstName, lastName, email, phone, address, city, state, zipCode, dateOfBirth, ssn, driverLicense, creditCards } = json;

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

    // Update the customer
    const customer = await db.customer.update({
      where: {
        id: customerId,
      },
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        ssn,
        driverLicense,
      },
    });

    // Handle credit cards
    if (creditCards && creditCards.length > 0) {
      // Get existing credit card IDs
      const existingCardIds = existingCustomer.creditCards.map(card => card.id);
      
      // Get IDs of cards to keep
      const updatedCardIds = creditCards
        .filter((card: any) => card.id)
        .map((card: any) => card.id);
      
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
      await Promise.all(creditCards.map(async (card: any) => {
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
              customerId: customer.id,
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
    const updatedCustomer = await db.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        creditCards: true,
      },
    });

    // Sanitize sensitive data before returning
    const sanitizedCustomer = {
      ...updatedCustomer,
      ssn: updatedCustomer?.ssn,
      creditCards: updatedCustomer?.creditCards.map(card => ({
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params.id is available
    const id = params.id;
    
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
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
      return new NextResponse(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
      });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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

    const customerId = params.id;

    // Check if customer exists and belongs to the user
    const existingCustomer = await db.customer.findFirst({
      where: {
        id: customerId,
        userId: user.id,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Delete all credit cards associated with the customer
    await db.creditCard.deleteMany({
      where: {
        customerId,
      },
    });

    // Delete the customer
    await db.customer.delete({
      where: {
        id: customerId,
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