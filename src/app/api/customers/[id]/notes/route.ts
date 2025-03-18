import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Next.js 15 compliant route handler
export async function PATCH(
  request: Request
) {
  try {
    // Extract the ID from the URL path segments
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.indexOf('customers') + 1];
    
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

    const { notes } = await request.json();

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

    // Update only the notes field
    const updatedCustomer = await db.customer.update({
      where: {
        id,
      },
      data: {
        notes: notes || null,
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
    console.error("Error updating customer notes:", error);
    return NextResponse.json(
      { error: "Failed to update customer notes" },
      { status: 500 }
    );
  }
} 