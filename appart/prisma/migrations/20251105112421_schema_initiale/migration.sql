/*
  Warnings:

  - You are about to drop the `PotCommunL3` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `eleveId` on the `Achat` table. All the data in the column will be lost.
  - You are about to drop the column `statutPaiement` on the `Achat` table. All the data in the column will be lost.
  - You are about to drop the column `timestampAchat` on the `Achat` table. All the data in the column will be lost.
  - You are about to drop the column `anneeCalcul` on the `SuiviGain` table. All the data in the column will be lost.
  - You are about to drop the column `eligibleGrandPrix` on the `SuiviGain` table. All the data in the column will be lost.
  - Added the required column `acheteurId` to the `Achat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enregistreParAdminId` to the `Achat` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PotCommunL3_anneeScolaire_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PotCommunL3";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PotCommun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "anneeCalcul" INTEGER NOT NULL,
    "typePot" TEXT NOT NULL,
    "montantActuel" DECIMAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "utilisateurId" TEXT NOT NULL,
    "montant" DECIMAL NOT NULL,
    "type" TEXT NOT NULL,
    "dateCommission" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    CONSTRAINT "Commission_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Achat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "acheteurId" TEXT NOT NULL,
    "parrainId" TEXT,
    "licence" TEXT NOT NULL,
    "montantPaye" DECIMAL NOT NULL DEFAULT 0.0,
    "dateAchat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enregistreParAdminId" TEXT NOT NULL,
    "commissionL1Id" TEXT,
    "commissionPotId" TEXT,
    CONSTRAINT "Achat_acheteurId_fkey" FOREIGN KEY ("acheteurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Achat_parrainId_fkey" FOREIGN KEY ("parrainId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Achat_commissionL1Id_fkey" FOREIGN KEY ("commissionL1Id") REFERENCES "Commission" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Achat_commissionPotId_fkey" FOREIGN KEY ("commissionPotId") REFERENCES "Commission" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Achat" ("id", "licence", "montantPaye") SELECT "id", "licence", "montantPaye" FROM "Achat";
DROP TABLE "Achat";
ALTER TABLE "new_Achat" RENAME TO "Achat";
CREATE UNIQUE INDEX "Achat_commissionL1Id_key" ON "Achat"("commissionL1Id");
CREATE UNIQUE INDEX "Achat_commissionPotId_key" ON "Achat"("commissionPotId");
CREATE INDEX "Achat_acheteurId_dateAchat_idx" ON "Achat"("acheteurId", "dateAchat");
CREATE TABLE "new_SuiviGain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eleveId" TEXT NOT NULL,
    "totalGagneL1" DECIMAL NOT NULL DEFAULT 0,
    "totalGagneL2" DECIMAL NOT NULL DEFAULT 0,
    "totalGagneL3" DECIMAL NOT NULL DEFAULT 0,
    "totalGagneL4" DECIMAL NOT NULL DEFAULT 0,
    "eligibleProchaineCommission" TEXT NOT NULL DEFAULT 'NONE',
    CONSTRAINT "SuiviGain_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SuiviGain" ("eleveId", "id", "totalGagneL1", "totalGagneL2") SELECT "eleveId", "id", "totalGagneL1", "totalGagneL2" FROM "SuiviGain";
DROP TABLE "SuiviGain";
ALTER TABLE "new_SuiviGain" RENAME TO "SuiviGain";
CREATE UNIQUE INDEX "SuiviGain_eleveId_key" ON "SuiviGain"("eleveId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PotCommun_anneeCalcul_typePot_key" ON "PotCommun"("anneeCalcul", "typePot");
