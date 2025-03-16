-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('IN_PROCESS', 'ENGAGED', 'DEAD');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "status" "CustomerStatus";
