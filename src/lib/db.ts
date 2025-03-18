import { PrismaClient } from "@prisma/client";

declare global {
  var cachedPrisma: PrismaClient;
}

export const db: PrismaClient = process.env.NODE_ENV === "production" 
  ? new PrismaClient() 
  : global.cachedPrisma || (global.cachedPrisma = new PrismaClient()); 