// import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/db'
// import { z } from 'zod'

// const WinnerSchema = z.object({
//   year: z.number().min(2025),
//   studentId: z.number().positive(),
//   amount: z.number().positive(),
// })

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json()
//     const validated = WinnerSchema.parse(body)
    
//     const { year, studentId, amount } = validated
    
//     // Vérifier que l'étudiant existe et a acheté L3 cette année
//     const student = await prisma.student.findUnique({
//       where: { id: studentId },
//       include: {
//         purchases: {
//           where: {
//             level: 'L3',
//             year: year,
//           },
//         },
//       },
//     })
    
//     if (!student) {
//       return NextResponse.json(
//         { error: 'Étudiant introuvable' },
//         { status: 404 }
//       )
//     }
    
//     if (student.purchases.length === 0) {
//       return NextResponse.json(
//         { error: `${student.name} n'a pas acheté L3 en ${year}` },
//         { status: 400 }
//       )
//     }
    
//     // Vérifier que le fonds existe et a assez d'argent
//     const fund = await prisma.l4Fund.findUnique({
//       where: { year },
//     })
    
//     if (!fund) {
//       return NextResponse.json(
//         { error: `Aucun fonds L4 pour l'année ${year}` },
//         { status: 404 }
//       )
//     }
    
//     if (fund.totalAmount < amount) {
//       return NextResponse.json(
//         { error: `Fonds insuffisant. Disponible: ${fund.totalAmount} FCFA` },
//         { status: 400 }
//       )
//     }
    
//     // Transaction : enregistrer le gagnant + déduire du fonds
//     await prisma.$transaction(async (tx) => {
//       // Enregistrer la commission gagnante
//       await tx.commission.create({
//         data: {
//           beneficiaireId: studentId,
//           fromStudentId: studentId,
//           fromPurchaseId: student.purchases[0].id,
//           montant: amount,
//           fromLevel: 'L4',
//           beneficiaireLevel: 'L4',
//           year,
//           type: 'L4_winner',
//           statut: 'non_paye',
//         },
//       })
      
//       // Déduire du fonds L4
//       await tx.l4Fund.update({
//         where: { year },
//         data: {
//           totalAmount: { decrement: amount },
//         },
//       })
//     })
    
//     return NextResponse.json({
//       success: true,
//       winner: {
//         name: student.name,
//         amount,
//         year,
//       },
//       remainingFund: fund.totalAmount - amount,
//     })
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Validation échouée', details: error.errors },
//         { status: 400 }
//       )
//     }
    
//     console.error('Erreur distribution L4:', error)
//     return NextResponse.json(
//       { error: 'Erreur serveur' },
//       { status: 500 }
//     )
//   }
// }

// // Voir tous les gagnants L4
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const year = searchParams.get('year')
    
//     const where: any = { type: 'L4_winner' }
//     if (year) where.year = parseInt(year)
    
//     const winners = await prisma.commission.findMany({
//       where,
//       include: {
//         beneficiaire: true,
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//     })
    
//     return NextResponse.json({
//       winners: winners.map(w => ({
//         year: w.year,
//         name: w.beneficiaire?.name,
//         amount: w.montant,
//         date: w.createdAt,
//         statut: w.statut,
//       })),
//       totalDistributed: winners.reduce((sum, w) => sum + w.montant, 0),
//     })
//   } catch (error) {
//     console.error('Erreur récupération gagnants L4:', error)
//     return NextResponse.json(
//       { error: 'Erreur serveur' },
//       { status: 500 }
//     )
//   }
// }







import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const WinnerSchema = z.object({
  year: z.number().min(2025),
  studentId: z.number().positive(),
  amount: z.number().positive(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = WinnerSchema.parse(body)
    
    const { year, studentId, amount } = validated
    
    // Vérifier que l'étudiant existe et a acheté L3 cette année
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        purchases: {
          where: {
            level: 'L3',
            year: year,
          },
        },
      },
    })
    
    if (!student) {
      return NextResponse.json(
        { error: 'Étudiant introuvable' },
        { status: 404 }
      )
    }
    
    if (student.purchases.length === 0) {
      return NextResponse.json(
        { error: `${student.name} n'a pas acheté L3 en ${year}` },
        { status: 400 }
      )
    }
    
    // Vérifier que le fonds existe et a assez d'argent
    const fund = await prisma.l4Fund.findUnique({
      where: { year },
    })
    
    if (!fund) {
      return NextResponse.json(
        { error: `Aucun fonds L4 pour l'année ${year}` },
        { status: 404 }
      )
    }
    
    if (fund.totalAmount < amount) {
      return NextResponse.json(
        { error: `Fonds insuffisant. Disponible: ${fund.totalAmount} FCFA` },
        { status: 400 }
      )
    }
    
    // Transaction : enregistrer le gagnant + déduire du fonds
    await prisma.$transaction(async (tx: any) => {  // ✅ CORRECTION ICI
      // Enregistrer la commission gagnante
      await tx.commission.create({
        data: {
          beneficiaireId: studentId,
          fromStudentId: studentId,
          fromPurchaseId: student.purchases[0].id,
          montant: amount,
          fromLevel: 'L4',
          beneficiaireLevel: 'L4',
          year,
          type: 'L4_winner',
          statut: 'non_paye',
        },
      })
      
      // Déduire du fonds L4
      await tx.l4Fund.update({
        where: { year },
        data: {
          totalAmount: { decrement: amount },
        },
      })
    })
    
    return NextResponse.json({
      success: true,
      winner: {
        name: student.name,
        amount,
        year,
      },
      remainingFund: fund.totalAmount - amount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation échouée', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erreur distribution L4:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Voir tous les gagnants L4
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    
    const where: any = { type: 'L4_winner' }
    if (year) where.year = parseInt(year)
    
    const winners = await prisma.commission.findMany({
      where,
      include: {
        beneficiaire: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json({
      winners: winners.map(w => ({
        year: w.year,
        name: w.beneficiaire?.name,
        amount: w.montant,
        date: w.createdAt,
        statut: w.statut,
      })),
      totalDistributed: winners.reduce((sum, w) => sum + w.montant, 0),
    })
  } catch (error) {
    console.error('Erreur récupération gagnants L4:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}