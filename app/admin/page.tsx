'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Level = 'L1' | 'L2' | 'L3' | 'L4'

interface Commission {
  id: number
  beneficiaire: { id: number; name: string; email: string | null }
  fromStudent: { name: string }
  montant: number
  statut: string
}

interface BeneficiaireGroup {
  name: string
  id: number
  level: string
  total: number
  count: number
  quota: number
  commissions: Commission[]
}

interface QuotaConfig {
  level: Level
  year: number
  quota: number
}

export default function AdminPage() {
  const [step, setStep] = useState<'config' | 'view'>('config')
  const [selectedLevel, setSelectedLevel] = useState<Level>('L1')
  const [year, setYear] = useState(new Date().getFullYear())
  const [beneficiaires, setBeneficiaires] = useState<BeneficiaireGroup[]>([])
  const [l4Fund, setL4Fund] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Configuration quotas
  const [quotaL1, setQuotaL1] = useState(2)
  const [quotaL2, setQuotaL2] = useState(2)
  const [quotaL3, setQuotaL3] = useState(2)
  const [savingQuota, setSavingQuota] = useState(false)

  useEffect(() => {
    loadExistingQuotas()
  }, [year])

  const loadExistingQuotas = async () => {
    try {
      const res = await fetch(`/api/quotas?year=${year}`)
      const data = await res.json()
      
      data.quotas.forEach((q: any) => {
        if (q.level === 'L1') setQuotaL1(q.quota)
        if (q.level === 'L2') setQuotaL2(q.quota)
        if (q.level === 'L3') setQuotaL3(q.quota)
      })
    } catch (error) {
      console.error('Erreur chargement quotas:', error)
    }
  }

  const saveQuotas = async () => {
    setSavingQuota(true)
    try {
      const quotas = [
        { level: 'L1', year, quota: quotaL1 },
        { level: 'L2', year, quota: quotaL2 },
        { level: 'L3', year, quota: quotaL3 },
      ]

      for (const q of quotas) {
        await fetch('/api/quotas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(q),
        })
      }

      alert('✅ Quotas enregistrés !')
      setStep('view')
    } catch (error) {
      alert('❌ Erreur lors de l\'enregistrement')
    } finally {
      setSavingQuota(false)
    }
  }

  const loadCommissions = async () => {
    setLoading(true)
    try {
      if (selectedLevel === 'L4') {
        const res = await fetch(`/api/l4-fund?year=${year}`)
        const data = await res.json()
        setL4Fund(data)
      } else {
        const res = await fetch(`/api/commissions?year=${year}&level=${selectedLevel}`)
        const data = await res.json()

        const grouped = data.commissions.reduce((acc: any, comm: Commission) => {
          if (!comm.beneficiaire) return acc

          const key = comm.beneficiaire.id
          if (!acc[key]) {
            acc[key] = {
              name: comm.beneficiaire.name,
              id: comm.beneficiaire.id,
              level: selectedLevel,
              total: 0,
              count: 0,
              quota: 0,
              commissions: [],
            }
          }
          acc[key].total += comm.montant
          acc[key].count += 1
          acc[key].commissions.push(comm)
          return acc
        }, {})

        const quotaRes = await fetch(`/api/quotas?level=${selectedLevel}&year=${year}`)
        const quotaData = await quotaRes.json()
        const quota = quotaData.quotas[0]?.quota || 0

        const grouped_array = Object.values(grouped).map((g: any) => ({
          ...g,
          quota,
        }))

        setBeneficiaires(grouped_array)
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (step === 'view') {
      loadCommissions()
    }
  }, [selectedLevel, year, step])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex gap-4">
  <Link
    href="/admin/achats"
    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
  >
    📚 Voir les Achats
  </Link>
  <button
    onClick={() => setStep(step === 'config' ? 'view' : 'config')}
    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
  >
    {step === 'config' ? '📊 Voir Commissions' : '⚙️ Configurer'}
  </button>
  <Link
    href="/admin/matrice"
    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
  >
    Vue Matrice →
  </Link>
</div>

        {/* ÉTAPE 1 : Configuration des quotas */}
        {step === 'config' ? (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              ⚙️ Configuration des Quotas
            </h2>
            
            <p className="text-gray-600 mb-8">
              Un quota définit <strong>combien de nouveaux étudiants</strong> chaque ancien peut parrainer.
              <br />
              <span className="text-sm text-gray-500">
                Exemple : Si le quota L1 = 2, chaque étudiant L1 de l'année précédente peut recevoir des commissions de maximum 2 nouveaux L1.
              </span>
            </p>

            {/* Sélection année */}
            <div className="mb-8">
              <label className="block text-gray-700 font-semibold mb-2">
                📅 Pour quelle année configurer les quotas ?
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg"
              >
                {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-6">
              {/* Quota L1 */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      📘 Niveau L1
                    </h3>
                    <p className="text-sm text-gray-600">
                      Combien de nouveaux L1 {year} chaque ancien L1 {year - 1} peut parrainer ?
                    </p>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quotaL1}
                  onChange={(e) => setQuotaL1(Number(e.target.value))}
                  className="w-full px-6 py-4 text-3xl font-bold text-center border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-center text-gray-600 mt-2 text-sm">
                  Chaque ancien L1 peut recevoir <strong>{quotaL1}</strong> nouveaux étudiants
                </p>
              </div>

              {/* Quota L2 */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      📗 Niveau L2
                    </h3>
                    <p className="text-sm text-gray-600">
                      Combien de nouveaux L2 {year} chaque ancien L2 {year - 1} peut parrainer ?
                    </p>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quotaL2}
                  onChange={(e) => setQuotaL2(Number(e.target.value))}
                  className="w-full px-6 py-4 text-3xl font-bold text-center border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-center text-gray-600 mt-2 text-sm">
                  Chaque ancien L2 peut recevoir <strong>{quotaL2}</strong> nouveaux étudiants
                </p>
              </div>

              {/* Quota L3 */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      📙 Niveau L3
                    </h3>
                    <p className="text-sm text-gray-600">
                      Combien de nouveaux L3 {year} chaque ancien L3 {year - 1} peut parrainer ?
                    </p>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quotaL3}
                  onChange={(e) => setQuotaL3(Number(e.target.value))}
                  className="w-full px-6 py-4 text-3xl font-bold text-center border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-center text-gray-600 mt-2 text-sm">
                  Chaque ancien L3 peut recevoir <strong>{quotaL3}</strong> nouveaux étudiants
                </p>
              </div>
            </div>

            <button
              onClick={saveQuotas}
              disabled={savingQuota}
              className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              {savingQuota ? 'Enregistrement...' : '💾 Enregistrer les Quotas'}
            </button>
          </div>
        ) : (
          /* ÉTAPE 2 : Visualisation des commissions */
          <div>
            {/* Filtres */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex gap-4 flex-wrap items-center">
                <div className="flex gap-2">
                  {(['L1', 'L2', 'L3', 'L4'] as Level[]).map((level) => (
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
                  onClick={loadCommissions}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  🔄 Actualiser
                </button>
              </div>
            </div>

            {/* Contenu */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-gray-600 mt-4">Chargement...</p>
              </div>
            ) : selectedLevel === 'L4' ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  🏆 Fonds L4 - {year}
                </h2>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
                  <p className="text-gray-600 mb-2">Total accumulé</p>
                  <p className="text-5xl font-bold text-orange-600">
                    {l4Fund?.fund?.totalAmount || 0} FCFA
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  📋 Étudiants éligibles (L3 {year})
                </h3>
                {l4Fund?.eligibleStudents?.length > 0 ? (
                  <div className="space-y-2">
                    {l4Fund.eligibleStudents.map((student: any) => (
                      <div
                        key={student.id}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">{student.name}</p>
                          <p className="text-sm text-gray-600">{student.email || 'Pas d\'email'}</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(student.purchaseDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Aucun étudiant éligible pour {year}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    📘 Niveau {selectedLevel} - Année {year}
                  </h2>
                  <p className="text-gray-600">
                    {beneficiaires.length} bénéficiaire(s)
                  </p>
                </div>

                {beneficiaires.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {beneficiaires.map((benef) => (
                      <div
                        key={benef.id}
                        className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">
                              👤 {benef.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {selectedLevel} {year - 1}
                            </p>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              benef.count >= benef.quota
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {benef.count >= benef.quota ? '✅' : '⏳'} {benef.count}/{benef.quota}
                          </div>
                        </div>

                        <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-600">Total reçu</p>
                          <p className="text-3xl font-bold text-indigo-600">
                            {benef.total} FCFA
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-600 mb-2">
                            Reçu de :
                          </p>
                          {benef.commissions.map((comm) => (
                            <div
                              key={comm.id}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">└─</span>
                                <span className="font-medium text-gray-800">
                                  {comm.fromStudent.name}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-800">
                                  {comm.montant} FCFA
                                </p>
                                <p
                                  className={`text-xs ${
                                    comm.statut === 'paye'
                                      ? 'text-green-600'
                                      : 'text-orange-600'
                                  }`}
                                >
                                  {comm.statut === 'paye' ? '✅ Payé' : '⏳ Non payé'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500 text-lg">
                      Aucune commission pour {selectedLevel} {year}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}