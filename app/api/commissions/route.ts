// import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/db'

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const year = searchParams.get('year')
//     const level = searchParams.get('level')
//     const studentId = searchParams.get('studentId')
    
//     const where: any = {}
    
//     if (year) where.year = parseInt(year)
//     if (level) where.beneficiaireLevel = level
//     if (studentId) where.beneficiaireId = parseInt(studentId)
    
//     const commissions = await prisma.commission.findMany({
//       where,
//       include: {
//         beneficiaire: true,
//         fromStudent: true,
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//     })
    
//     // Calculer les totaux par étudiant
//     const totalByStudent = commissions.reduce((acc, comm) => {
//       if (!comm.beneficiaire) return acc
      
//       const key = comm.beneficiaire.name
//       if (!acc[key]) {
//         acc[key] = {
//           name: comm.beneficiaire.name,
//           level: comm.beneficiaireLevel,
//           total: 0,
//           count: 0,
//         }
//       }
//       acc[key].total += comm.montant
//       acc[key].count += 1
//       return acc
//     }, {} as Record<string, any>)
    
//     return NextResponse.json({
//       commissions,
//       summary: Object.values(totalByStudent),
//       totalAmount: commissions.reduce((sum, c) => sum + c.montant, 0),
//     })
//   } catch (error) {
//     console.error('Erreur consultation commissions:', error)
//     return NextResponse.json(
//       { error: 'Erreur serveur' },
//       { status: 500 }
//     )
//   }
// }

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Typage pour les totaux par étudiant
interface CommissionSummary {
  name: string
  level: string | null
  total: number
  count: number
}

// Typage pour un élément commission avec bénéficiaire
interface CommissionWithBeneficiaire {
  montant: number
  beneficiaireLevel: string | null
  beneficiaire: {
    id: number
    name: string
  } | null
  fromStudent?: any
  [key: string]: any
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    const level = searchParams.get('level')
    const studentId = searchParams.get('studentId')

    const where: Record<string, any> = {}

    if (year) where.year = parseInt(year)
    if (level) where.beneficiaireLevel = level
    if (studentId) where.beneficiaireId = parseInt(studentId)

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        beneficiaire: true,
        fromStudent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculer les totaux par étudiant
    const totalByStudent: Record<string, CommissionSummary> = commissions.reduce(
      (acc: Record<string, CommissionSummary>, comm: CommissionWithBeneficiaire) => {
        if (!comm.beneficiaire) return acc

        const key = comm.beneficiaire.name
        if (!acc[key]) {
          acc[key] = {
            name: comm.beneficiaire.name,
            level: comm.beneficiaireLevel || null,
            total: 0,
            count: 0,
          }
        }
        acc[key].total += comm.montant
        acc[key].count += 1
        return acc
      },
      {}
    )

    const totalAmount: number = commissions.reduce((sum: number, c: CommissionWithBeneficiaire) => sum + c.montant, 0)

    return NextResponse.json({
      commissions,
      summary: Object.values(totalByStudent),
      totalAmount,
    })
  } catch (error) {
    console.error('Erreur consultation commissions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
