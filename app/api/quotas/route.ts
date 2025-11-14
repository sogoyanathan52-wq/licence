import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const QuotaSchema = z.object({
  level: z.enum(['L1', 'L2', 'L3']),
  year: z.number().min(2025),
  quota: z.number().min(1).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = QuotaSchema.parse(body)
    
    const quota = await prisma.quota.upsert({
      where: {
        level_year: {
          level: validated.level,
          year: validated.year,
        },
      },
      update: {
        quota: validated.quota,
      },
      create: validated,
    })
    
    return NextResponse.json({ success: true, quota })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation échouée', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erreur gestion quota:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const level = searchParams.get('level')
    const year = searchParams.get('year')
    
    const where: any = {}
    if (level) where.level = level
    if (year) where.year = parseInt(year)
    
    const quotas = await prisma.quota.findMany({ where })
    
    return NextResponse.json({ quotas })
  } catch (error) {
    console.error('Erreur récupération quotas:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}