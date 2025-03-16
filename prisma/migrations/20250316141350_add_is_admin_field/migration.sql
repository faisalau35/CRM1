/*
  Warnings:

  - The values [IN_PROCESS] on the enum `CustomerStatus` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `status` on table `Customer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CustomerStatus_new" AS ENUM ('IN_PROGRESS', 'ENGAGED', 'DEAD');
ALTER TABLE "Customer" ALTER COLUMN "status" TYPE "CustomerStatus_new" USING ("status"::text::"CustomerStatus_new");
ALTER TYPE "CustomerStatus" RENAME TO "CustomerStatus_old";
ALTER TYPE "CustomerStatus_new" RENAME TO "CustomerStatus";
DROP TYPE "CustomerStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;
