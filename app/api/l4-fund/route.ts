// import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/db'

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const year = searchParams.get('year')
    
//     if (year) {
//       const fund = await prisma.l4Fund.findUnique({
//         where: { year: parseInt(year) },
//       })
      
//       // Récupérer aussi tous les éligibles L3 pour cette année
//       const eligibleL3 = await prisma.purchase.findMany({
//         where: {
//           level: 'L3',
//           year: parseInt(year),
//         },
//         include: {
//           student: true,
//         },
//         orderBy: {
//           purchaseDate: 'asc',
//         },
//       })
      
//       return NextResponse.json({ 
//         fund,
//         eligibleStudents: eligibleL3.map(p => ({
//           id: p.student.id,
//           name: p.student.name,
//           email: p.student.email,
//           purchaseDate: p.purchaseDate,
//         })),
//       })
//     }
    
//     // Tous les fonds L4
//     const funds = await prisma.l4Fund.findMany({
//       orderBy: { year: 'desc' },
//     })
    
//     return NextResponse.json({ funds })
//   } catch (error) {
//     console.error('Erreur récupération fonds L4:', error)
//     return NextResponse.json(
//       { error: 'Erreur serveur' },
//       { status: 500 }
//     )
//   }
// }


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Typage pour les achats L3 éligibles
type EligibleL3Purchase = {
  student: {
    id: number
    name: string
    email: string
  }
  purchaseDate: Date
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const yearParam = searchParams.get('year')
    const year = yearParam ? parseInt(yearParam) : null

    if (year) {
      // Récupérer le fonds L4 pour l'année donnée
      const fund = await prisma.l4Fund.findUnique({
        where: { year },
      })

      // Récupérer tous les achats L3 éligibles pour cette année
      const eligibleL3Raw = await prisma.purchase.findMany({
        where: {
          level: 'L3',
          year,
        },
        include: {
          student: true,
        },
        orderBy: {
          purchaseDate: 'asc',
        },
      })

      // Mapper avec typage explicite
      const eligibleL3: EligibleL3Purchase[] = eligibleL3Raw.map(p => ({
        student: {
          id: p.student.id,
          name: p.student.name,
          email: p.student.email,
        },
        purchaseDate: p.purchaseDate,
      }))

      const eligibleStudents = eligibleL3.map(p => ({
        id: p.student.id,
        name: p.student.name,
        email: p.student.email,
        purchaseDate: p.purchaseDate,
      }))

      return NextResponse.json({
        fund,
        eligibleStudents,
      })
    }

    // Si pas d'année fournie, retourner tous les fonds L4
    const funds = await prisma.l4Fund.findMany({
      orderBy: { year: 'desc' },
    })

    return NextResponse.json({ funds })
  } catch (error) {
    console.error('Erreur récupération fonds L4:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
