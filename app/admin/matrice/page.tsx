'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Level = 'L1' | 'L2' | 'L3'

interface Commission {
  id: number
  beneficiaire: { id: number; name: string }
  fromStudent: { id: number; name: string }
  montant: number
  statut: string
}

interface MatriceData {
  [beneficiaireId: number]: {
    name: string
    filleuls: Filleul[]
    total: number
  }
}

// ✅ Nouveau type pour éviter l'erreur TypeScript
type Filleul = {
  name: string
  montant: number
  statut: string
}

export default function MatricePage() {
  const [selectedLevel, setSelectedLevel] = useState<Level>('L1')
  const [year, setYear] = useState(new Date().getFullYear())
  const [matrice, setMatrice] = useState<MatriceData>({})
  const [totalGlobal, setTotalGlobal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMatrice()
  }, [selectedLevel, year])

  const loadMatrice = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/commissions?year=${year}&level=${selectedLevel}`)
      const data = await res.json()

      // Construire la matrice
      const matriceTemp: MatriceData = {}
      let total = 0

      data.commissions.forEach((comm: Commission) => {
        if (!comm.beneficiaire) return

        const benId = comm.beneficiaire.id

        if (!matriceTemp[benId]) {
          matriceTemp[benId] = {
            name: comm.beneficiaire.name,
            filleuls: [],
            total: 0,
          }
        }

        matriceTemp[benId].filleuls.push({
          name: comm.fromStudent.name,
          montant: comm.montant,
          statut: comm.statut,
        })

        matriceTemp[benId].total += comm.montant
        total += comm.montant
      })

      setMatrice(matriceTemp)
      setTotalGlobal(total)
    } catch (error) {
      console.error('Erreur chargement matrice:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              🔗 Vue Matrice
            </h1>
            <p className="text-gray-600 mt-2">
              Visualisation des flux de commissions
            </p>
          </div>
          <Link
            href="/admin"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ← Retour Admin
          </Link>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex gap-2">
              {(['L1', 'L2', 'L3'] as Level[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    selectedLevel === level
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {[2025, 2026, 2027, 2028, 2029].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={loadMatrice}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🔄 Actualiser
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 mt-4">Chargement...</p>
          </div>
        ) : Object.keys(matrice).length > 0 ? (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    📊 Matrice {selectedLevel} {year}
                  </h2>
                  <p className="text-indigo-100">
                    Éligibles {selectedLevel} {year - 1} → Nouveaux {selectedLevel} {year}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-indigo-200 text-sm">Total distribué</p>
                  <p className="text-4xl font-bold">{totalGlobal} FCFA</p>
                </div>
              </div>
            </div>

            {/* Matrice */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="space-y-8">
                {Object.entries(matrice).map(([benId, data]) => (
                  <div key={benId} className="border-l-4 border-indigo-500 pl-6">
                    {/* Bénéficiaire */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 text-indigo-800 font-bold text-lg px-4 py-2 rounded-lg">
                          👤 {data.name}
                        </div>
                        <div className="text-gray-500 text-sm">
                          ({selectedLevel} {year - 1})
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-800 font-bold px-4 py-2 rounded-lg">
                        {data.total} FCFA
                      </div>
                    </div>

                    {/* Flèches et filleuls */}
                    <div className="space-y-3 ml-8">
                      {data.filleuls.map((filleul: Filleul, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 group hover:bg-gray-50 p-3 rounded-lg transition-colors"
                        >
                          {/* Flèche */}
                          <div className="flex items-center gap-2 text-gray-400 group-hover:text-indigo-500 transition-colors">
                            <div className="w-8 h-0.5 bg-current"></div>
                            <div className="text-xl">→</div>
                          </div>

                          {/* Nom filleul */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">
                                {filleul.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({selectedLevel} {year})
                              </span>
                            </div>
                          </div>

                          {/* Montant */}
                          <div className="text-right">
                            <div className="font-semibold text-gray-800">
                              {filleul.montant} FCFA
                            </div>
                            <div
                              className={`text-xs ${
                                filleul.statut === 'paye'
                                  ? 'text-green-600'
                                  : 'text-orange-600'
                              }`}
                            >
                              {filleul.statut === 'paye' ? '✅ Payé' : '⏳ Non payé'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ligne séparatrice */}
                    <div className="border-t border-gray-200 mt-6 pt-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Sous-total {data.name}</span>
                        <span className="font-semibold">{data.total} FCFA</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total final */}
              <div className="border-t-4 border-indigo-600 mt-8 pt-6">
                <div className="flex justify-between items-center">
                  <div className="text-xl font-bold text-gray-800">
                    💰 TOTAL GLOBAL
                  </div>
                  <div className="text-3xl font-bold text-indigo-600">
                    {totalGlobal} FCFA
                  </div>
                </div>
              </div>
            </div>

            {/* Légende */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-3">📖 Légende :</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <strong>Éligibles ({year - 1})</strong> : Étudiants ayant acheté {selectedLevel} en {year - 1}
                </li>
                <li>
                  <strong>Nouveaux ({year})</strong> : Nouveaux étudiants achetant {selectedLevel} en {year}
                </li>
                <li>
                  <strong>→</strong> : Commission versée de l'étudiant vers le bénéficiaire
                </li>
                <li>
                  <strong>✅ Payé</strong> : Commission déjà versée à l'étudiant
                </li>
                <li>
                  <strong>⏳ Non payé</strong> : Commission en attente de versement
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">
              Aucune commission pour {selectedLevel} {year}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Les commissions apparaîtront ici une fois les achats enregistrés
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
