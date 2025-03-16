import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const password = "admin123"; // This is just for development, change in production

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("Root user already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: "Admin User",
        password: hashedPassword,
      },
    });

    console.log("Root user created successfully:", user.email);
  } catch (error) {
    console.error("Error creating root user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();