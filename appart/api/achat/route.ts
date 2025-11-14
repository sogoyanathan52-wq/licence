// import { NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import { Role, Licence, PotType, EligibleCommissionType } from '@/types/custom';
// import { PrismaClient } from '@prisma/client';

// // Constantes de commission
// const COMMISSION_L1_PARRAIN_RATE = 0.70; // 70% pour le propriétaire/parrain
// const POT_COMMUN_RATE = 0.30;          // 30% pour le Pot Commun (Utilisé pour la distribution L2/L3 l'année prochaine)

// // Initialiser PrismaClient sans exporter directement
// const localPrisma = new PrismaClient();

// export async function POST(request: Request) {
//     let transaction;
//     try {
//         const { adminId, acheteurId, parrainId, licence, montantPaye, annee } = await request.json();

//         // Ajout de la vérification de tous les champs
//         if (!adminId || !acheteurId || !licence || !montantPaye || !annee) {
//             return NextResponse.json({ error: "Tous les champs (adminId, acheteurId, licence, montantPaye, annee) sont requis." }, { status: 400 });
//         }
        
//         // 1. VÉRIFICATION DU RÔLE ADMIN
//         const admin = await localPrisma.utilisateur.findUnique({
//             where: { id: adminId },
//         });

//         if (!admin || (admin.role !== Role.SUPER_ADMIN && admin.role !== Role.ADMIN_ECOLE)) {
//             return NextResponse.json({ error: "Accès refusé. Nécessite un rôle ADMIN." }, { status: 403 });
//         }

//         // 2. VÉRIFICATION DE L'ACHETEUR
//         const acheteur = await localPrisma.utilisateur.findUnique({
//             where: { id: acheteurId },
//         });

//         if (!acheteur || acheteur.role !== Role.STUDENT) {
//             return NextResponse.json({ error: "L'acheteur doit être un étudiant (STUDENT)." }, { status: 400 });
//         }

//         // 3. DÉMARRAGE DE LA TRANSACTION
//         transaction = await localPrisma.$transaction(async (tx) => {
            
//             // 3.1 Création de l'Achat
//             const achat = await tx.achat.create({
//                 data: {
//                     acheteurId: acheteurId,
//                     parrainId: parrainId || null, 
//                     licence: licence,
//                     montantPaye: montantPaye,
//                     dateAchat: new Date(),
//                     enregistreParAdminId: adminId,
//                 }
//             });

//             // 3.2 Déterminer le Pot Commun et le type de commission d'éligibilité
//             const contributionPotCommun = montantPaye * POT_COMMUN_RATE;
//             let potType: PotType;
//             let eligibleCommissionType: EligibleCommissionType;
//             let messageAchat = "";

//             switch(licence) {
//                 case Licence.L1:
//                     potType = PotType.L2; // Vente L1 alimente le Pot L2
//                     eligibleCommissionType = EligibleCommissionType.L2; // L'acheteur L1 devient éligible à la commission L2
//                     messageAchat = `Achat L1. 30% versé au Pot L2 pour la commission L2 de l'année prochaine.`;
//                     break;
//                 case Licence.L2:
//                     potType = PotType.L3; // Vente L2 alimente le Pot L3
//                     eligibleCommissionType = EligibleCommissionType.L3; // L'acheteur L2 devient éligible à la commission L3
//                     messageAchat = `Achat L2. 30% versé au Pot L3 pour la commission L3 de l'année prochaine.`;
//                     break;
//                 case Licence.L3:
//                     potType = PotType.L4; // Vente L3 alimente le Pot L4
//                     eligibleCommissionType = EligibleCommissionType.L4; // L'acheteur L3 devient éligible au Grand Prix L4
//                     messageAchat = `Achat L3. 30% versé au Pot L4 pour le Grand Prix du meilleur projet.`;
//                     break;
//                 default:
//                     throw new Error("Type de licence non géré.");
//             }

//             // 3.3 Mise à jour du Pot Commun
//             let potCommun = await tx.potCommun.findFirst({
//                 where: { anneeCalcul: annee, typePot: potType }
//             });

