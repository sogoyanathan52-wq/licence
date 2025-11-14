import { PrismaClient } from "@prisma/client";

// Déclaration globale pour éviter les multiples instanciations du client Prisma
// en mode développement (hot-reloading de Next.js).
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Utilisation du globalThis pour garantir une seule instance
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = prisma;
}
