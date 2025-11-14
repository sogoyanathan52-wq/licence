// import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/db'
// import { distributeCommission } from '@/lib/logic/distribution'
// import { z } from 'zod'

// const PurchaseSchema = z.object({
//   name: z.string().min(1),
//   email: z.string().email().optional(),
//   level: z.enum(['L1', 'L2', 'L3', 'L4']),
//   year: z.number().min(2025),
// })

// const PRICES = {
//   L1: 3500,
//   L2: 4500,
//   L3: 5500,
//   L4: 0,
// }

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json()
//     const validated = PurchaseSchema.parse(body)
    
//     const { name, email, level, year } = validated
//     const price = PRICES[level]
    
//     if (level === 'L4') {
//       return NextResponse.json(
//         { error: 'L4 ne peut pas acheter de livre (concours uniquement)' },
//         { status: 400 }
//       )
//     }
    
//     // Transaction : créer étudiant + achat
//     const result = await prisma.$transaction(async (tx) => {
//       // Vérifier si l'étudiant existe déjà
//       let student = email
//         ? await tx.student.findUnique({ where: { email } })
//         : await tx.student.findFirst({ where: { name } })
      
//       // Créer l'étudiant si inexistant
//       if (!student) {
//         student = await tx.student.create({
//           data: { name, email },
//         })
//       }
      
//       // ✅ CORRECTION : Vérifier si déjà acheté ce niveau cette année
//       const existingPurchase = await tx.purchase.findFirst({
//         where: {
//           studentId: student.id,
//           level,
//           year,
//         },
//       })
      
//       if (existingPurchase) {
//         return { student, purchase: existingPurchase, duplicate: true }
//       }
      
//       // Enregistrer l'achat
//       const purchase = await tx.purchase.create({
//         data: {
//           studentId: student.id,
//           level,
//           price,
//           year,
//         },
//       })
      
//       return { student, purchase, duplicate: false }
//     })
    
//     // Si doublon, retourner sans distribuer
//     if (result.duplicate) {
//       return NextResponse.json({
//         success: true,
//         duplicate: true,
//         message: `${result.student.name} a déjà acheté ${level} en ${year}`,
//         purchase: {
//           id: result.purchase.id,
//           student: result.student.name,
//           level,
//           price,
//           year,
//         },
//       })
//     }
    
//     // Distribution de la commission
//     const distribution = await distributeCommission({
//       id: result.purchase.id,
//       studentId: result.student.id,
//       level,
//       price,
//       year,
//     })
    
//     return NextResponse.json({
//       success: true,
//       purchase: {
//         id: result.purchase.id,
//         student: result.student.name,
//         level,
//         price,
//         year,
//       },
//       distribution,
//     })
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Validation échouée', details: error.errors },
//         { status: 400 }
//       )
//     }
    
//     console.error('Erreur lors de l\'achat:', error)
//     return NextResponse.json(
//       { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
//       { status: 500 }
//     )
//   }
// }












import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { distributeCommission } from '@/lib/logic/distribution'
import { z } from 'zod'

const PurchaseSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  level: z.enum(['L1', 'L2', 'L3', 'L4']),
  year: z.number().min(2025),
})

const PRICES = {
  L1: 3500,
  L2: 4500,
  L3: 5500,
  L4: 0,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = PurchaseSchema.parse(body)
    
    const { name, email, level, year } = validated
    const price = PRICES[level]
    
    if (level === 'L4') {
      return NextResponse.json(
        { error: 'L4 ne peut pas acheter de livre (concours uniquement)' },
        { status: 400 }
      )
    }
    
    // ✅ Vérifier l'étudiant AVANT la transaction
    let student = email
      ? await prisma.student.findUnique({ where: { email } })
      : await prisma.student.findFirst({ where: { name } })
    
    // Créer l'étudiant si inexistant
    if (!student) {
      student = await prisma.student.create({
        data: { name, email },
      })
    }
    
    // ✅ Vérifier doublon AVANT la transaction
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        studentId: student.id,
        level,
        year,
      },
    })
    
    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: `${student.name} a déjà acheté ${level} en ${year}`,
        purchase: {
          id: existingPurchase.id,
          student: student.name,
          level,
          price,
          year,
        },
      })
    }
    
    // ✅ Transaction simplifiée : juste créer l'achat
    const purchase = await prisma.purchase.create({
      data: {
        studentId: student.id,
        level,
        price,
        year,
      },
    })
    
    // Distribution de la commission (hors transaction)
    const distribution = await distributeCommission({
      id: purchase.id,
      studentId: student.id,
      level,
      price,
      year,
    })
    
    return NextResponse.json({
      success: true,
      purchase: {
        id: purchase.id,
        student: student.name,
        level,
        price,
        year,
      },
      distribution,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation échouée', details: error.issues },  // ✅ CORRIGÉ
        { status: 400 }
      )
    }
    
    console.error('Erreur lors de l\'achat:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}