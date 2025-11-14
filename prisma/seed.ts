import prisma from "@/lib/prisma";
import { Role, Licence, EligibleCommissionType, PotType } from "@/types/custom";

async function main() {
  // 1️⃣ Créer super admin et élèves
  const superAdmin = await prisma.utilisateur.upsert({
    where: { email: "superadmin@example.com" },
    update: {},
    create: {
      nom: "Super Admin",
      email: "superadmin@example.com",
      motDePasse: "admin123",
      role: Role.SUPER_ADMIN,
    },
  });

  const anciensL1 = ["David", "Exau", "Brel"];
  for (let i = 0; i < anciensL1.length; i++) {
    const name = anciensL1[i];
    await prisma.utilisateur.upsert({
      where: { email: `${name.toLowerCase()}2024@example.com` },
      update: {},
      create: {
        nom: name,
        email: `${name.toLowerCase()}2024@example.com`,
        motDePasse: "test123",
        role: Role.STUDENT,
      },
    });
  }

  const nouveauxL1 = ["Eleve1", "Eleve2", "Eleve3", "Eleve4", "Eleve5"];
  for (let i = 0; i < nouveauxL1.length; i++) {
    const name = nouveauxL1[i];
    await prisma.utilisateur.upsert({
      where: { email: `${name.toLowerCase()}2025@example.com` },
      update: {},
      create: {
        nom: name,
        email: `${name.toLowerCase()}2025@example.com`,
        motDePasse: "test123",
        role: Role.STUDENT,
      },
    });
  }

  // 2️⃣ Simuler achats L1 en 2024
  const eleves2024 = await prisma.utilisateur.findMany({
    where: { email: { in: ["david2024@example.com","exau2024@example.com","brel2024@example.com"] } },
  });

  for (const eleve of eleves2024) {
    await prisma.achat.create({
      data: {
        acheteurId: eleve.id,
        licence: Licence.L1,
        montantPaye: 1000,
        dateAchat: new Date("2024-10-01"),
        enregistreParAdminId: superAdmin.id,
        anneeAchat: 2024,
      },
    });

    await prisma.suiviGain.upsert({
      where: { eleveId: eleve.id },
      update: { eligibleProchaineCommission: EligibleCommissionType.L2 },
      create: {
        eleveId: eleve.id,
        eligibleProchaineCommission: EligibleCommissionType.L2,
      },
    });
  }

  // 3️⃣ Simuler achats L1 en 2025 (nouveaux L1)
  const eleves2025 = await prisma.utilisateur.findMany({
    where: { email: { in: nouveauxL1.map(n => `${n.toLowerCase()}2025@example.com`) } },
  });

  for (const eleve of eleves2025) {
    await prisma.achat.create({
      data: {
        acheteurId: eleve.id,
        licence: Licence.L1,
        montantPaye: 1000,
        dateAchat: new Date("2025-02-01"),
        enregistreParAdminId: superAdmin.id,
        anneeAchat: 2025,
      },
    });
  }

  // 4️⃣ Créer PotCommun L2 pour 2025 (issus achats anciens L1)
  await prisma.potCommun.upsert({
    where: { typePot_anneeCalcul: { typePot: PotType.L2, anneeCalcul: 2025 } },
    update: { montantActuel: 3000 }, // somme des 3 anciens L1 (1000*30%)
    create: {
      typePot: PotType.L2,
      anneeCalcul: 2025,
      montantActuel: 3000,
    },
  });

  // 5️⃣ Préparer slots et L4
  // Les anciens L1 -> éligibles L2
  // Ici on peut ajuster avant de lancer /api/algo/calculer
  console.log("✅ Seed terminé, les achats et pots sont prêts pour 2025.");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
