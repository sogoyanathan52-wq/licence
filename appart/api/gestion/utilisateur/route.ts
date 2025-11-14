import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

// Interface pour le corps de la requête POST
interface UtilisateurBody {
    ecoleId: number;      // ID de l'école à laquelle l'utilisateur appartient
    nom: string;          
    email: string;        // Doit être unique
    motDePasse: string;   // NOTE: Non haché pour la démo, à corriger en Phase IV
    role: Role;           // SUPER_ADMIN, SCHOOL_ADMIN, ou STUDENT
}

/**
 * Route POST pour créer un nouvel Utilisateur (Admin, Super Admin, Élève).
 * POST /api/gestion/utilisateur
 */
export async function POST(request: Request) {
    const body: UtilisateurBody = await request.json();
    const { ecoleId, nom, email, motDePasse, role } = body;

    if (!ecoleId || !nom || !email || !motDePasse || !role) {
        return NextResponse.json({ error: "Paramètres incomplets." }, { status: 400 });
    }

    try {
        // 1. Vérification que l'école existe
        const ecole = await prisma.ecole.findUnique({
            where: { id: ecoleId }
        });

        if (!ecole) {
            return NextResponse.json({ error: `L'école avec l'ID ${ecoleId} n'existe pas.` }, { status: 404 });
        }

        // 2. Création de l'utilisateur
        const nouvelUtilisateur = await prisma.utilisateur.create({
            data: {
                ecoleId,
                nom,
                email,
                motDePasse, // !!! A HACHER EN PHASE IV !!!
                role,
                // Initialise le suivi de gain si c'est un étudiant (nécessaire pour l'algo)
                ...(role === Role.STUDENT && { 
                    suiviGain: { 
                        create: {} // Crée l'enregistrement SuiviGain vide
                    } 
                })
            },
            include: { suiviGain: true }
        });
        
        return NextResponse.json({ 
            message: `Utilisateur ${nom} (${role}) créé avec succès.`, 
            utilisateur: nouvelUtilisateur 
        }, { status: 201 });

    } catch (error) {
        // Gérer l'erreur de doublon d'email
        if (error instanceof Error && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { error: `L'email ${email} est déjà utilisé.` }, 
                { status: 409 }
            );
        }
        console.error("Erreur lors de la création de l'utilisateur:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la création de l'utilisateur." }, 
            { status: 500 }
        );
    }
}
