-- DropIndex
DROP INDEX "Achat_commissionPotId_key";

-- CreateIndex
CREATE INDEX "Achat_commissionPotId_idx" ON "Achat"("commissionPotId");