//             if (potCommun) {
//                 potCommun = await tx.potCommun.update({
//                     where: { id: potCommun.id },
//                     data: {
//                         montantActuel: { increment: contributionPotCommun }
//                     }
//                 });
//             } else {
//                 potCommun = await tx.potCommun.create({
//                     data: {
//                         anneeCalcul: annee,
//                         montantActuel: contributionPotCommun,
//                         typePot: potType,
//                     }
//                 });
//             }

//             // 3.4 Mise à jour du SuiviGain pour l'acheteur (Marquage d'éligibilité)
//             const suiviGain = await tx.suiviGain.upsert({
//                 where: { eleveId: acheteurId },
//                 update: {
//                     eligibleProchaineCommission: eligibleCommissionType
//                 }, 
//                 create: {
//                     eleveId: acheteurId,
//                     eligibleProchaineCommission: eligibleCommissionType
//                 }
//             });

//             // 3.5 Gestion de la Commission L1 (si L1 acheté et parrainé)
//             if (licence === Licence.L1 && parrainId) {
//                 const montantL1 = montantPaye * COMMISSION_L1_PARRAIN_RATE; // 70% pour le parrain
                
//                 const commission = await tx.commission.create({
//                     data: {
//                         montant: montantL1,
//                         utilisateurId: parrainId,
//                         type: 'L1',
//                         description: `Commission L1 (70%) pour le parrainage de l'achat #${achat.id}`,
//                     }
//                 });
                
//                 await tx.suiviGain.update({
//                     where: { eleveId: parrainId },
//                     data: { totalGagneL1: { increment: montantL1 } }
//                 });

//                 await tx.achat.update({
//                     where: { id: achat.id },
//                     data: { commissionL1Id: commission.id }
//                 });
//             }


//             return {
//                 achat: achat,
//                 potCommun: potCommun,
//                 suiviGain: suiviGain,
//                 message: messageAchat,
//             };

//         }, { timeout: 10000 }); 

//         return NextResponse.json(transaction);

//     } catch (error) {
//         console.error("Erreur lors de l'enregistrement de l'achat:", error);
//         return NextResponse.json({ error: "Erreur interne du serveur lors de l'enregistrement de l'achat." }, { status: 500 });
//     }
// }

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Role, Licence, PotType, EligibleCommissionType } from '@/types/custom';
import { PrismaClient } from '@prisma/client';

// Constantes de commission
const COMMISSION_L1_PARRAIN_RATE = 0.70; // 70% pour le propriétaire/parrain
const POT_COMMUN_RATE = 0.30;          // 30% pour le Pot Commun (Utilisé pour la distribution L2/L3 l'année prochaine)

// Initialiser PrismaClient sans exporter directement
const localPrisma = new PrismaClient();

