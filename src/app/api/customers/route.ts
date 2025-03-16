import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
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

    const json = await request.json();
    console.log("Received customer data:", JSON.stringify({
      ...json,
      ssn: json.ssn ? "***-**-****" : null
    }, null, 2));
    
    const { firstName, lastName, email, phone, address, city, state, zipCode, dateOfBirth, ssn, driverLicense } = json;

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
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        ssn: ssn || null,
        driverLicense: driverLicense || null,
        userId: user.id,
      },
    });
    console.log("Customer created successfully:", customer.id);

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

export async function GET(request: Request) {
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

    // Get all customers for the current user
    const customers = await db.customer.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        createdAt: true,
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
