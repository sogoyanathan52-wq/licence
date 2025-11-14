-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ecoleId" INTEGER,
    "totalGagneL1" REAL NOT NULL DEFAULT 0,
    "totalGagneL2" REAL NOT NULL DEFAULT 0,
    "totalGagneL3" REAL NOT NULL DEFAULT 0,
    "totalGagneL4" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Utilisateur_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "Ecole" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ecole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "ville" TEXT
);

-- CreateTable
CREATE TABLE "Achat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acheteurId" INTEGER NOT NULL,
    "licence" TEXT NOT NULL,
    "montantPaye" REAL NOT NULL,
    "dateAchat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anneeAchat" INTEGER NOT NULL DEFAULT 2025,
    "enregistreParAdminId" INTEGER NOT NULL,
    "potCommunId" INTEGER,
    CONSTRAINT "Achat_acheteurId_fkey" FOREIGN KEY ("acheteurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Achat_enregistreParAdminId_fkey" FOREIGN KEY ("enregistreParAdminId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Achat_potCommunId_fkey" FOREIGN KEY ("potCommunId") REFERENCES "PotCommun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PotCommun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "typePot" TEXT NOT NULL,
    "montantActuel" REAL NOT NULL DEFAULT 0,
    "anneeCalcul" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "SuiviGain" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eleveId" INTEGER NOT NULL,
    "eligibleProchaineCommission" TEXT NOT NULL DEFAULT 'NONE',
    "totalGagneL1" REAL NOT NULL DEFAULT 0,
    "totalGagneL2" REAL NOT NULL DEFAULT 0,
    "totalGagneL3" REAL NOT NULL DEFAULT 0,
    "totalGagneL4" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "SuiviGain_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfitSuperAdmin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "achatId" INTEGER NOT NULL,
    "montant" REAL NOT NULL,
    "dateGain" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfitSuperAdmin_achatId_fkey" FOREIGN KEY ("achatId") REFERENCES "Achat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ecole_nom_key" ON "Ecole"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "PotCommun_typePot_anneeCalcul_key" ON "PotCommun"("typePot", "anneeCalcul");

-- CreateIndex
CREATE UNIQUE INDEX "SuiviGain_eleveId_key" ON "SuiviGain"("eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfitSuperAdmin_achatId_key" ON "ProfitSuperAdmin"("achatId");
