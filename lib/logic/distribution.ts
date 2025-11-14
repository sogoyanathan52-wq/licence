// import { prisma } from '../db'

// const COMMISSION_RATE = 0.30

// /**
//  * Trouve les étudiants éligibles pour recevoir des commissions
//  * RÈGLE : Éligible = a acheté LE MÊME NIVEAU l'année précédente (1 an seulement)
//  */
// async function findEligibleStudents(level: string, year: number) {
//   if (level === 'L1') return [] // L1 ne génère pas de commissions (pas de L0)
  
//   const previousYear = year - 1
  
//   // Trouver tous ceux qui ont acheté LE MÊME niveau l'année dernière
//   const eligiblePurchases = await prisma.purchase.findMany({
//     where: {
//       level: level, // ✅ CORRECTION : même niveau, pas niveau inférieur
//       year: previousYear,
//     },
//     include: {
//       student: true,
//     },
//     orderBy: {
//       purchaseDate: 'asc', // Ordre d'achat (le plus ancien en premier)
//     },
//   })
  
//   return eligiblePurchases.map(p => p.student)
// }

// /**
//  * Compte combien de commissions un étudiant a déjà reçu cette année
//  */
// async function getReceivedCount(studentId: number, level: string, year: number) {
//   return await prisma.commission.count({
//     where: {
//       beneficiaireId: studentId,
//       fromLevel: level,
//       year: year,
//       type: 'normal',
//     },
//   })
// }

// /**
//  * Distribue une commission selon la logique de quota et d'ordre
//  */
// export async function distributeCommission(purchase: {
//   id: number
//   studentId: number
//   level: string
//   price: number
//   year: number
// }) {
//   const commissionAmount = purchase.price * COMMISSION_RATE
  
//   // Cas spécial : L3 → Fonds L4
//   if (purchase.level === 'L3') {
//     await prisma.l4Fund.upsert({
//       where: { year: purchase.year },
//       update: {
//         totalAmount: { increment: commissionAmount },
//       },
//       create: {
//         year: purchase.year,
//         totalAmount: commissionAmount,
//       },
//     })
    
//     // Enregistrer la commission pour traçabilité
//     await prisma.commission.create({
//       data: {
//         beneficiaireId: null,
//         fromStudentId: purchase.studentId,
//         fromPurchaseId: purchase.id,
//         montant: commissionAmount,
//         fromLevel: purchase.level,
//         beneficiaireLevel: 'L4',
//         year: purchase.year,
//         type: 'L4_contest',
//         statut: 'en_attente',
//       },
//     })
    
//     return {
//       type: 'L4_fund',
//       amount: commissionAmount,
//       message: `${commissionAmount} FCFA ajouté au fonds L4 ${purchase.year}`,
//     }
//   }
  
//   // Cas normal : distribution aux éligibles
//   const eligibles = await findEligibleStudents(purchase.level, purchase.year)
  
//   if (eligibles.length === 0) {
//     return {
//       type: 'no_eligible',
//       amount: commissionAmount,
//       message: 'Aucun étudiant éligible, fonds gardé par SuperAdmin',
//     }
//   }
  
//   // Récupérer le quota pour ce niveau/année
//   const quotaRecord = await prisma.quota.findUnique({
//     where: {
//       level_year: {
//         level: purchase.level,
//         year: purchase.year,
//       },
//     },
//   })
  
//   const quota = quotaRecord?.quota || 999
  
//   // Trouver le premier éligible qui n'a pas atteint son quota
//   for (const eligible of eligibles) {
//     const receivedCount = await getReceivedCount(
//       eligible.id,
//       purchase.level,
//       purchase.year
//     )
    
//     if (receivedCount < quota) {
//       await prisma.commission.create({
//         data: {
//           beneficiaireId: eligible.id,
//           fromStudentId: purchase.studentId,
//           fromPurchaseId: purchase.id,
//           montant: commissionAmount,
//           fromLevel: purchase.level,
//           beneficiaireLevel: purchase.level, // ✅ Même niveau
//           year: purchase.year,
//           type: 'normal',
//           statut: 'non_paye',
//         },
//       })
      
//       return {
//         type: 'commission',
//         beneficiaire: eligible.name,
//         beneficiaireId: eligible.id,
//         amount: commissionAmount,
//         quotaUsed: receivedCount + 1,
//         quotaMax: quota,
//         message: `${eligible.name} reçoit ${commissionAmount} FCFA (${receivedCount + 1}/${quota})`,
//       }
//     }
//   }
  
//   return {
//     type: 'quota_full',
//     amount: commissionAmount,
//     message: 'Tous les étudiants éligibles ont atteint leur quota',
//   }
// }



import { prisma } from '../db'

const COMMISSION_RATE = 0.30

