-- CreateTable
CREATE TABLE "BinCache" (
    "id" TEXT NOT NULL,
    "bin" TEXT NOT NULL,
    "bankName" TEXT,
    "cardType" TEXT,
    "scheme" TEXT,
    "country" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BinCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BinCache_bin_key" ON "BinCache"("bin");

-- CreateIndex
CREATE INDEX "BinCache_bin_idx" ON "BinCache"("bin");
