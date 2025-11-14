'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Level = 'ALL' | 'L1' | 'L2' | 'L3'

interface Purchase {
  id: number
  studentId: number
  level: string
  price: number
  year: number
  purchaseDate: string
  student: {
    id: number
    name: string
    email: string | null
  }
}

interface Stats {
  totalPurchases: number
  totalAmount: number
  byLevel: {
    [key: string]: {
      count: number
      amount: number
    }
  }
}

export default function AchatsPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([])
  const [selectedLevel, setSelectedLevel] = useState<Level>('ALL')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [stats, setStats] = useState<Stats>({
    totalPurchases: 0,
    totalAmount: 0,
    byLevel: {},
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPurchases()
  }, [])

  useEffect(() => {
    filterPurchases()
  }, [selectedLevel, selectedYear, purchases])

  const loadPurchases = async () => {
    setLoading(true)
    try {
      // On va créer une nouvelle route API pour récupérer tous les achats
      const res = await fetch('/api/purchases/all')
      const data = await res.json()
      setPurchases(data.purchases || [])
    } catch (error) {
      console.error('Erreur chargement achats:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPurchases = () => {
    let filtered = purchases

    // Filtrer par année
    filtered = filtered.filter((p) => p.year === selectedYear)

    // Filtrer par niveau
    if (selectedLevel !== 'ALL') {
      filtered = filtered.filter((p) => p.level === selectedLevel)
    }

    // Calculer les stats
    const statsTemp: Stats = {
      totalPurchases: filtered.length,
      totalAmount: 0,
      byLevel: {},
    }

    filtered.forEach((p) => {
      statsTemp.totalAmount += p.price

      if (!statsTemp.byLevel[p.level]) {
        statsTemp.byLevel[p.level] = { count: 0, amount: 0 }
      }
      statsTemp.byLevel[p.level].count += 1
      statsTemp.byLevel[p.level].amount += p.price
    })

    setStats(statsTemp)
    setFilteredPurchases(filtered)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              📚 Historique des Achats
            </h1>
            <p className="text-gray-600 mt-2">Tous les achats enregistrés</p>
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
            {/* Filtre niveau */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau
              </label>
              <div className="flex gap-2">
                {(['ALL', 'L1', 'L2', 'L3'] as Level[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      selectedLevel === level
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level === 'ALL' ? 'Tous' : level}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre année */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {[2025, 2026, 2027, 2028, 2029].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Bouton actualiser */}
            <div className="ml-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2 opacity-0">
                Action
              </label>
              <button
                onClick={loadPurchases}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                🔄 Actualiser
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 mt-4">Chargement...</p>
          </div>
        ) : (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Total achats */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-blue-100 text-sm font-medium">Total Achats</p>
                  <span className="text-3xl">📦</span>
                </div>
                <p className="text-4xl font-bold">{stats.totalPurchases}</p>
              </div>

              {/* Total montant */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-green-100 text-sm font-medium">Total Montant</p>
                  <span className="text-3xl">💰</span>
                </div>
                <p className="text-3xl font-bold">{stats.totalAmount}</p>
                <p className="text-green-100 text-sm">FCFA</p>
              </div>

              {/* Stats L1 */}
              {stats.byLevel['L1'] && (
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-purple-100 text-sm font-medium">L1</p>
                    <span className="text-3xl">📘</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.byLevel['L1'].count}</p>
                  <p className="text-purple-100 text-sm">
                    {stats.byLevel['L1'].amount} FCFA
                  </p>
                </div>
              )}

              {/* Stats L2 */}
              {stats.byLevel['L2'] && (
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-orange-100 text-sm font-medium">L2</p>
                    <span className="text-3xl">📗</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.byLevel['L2'].count}</p>
                  <p className="text-orange-100 text-sm">
                    {stats.byLevel['L2'].amount} FCFA
                  </p>
                </div>
              )}

              {/* Stats L3 */}
              {stats.byLevel['L3'] && (
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-pink-100 text-sm font-medium">L3</p>
                    <span className="text-3xl">📙</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.byLevel['L3'].count}</p>
                  <p className="text-pink-100 text-sm">
                    {stats.byLevel['L3'].amount} FCFA
                  </p>
                </div>
              )}
            </div>

            {/* Tableau des achats */}
            {filteredPurchases.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Étudiant
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Niveau
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Année
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Prix
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPurchases.map((purchase) => (
                        <tr
                          key={purchase.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            #{purchase.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {purchase.student.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {purchase.student.email || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                purchase.level === 'L1'
                                  ? 'bg-blue-100 text-blue-800'
                                  : purchase.level === 'L2'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {purchase.level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {purchase.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-gray-900">
                              {purchase.price}
                            </span>
                            <span className="text-gray-500 text-sm ml-1">FCFA</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(purchase.purchaseDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg">
                  Aucun achat pour {selectedLevel === 'ALL' ? 'tous les niveaux' : selectedLevel} en {selectedYear}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}