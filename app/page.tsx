'use client'

import { useState } from 'react'

const PRICES = {
  L1: 3500,
  L2: 4500,
  L3: 5500,
}

type Level = 'L1' | 'L2' | 'L3'

export default function AchatPage() {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handlePurchase = async () => {
    if (!name || !selectedLevel) {
      alert('Veuillez remplir le nom et choisir un niveau')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          level: selectedLevel,
          year,
        }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        // Réinitialiser le formulaire
        setName('')
        setEmail('')
        setSelectedLevel(null)
      }
    } catch (error) {
      setResult({ error: 'Erreur de connexion' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📚 Achat de Livre
          </h1>
          <p className="text-gray-600">Choisissez votre niveau</p>
        </div>

        {/* Sélection du livre */}
        {!selectedLevel ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['L1', 'L2', 'L3'] as Level[]).map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all transform hover:-translate-y-2"
              >
                <div className="text-6xl mb-4">📖</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {level}
                </h2>
                <p className="text-2xl font-semibold text-indigo-600">
                  {PRICES[level]} FCFA
                </p>
              </button>
            ))}
          </div>
        ) : (
          /* Formulaire d'achat */
          <div className="bg-white rounded-xl shadow-xl p-8">
            <button
              onClick={() => setSelectedLevel(null)}
              className="text-indigo-600 hover:text-indigo-800 mb-6 flex items-center gap-2"
            >
              ← Retour
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Achat Livre {selectedLevel}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Année
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {[2025, 2026, 2027, 2028, 2029].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Prix total</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {PRICES[selectedLevel]} FCFA
                </p>
              </div>

              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Traitement...' : 'ACHETER'}
              </button>
            </div>

            {/* Résultat */}
            {result && (
              <div
                className={`mt-6 p-4 rounded-lg ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {result.success ? (
                  <div>
                    <p className="font-semibold text-green-800 mb-2">
                      ✅ Achat enregistré !
                    </p>
                    <p className="text-sm text-gray-700">
                      {result.distribution?.message}
                    </p>
                  </div>
                ) : (
                  <p className="text-red-800">{result.error}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}