export async function POST(request: Request) {
    let transaction;
    try {
        const { adminId, acheteurId, parrainId, licence, montantPaye, annee } = await request.json();

        // Ajout de la vérification de tous les champs
        if (!adminId || !acheteurId || !licence || !montantPaye || !annee) {
            return NextResponse.json({ error: "Tous les champs (adminId, acheteurId, licence, montantPaye, annee) sont requis." }, { status: 400 });
        }
        
        // 1. VÉRIFICATION DU RÔLE ADMIN
        const admin = await localPrisma.utilisateur.findUnique({
            where: { id: adminId },
        });

        if (!admin || (admin.role !== Role.SUPER_ADMIN && admin.role !== Role.ADMIN_ECOLE)) {
            return NextResponse.json({ error: "Accès refusé. Nécessite un rôle ADMIN." }, { status: 403 });
        }

        // 2. VÉRIFICATION DE L'ACHETEUR
        const acheteur = await localPrisma.utilisateur.findUnique({
            where: { id: acheteurId },
        });

        if (!acheteur || acheteur.role !== Role.STUDENT) {
            return NextResponse.json({ error: "L'acheteur doit être un étudiant (STUDENT)." }, { status: 400 });
        }

        // 3. DÉMARRAGE DE LA TRANSACTION
        transaction = await localPrisma.$transaction(async (tx) => {
            
            // 3.1 Création de l'Achat
            const achat = await tx.achat.create({
                data: {
                    acheteurId: acheteurId,
                    parrainId: parrainId || null, 
                    licence: licence,
                    montantPaye: montantPaye,
                    dateAchat: new Date(),
                    enregistreParAdminId: adminId,
                }
            });

            // 3.2 Déterminer le Pot Commun et le type de commission d'éligibilité
            const contributionPotCommun = montantPaye * POT_COMMUN_RATE;
            let potType: PotType;
            let eligibleCommissionType: EligibleCommissionType;
            let messageAchat = "";

            switch(licence) {
                case Licence.L1:
                    potType = PotType.L2; // Vente L1 alimente le Pot L2
                    eligibleCommissionType = EligibleCommissionType.L2; // L'acheteur L1 devient éligible à la commission L2
                    messageAchat = `Achat L1. 30% versé au Pot L2 pour la commission L2 de l'année prochaine.`;
                    break;
                case Licence.L2:
                    potType = PotType.L3; // Vente L2 alimente le Pot L3
                    eligibleCommissionType = EligibleCommissionType.L3; // L'acheteur L2 devient éligible à la commission L3
                    messageAchat = `Achat L2. 30% versé au Pot L3 pour la commission L3 de l'année prochaine.`;
                    break;
                case Licence.L3:
                    potType = PotType.L4; // Vente L3 alimente le Pot L4
                    eligibleCommissionType = EligibleCommissionType.L4; // L'acheteur L3 devient éligible au Grand Prix L4
                    messageAchat = `Achat L3. 30% versé au Pot L4 pour le Grand Prix du meilleur projet.`;
                    break;
                default:
                    throw new Error("Type de licence non géré.");
            }

            // 3.3 Mise à jour du Pot Commun
            let potCommun = await tx.potCommun.findFirst({
                where: { anneeCalcul: annee, typePot: potType }
            });

            if (potCommun) {
                potCommun = await tx.potCommun.update({
                    where: { id: potCommun.id },
                    data: {
                        montantActuel: { increment: contributionPotCommun }
                    }
                });
            } else {
                potCommun = await tx.potCommun.create({
                    data: {
                        anneeCalcul: annee,
                        montantActuel: contributionPotCommun,
                        typePot: potType,
                    }
                });
            }

            // 3.4 Mise à jour du SuiviGain pour l'acheteur (Marquage d'éligibilité)
            // Cette ligne utilise déjà upsert, donc elle est sécurisée.
            const suiviGainAcheteur = await tx.suiviGain.upsert({
                where: { eleveId: acheteurId },
                update: {
                    eligibleProchaineCommission: eligibleCommissionType
                }, 
                create: {
                    eleveId: acheteurId,
                    eligibleProchaineCommission: eligibleCommissionType
                }
            });

            // 3.5 Gestion de la Commission L1 (si L1 acheté et parrainé)
            if (licence === Licence.L1 && parrainId) {
                const montantL1 = montantPaye * COMMISSION_L1_PARRAIN_RATE; // 70% pour le parrain
                
                const commission = await tx.commission.create({
                    data: {
                        montant: montantL1,
                        utilisateurId: parrainId,
                        type: 'L1',
                        description: `Commission L1 (70%) pour le parrainage de l'achat #${achat.id}`,
                    }
                });
                
                // --- CORRECTION CRUCIALE DE L'ERREUR P2025 ---
                // On utilise upsert pour s'assurer que l'enregistrement SuiviGain du parrain existe.
                await tx.suiviGain.upsert({
                    where: { eleveId: parrainId },
                    update: { // Si l'enregistrement existe, on met à jour (comportement normal)
                        totalGagneL1: { increment: montantL1 }
                    },
                    create: { // Si l'enregistrement n'existe PAS (premier achat du SuperAdmin), on le crée
                        eleveId: parrainId,
                        totalGagneL1: montantL1, // On initialise avec le montant de la première commission
                        // eligibleProchaineCommission prend la valeur par défaut
                    }
                });

                await tx.achat.update({
                    where: { id: achat.id },
                    data: { commissionL1Id: commission.id }
                });
            }


            return {
                achat: achat,
                potCommun: potCommun,
                suiviGain: suiviGainAcheteur,
                message: messageAchat,
            };

        }, { timeout: 10000 }); 

        return NextResponse.json(transaction);

    } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'achat:", error);
        // Il est souvent utile d'afficher le type d'erreur pour le debug.
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        return NextResponse.json({ error: "Erreur interne du serveur lors de l'enregistrement de l'achat.", details: errorMessage }, { status: 500 });
    }
}