// Type pour une vente éligible
type EligiblePurchase = {
  student: {
    id: number
    name: string
    email?: string
  }
  level: string
  year: number
  purchaseDate: Date
}

// Trouve les étudiants éligibles pour recevoir des commissions
async function findEligibleStudents(level: string, year: number) {
  const previousYear = year - 1

  const purchases = await prisma.purchase.findMany({
    where: { level, year: previousYear },
    include: { student: true },
    orderBy: { purchaseDate: 'asc' },
  })

  // Transformation pour correspondre au type EligiblePurchase
  const eligiblePurchases: EligiblePurchase[] = purchases.map(p => ({
    student: p.student,
    level: p.level,
    year: p.year,
    purchaseDate: p.purchaseDate,
  }))

  return eligiblePurchases.map(p => p.student)
}

// Compte combien de commissions un étudiant a déjà reçu cette année
async function getReceivedCount(studentId: number, level: string, year: number) {
  return await prisma.commission.count({
    where: {
      beneficiaireId: studentId,
      fromLevel: level,
      year,
      type: 'normal',
    },
  })
}

// Obtenir les infos de l'étudiant qui achète
async function getStudentInfo(studentId: number) {
  return await prisma.student.findUnique({
    where: { id: studentId },
    select: { name: true },
  })
}

// Distribue une commission selon la logique de quota et d'ordre
export async function distributeCommission(purchase: {
  id: number
  studentId: number
  level: string
  price: number
  year: number
}) {
  const commissionAmount = purchase.price * COMMISSION_RATE
  const buyer = await getStudentInfo(purchase.studentId)
  const buyerName = buyer?.name || 'Étudiant'

  // Cas spécial : L3 → Fonds L4
  if (purchase.level === 'L3') {
    await prisma.l4Fund.upsert({
      where: { year: purchase.year },
      update: {
        totalAmount: { increment: commissionAmount },
      },
      create: {
        year: purchase.year,
        totalAmount: commissionAmount,
      },
    })

    await prisma.commission.create({
      data: {
        beneficiaireId: null,
        fromStudentId: purchase.studentId,
        fromPurchaseId: purchase.id,
        montant: commissionAmount,
        fromLevel: purchase.level,
        beneficiaireLevel: 'L4',
        year: purchase.year,
        type: 'L4_contest',
        statut: 'en_attente',
      },
    })

    return {
      type: 'L4_fund',
      amount: commissionAmount,
      message: `${buyerName} est maintenant éligible pour le concours L4 ${purchase.year + 1}. ${commissionAmount} FCFA ajouté au fonds L4 ${purchase.year}`,
    }
  }

  // Cas normal : distribution aux éligibles
  const eligibles = await findEligibleStudents(purchase.level, purchase.year)

  if (eligibles.length === 0) {
    return {
      type: 'no_eligible',
      amount: commissionAmount,
      message: `${buyerName} est maintenant éligible à recevoir des gains de ${purchase.level} ${purchase.year + 1}, mais aucun étudiant éligible pour recevoir ses 30% (fonds gardé par SuperAdmin)`,
    }
  }

  // Récupérer le quota pour ce niveau/année
  const quotaRecord = await prisma.quota.findUnique({
    where: {
      quota_level_year_unique: {
        level: purchase.level,
        year: purchase.year,
      },
    },
  })

  const quota = quotaRecord?.quota || 999

  // Trouver le premier éligible qui n'a pas atteint son quota
  for (const eligible of eligibles) {
    const receivedCount = await getReceivedCount(eligible.id, purchase.level, purchase.year)

    if (receivedCount < quota) {
      await prisma.commission.create({
        data: {
          beneficiaireId: eligible.id,
          fromStudentId: purchase.studentId,
          fromPurchaseId: purchase.id,
          montant: commissionAmount,
          fromLevel: purchase.level,
          beneficiaireLevel: purchase.level,
          year: purchase.year,
          type: 'normal',
          statut: 'non_paye',
        },
      })

      const nextYear = purchase.year + 1
      const previousYear = purchase.year - 1

      return {
        type: 'commission',
        beneficiaire: eligible.name,
        beneficiaireId: eligible.id,
        buyer: buyerName,
        amount: commissionAmount,
        quotaUsed: receivedCount + 1,
        quotaMax: quota,
        message: `${buyerName} est maintenant éligible à recevoir des gains de ${purchase.level} ${nextYear}, et ses 30% (${commissionAmount} FCFA) sont versés à ${eligible.name} (${purchase.level} ${previousYear}, quota ${receivedCount + 1}/${quota})`,
      }
    }
  }

  return {
    type: 'quota_full',
    amount: commissionAmount,
    message: `${buyerName} est maintenant éligible à recevoir des gains de ${purchase.level} ${purchase.year + 1}, mais tous les étudiants éligibles ont atteint leur quota (fonds gardé par SuperAdmin)`,
  }
}
