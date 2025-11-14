import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Role } from '@/types/custom';

// =================================================================
// ROUTE GET pour obtenir la somme des commissions DIRECTES (70%) de l'Admin
// =================================================================
export async function GET(request: Request) {
    try {
        // 1. Récupération des paramètres de l'URL
        const { searchParams } = new URL(request.url);
        const superAdminId = searchParams.get('superAdminId');

        if (!superAdminId) {
            return NextResponse.json({ error: "superAdminId est requis dans l'URL." }, { status: 400 });
        }

        // 2. VÉRIFICATION DU SUPER ADMIN
        const superAdmin = await prisma.utilisateur.findUnique({
            where: { id: superAdminId },
        });

        if (!superAdmin || superAdmin.role !== Role.SUPER_ADMIN) {
            return NextResponse.json({ error: "Accès refusé. Nécessite le rôle SUPER_ADMIN." }, { status: 403 });
        }
        
        // 3. AGGREGATION DES GAINS (70% DIRECTS)
        // On utilise groupBy pour sommer tous les montants qui appartiennent à l'admin,
        // groupés par le type de licence (L1, L2, L3) qui a généré cette commission.
        
        // Note: On filtre par les types 'L1', 'L2', 'L3' qui représentent les commissions 
        // directes de 70% provenant de la vente de ces licences. On ignore les types L4, L3_Pot, etc.
        const gainsDirects = await prisma.commission.groupBy({
            by: ['type'],
            where: {
                utilisateurId: superAdminId,
                type: {
                    in: ['L1', 'L2', 'L3'] // Assurez-vous que ce sont les bons types pour vos commissions directes (70%)
                }
            },
            _sum: {
                montant: true,
            },
            // Optionnel: Trier le résultat pour une meilleure lisibilité
            orderBy: {
                type: 'asc',
            }
        });

        // 4. FORMATTAGE DE LA RÉPONSE
        const resultatsFormates = gainsDirects.map(g => ({
            licence: g.type,
            montantTotalGagne: g._sum.montant ? g._sum.montant.toNumber() : 0,
            taux: '70% (Gain Direct)'
        }));


        return NextResponse.json({
            message: `Synthèse des gains directs (70%) pour le Super Admin ${superAdminId}.`,
            totalCommissionsParLicence: resultatsFormates,
            // Calcul du Grand Total pour toi, Nathan
            grandTotalTousGains: resultatsFormates.reduce((acc, curr) => acc + curr.montantTotalGagne, 0)
        });

    } catch (error) {
        console.error("Erreur lors de la récupération des gains de l'Admin:", error);
        return NextResponse.json({ error: "Erreur interne du serveur lors de l'agrégation des gains." }, { status: 500 });
    }
}