import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        purchaseDate: 'desc', // Plus récent en premier
      },
    })

    return NextResponse.json({
      success: true,
      purchases,
      total: purchases.length,
    })
  } catch (error) {
    console.error('Erreur récupération achats:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}