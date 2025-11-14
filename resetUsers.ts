import prisma from "@/lib/prisma";

async function main() {
  // Supprimer tous les utilisateurs
  await prisma.utilisateur.deleteMany({});

  console.log("Tous les utilisateurs ont été supprimés !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
