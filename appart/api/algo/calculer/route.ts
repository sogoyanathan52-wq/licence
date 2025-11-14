import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Role, PotType, EligibleCommissionType, Licence } from '@/types/custom';
import { PrismaClient } from '@prisma/client';
// Import du type Decimal pour gérer correctement les montants monétaires
import { Decimal } from '@prisma/client/runtime/library';

// Constante de taux inchangée
const POT_COMMUN_RATE = 0.30; 

// ========================================================================================
// DEFINITION DES VALEURS FIXES DE CHAQUE SLOT (30% du prix de vente de la licence source)
// ========================================================================================
// Prix de vente des Licences (Confirmés par Nathan):
// - L1: 3500 FCFA => Slot L2 = 3500 * 0.30 = 1050 FCFA
// - L2: 4500 FCFA => Slot L3 = 4500 * 0.30 = 1350 FCFA
// - L3: 5500 FCFA => Slot L4 = 5500 * 0.30 = 1650 FCFA
const SLOT_PRICE_MAP = {
    [PotType.L2]: 1050, // Slot généré par une Licence.L1 (3500 * 0.30)
    [PotType.L3]: 1350, // Slot généré par une Licence.L2 (4500 * 0.30)
    [PotType.L4]: 1650, // Slot généré par une Licence.L3 (5500 * 0.30)
};

// Initialiser PrismaClient
const localPrisma = new PrismaClient();

