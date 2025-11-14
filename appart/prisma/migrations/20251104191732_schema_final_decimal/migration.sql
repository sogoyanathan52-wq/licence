-- CreateTable
CREATE TABLE "Ecole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "ville" TEXT
);

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ecoleId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Utilisateur_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "Ecole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Achat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eleveId" TEXT NOT NULL,
    "licence" TEXT NOT NULL,
    "montantPaye" DECIMAL NOT NULL DEFAULT 0.0,
    "timestampAchat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statutPaiement" TEXT NOT NULL,
    CONSTRAINT "Achat_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SuiviGain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eleveId" TEXT NOT NULL,
    "totalGagneL1" DECIMAL NOT NULL DEFAULT 0,
    "totalGagneL2" DECIMAL NOT NULL DEFAULT 0,
    "eligibleGrandPrix" BOOLEAN NOT NULL DEFAULT false,
    "anneeCalcul" INTEGER,
    CONSTRAINT "SuiviGain_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PotCommunL3" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "anneeScolaire" INTEGER NOT NULL,
    "montantActuel" DECIMAL NOT NULL DEFAULT 0,
    "laureatId" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Ecole_nom_key" ON "Ecole"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE INDEX "Achat_eleveId_timestampAchat_idx" ON "Achat"("eleveId", "timestampAchat");

-- CreateIndex
CREATE UNIQUE INDEX "SuiviGain_eleveId_key" ON "SuiviGain"("eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "PotCommunL3_anneeScolaire_key" ON "PotCommunL3"("anneeScolaire");
