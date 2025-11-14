import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

interface EcoleBody {
    nom: string;
    ville?: string;
}

/**
 * Route POST pour créer une nouvelle École.
 * POST /api/gestion/ecole
 */
export async function POST(request: Request) {
    const body: EcoleBody = await request.json();
    const { nom, ville } = body;

    if (!nom) {
        return NextResponse.json({ error: "Le nom de l'école est requis." }, { status: 400 });
    }

    try {
        const nouvelleEcole = await prisma.ecole.create({
            data: {
                nom,
                ville,
            }
        });
        
        return NextResponse.json({ 
            message: `École ${nom} créée avec succès.`, 
            ecole: nouvelleEcole 
        }, { status: 201 });

    } catch (error) {
        // Gérer l'erreur si le nom de l'école existe déjà (unique)
        if (error instanceof Error && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { error: `L'école nommée ${nom} existe déjà.` }, 
                { status: 409 }
            );
        }
        console.error("Erreur lors de la création de l'école:", error);
        return NextResponse.json(
            { error: "Erreur serveur lors de la création de l'école." }, 
            { status: 500 }
        );
    }
}