// =================================================================
// ROUTE POST pour lancer le calcul des commissions L2/L3/L4 (à retardement)
// =================================================================
export async function POST(request: Request) {
    let transaction;
    try {
        // Récupération dynamique de 'maxSlots' (sogmusik)
        const { superAdminId, anneeCalcul, maxSlots } = await request.json();

        if (!superAdminId || !anneeCalcul || maxSlots === undefined) {
            return NextResponse.json({ error: "superAdminId, anneeCalcul, et maxSlots (sogmusik) sont requis." }, { status: 400 });
        }
        
        // Utilisation de la variable sogmusik reçue
        const MAX_SLOTS_PER_BENEFICIAIRE = maxSlots;

        // 1. VÉRIFICATION DU SUPER ADMIN
        const superAdmin = await localPrisma.utilisateur.findUnique({
            where: { id: superAdminId },
        });

        if (!superAdmin || superAdmin.role !== Role.SUPER_ADMIN) {
            return NextResponse.json({ error: "Accès refusé. Nécessite le rôle SUPER_ADMIN." }, { status: 403 });
        }

        // 2. DÉMARRAGE DE LA TRANSACTION
        transaction = await localPrisma.$transaction(async (tx) => {
            
            const commissionsDistribuees = [];
            
            // Processus de distribution pour L2, L3, et L4.
            for (const potType of [PotType.L2, PotType.L3, PotType.L4]) {
                
                // Récupérer la valeur du slot pour ce type de pot
                const slotValue = SLOT_PRICE_MAP[potType];

                if (!slotValue) {
                    commissionsDistribuees.push({ type: potType, status: `Erreur: Valeur de slot inconnue pour le type de pot ${potType}.` });
                    continue;
                }
                
                // Déterminer la licence qui a généré le pot et la commission associée.
                const licenceGeneratrice: Licence = potType === PotType.L2 ? Licence.L1 : potType === PotType.L3 ? Licence.L2 : Licence.L3;
                const typeCommission: EligibleCommissionType = potType as unknown as EligibleCommissionType; 
                
                // 2.1. Récupération du Pot Commun
                const potCommun = await tx.potCommun.findFirst({
                    where: { anneeCalcul: anneeCalcul, typePot: potType }
                });
                
                // Si le pot est vide ou n'existe pas, passer au suivant
                if (!potCommun || (potCommun.montantActuel as Decimal).toNumber() <= 0) {
                    commissionsDistribuees.push({ type: potType, status: `Pot ${potType} vide pour l'année ${anneeCalcul}.` });
                    continue; 
                }

                const montantPotInitial = (potCommun.montantActuel as Decimal).toNumber();
                
                // 2.2. Trouver les élèves éligibles pour cette commission
                const elevesEligibles = await tx.suiviGain.findMany({
                    where: {
                        eligibleProchaineCommission: typeCommission, 
                    },
                    include: {
                        eleve: { select: { id: true, nom: true } }
                    },
                    orderBy: { eleveId: 'asc' } // Ordre déterministe (Ancienneté)
                });

                if (elevesEligibles.length === 0) {
                    commissionsDistribuees.push({ type: potType, status: `Pot ${potType} non distribué. Aucun élève n'est éligible pour la commission ${typeCommission}.` });
                    continue;
                }

                // 2.3. Trouver tous les achats qui ont alimenté le pot (la "source" des commissions)
                const achatsSource = await tx.achat.findMany({
                    where: {
                        licence: licenceGeneratrice, 
                        // Assurer que nous ciblons les achats de l'année de calcul
                        dateAchat: { 
                            gte: new Date(`${anneeCalcul}-01-01T00:00:00Z`), 
                            lte: new Date(`${anneeCalcul}-12-31T23:59:59Z`) 
                        },
                        commissionPotId: null // Pas encore de commission de pot attribuée
                    },
                    orderBy: { dateAchat: 'asc' } // Tri par date pour attribuer les slots dans l'ordre
                });

                let achatsRestants = [...achatsSource];
                let beneficiaireIndex = 0;
                let totalCommissionDistribuee = 0;
                
                const elevesQuiGagnent = [];

                // =======================================================
                // LOGIQUE L4 (Pot Commun - Calcul seulement, Distribution manuelle)
                // =======================================================
                if (potType === PotType.L4) {
                    if (montantPotInitial > 0) {
                        // Le SUPER_ADMIN a demandé de NE PAS distribuer ce pot automatiquement.
                        // Nous affichons uniquement le montant total du pot L4 (somme des 30% de L3).
                        commissionsDistribuees.push({ 
                            type: potType, 
                            montantTotalPot: montantPotInitial, 
                            status: `Pot L4: ${montantPotInitial.toFixed(2)} FCFA CALCULÉ et RÉSERVÉ.`,
                            note: "Le pot L4 (Meilleur Projet) n'a pas été distribué ni décrémenté (Distribution manuelle)."
                        });
                        
                        // totalCommissionDistribuee reste à 0, donc le pot ne sera PAS décrémenté à la fin.
                    }
                    // On passe à l'itération suivante car le travail pour L4 est terminé (calcul seulement).
                    continue; 
                } 
                // =======================================================
                // LOGIQUE L2 et L3 (Partage par Slot (sogmusik))
                // =======================================================
                else if (potType === PotType.L2 || potType === PotType.L3) {
                    // Boucle principale : tant qu'il y a des achats à distribuer ET des bénéficiaires
                    while (achatsRestants.length > 0 && beneficiaireIndex < elevesEligibles.length) {
                        const beneficiaire = elevesEligibles[beneficiaireIndex].eleve;
                        let slotsAttribues = 0;
                        let montantGagneParBeneficiaire = 0;
                        const achatsCommissionnes = [];

                        // Distribuer jusqu'à MAX_SLOTS_PER_BENEFICIAIRE commissions d'achat (ton sogmusik)
                        for (let i = 0; i < MAX_SLOTS_PER_BENEFICIAIRE && achatsRestants.length > 0; i++) {
                            const achat = achatsRestants.shift()!; // Prendre le premier achat disponible (priorité)
                            
                            // UTILISATION DU MONTANT DE SLOT DYNAMIQUE ET FIXE
                            const commissionSlot = slotValue; 
                            montantGagneParBeneficiaire += commissionSlot;
                            slotsAttribues++;
                            achatsCommissionnes.push(achat.id);
                        }
                        
                        // Si le bénéficiaire a gagné quelque chose
                        if (montantGagneParBeneficiaire > 0) {
                            // Créer une seule commission pour ce bénéficiaire pour tous les slots
                            const commission = await tx.commission.create({
                                data: {
                                    montant: montantGagneParBeneficiaire,
                                    utilisateurId: beneficiaire.id,
                                    type: potType + '_Pot', // Utiliser L2_Pot ou L3_Pot pour identifier le gain
                                    description: `Commission ${potType} (${slotsAttribues} slots sogmusik) de l'année ${anneeCalcul}`,
                                }
                            });
                            
                            // Mettre à jour les gains du bénéficiaire
                            await tx.suiviGain.update({
                                where: { eleveId: beneficiaire.id },
                                data: {
                                    totalGagneL2: potType === PotType.L2 ? { increment: montantGagneParBeneficiaire } : undefined,
                                    totalGagneL3: potType === PotType.L3 ? { increment: montantGagneParBeneficiaire } : undefined,
                                }
                            });
                            
                            // Mettre à jour les achats pour les marquer comme commissionnés
                            await tx.achat.updateMany({
                                where: { id: { in: achatsCommissionnes } },
                                data: { commissionPotId: commission.id }
                            });

                            totalCommissionDistribuee += montantGagneParBeneficiaire;
                            elevesQuiGagnent.push({ type: potType, montant: montantGagneParBeneficiaire, utilisateur: beneficiaire, slots: slotsAttribues });
                        }

                        beneficiaireIndex++; // Passer au bénéficiaire suivant
                    }

                    // Log des résultats L2/L3
                    elevesQuiGagnent.forEach(c => commissionsDistribuees.push(c));
                }
                
                // =======================================================
                // MISE À JOUR DU POT (UNIQUEMENT LORSQUE totalCommissionDistribuee > 0)
                // =======================================================
                // totalCommissionDistribuee sera > 0 seulement pour L2 et L3. 
                // Pour L4, il reste 0, donc le pot n'est pas touché.
                let montantFinalADecrementer = totalCommissionDistribuee;

                if (montantFinalADecrementer > 0) {
                    // VÉRIFICATION DE SÉCURITÉ
                    if (montantFinalADecrementer > montantPotInitial) {
                        console.error(`Alerte de sécurité: Tentative de distribution de ${montantFinalADecrementer} FCFA alors que le pot n'a que ${montantPotInitial} FCFA.`);
                        montantFinalADecrementer = montantPotInitial; // Empêcher la distribution au-delà du pot
                    }
                
                    // Mettre à jour le pot en décrémentant ce qui a été distribué
                    await tx.potCommun.update({
                        where: { id: potCommun.id },
                        data: { 
                            montantActuel: { decrement: montantFinalADecrementer } 
                        }
                    });
                
                    commissionsDistribuees.push({ type: potType, status: `Pot ${potType} : ${totalCommissionDistribuee.toFixed(2)} FCFA distribué. Reste dans le pot: ${(montantPotInitial - montantFinalADecrementer).toFixed(2)}` });
                }
            }

            return {
                message: `Calcul effectué pour l'année ${anneeCalcul}.`,
                details: commissionsDistribuees
            };

        }, { timeout: 10000 }); 

        return NextResponse.json(transaction);

    } catch (error) {
        console.error("Erreur lors du calcul des commissions:", error);
        return NextResponse.json({ error: "Erreur interne du serveur lors du calcul des commissions." }, { status: 500 });
    }
}