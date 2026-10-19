-- CreateEnum
CREATE TYPE "StoreRole" AS ENUM ('OWNER', 'STAFF', 'CATALOG_MANAGER');

-- CreateTable
CREATE TABLE "StoreMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "role" "StoreRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreInvitation" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StoreRole" NOT NULL DEFAULT 'STAFF',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "acceptedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreMembership_userId_idx" ON "StoreMembership"("userId");

-- CreateIndex
CREATE INDEX "StoreMembership_storeId_idx" ON "StoreMembership"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreMembership_userId_storeId_key" ON "StoreMembership"("userId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreInvitation_token_key" ON "StoreInvitation"("token");

-- CreateIndex
CREATE INDEX "StoreInvitation_storeId_idx" ON "StoreInvitation"("storeId");

-- CreateIndex
CREATE INDEX "StoreInvitation_email_idx" ON "StoreInvitation"("email");

-- AddForeignKey
ALTER TABLE "StoreMembership" ADD CONSTRAINT "StoreMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreMembership" ADD CONSTRAINT "StoreMembership_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreInvitation" ADD CONSTRAINT "StoreInvitation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: create OWNER membership for every existing store owner
INSERT INTO "StoreMembership" ("id", "userId", "storeId", "role", "createdAt", "updatedAt")
SELECT 'mem_' || "id", "ownerId", "id", 'OWNER', NOW(), NOW()
FROM "Store"
ON CONFLICT ("userId", "storeId") DO NOTHING;
