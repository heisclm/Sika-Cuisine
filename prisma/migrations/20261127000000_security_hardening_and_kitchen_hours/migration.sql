-- Idempotent migration syncing schema hardening & kitchen auto-schedule columns/indexes
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

ALTER TABLE "RestaurantSettings" ADD COLUMN IF NOT EXISTS "kitchenScheduleMode" TEXT NOT NULL DEFAULT 'AUTO';

CREATE INDEX IF NOT EXISTS "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");

CREATE INDEX IF NOT EXISTS "Order_assignedRiderId_fulfilmentStatus_idx" ON "Order"("assignedRiderId", "fulfilmentStatus");
