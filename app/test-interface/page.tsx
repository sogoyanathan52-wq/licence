// Composant Client pour l'interface de test et de simulation
"use client";

import React, { useState, useCallback, useMemo } from 'react';
// CORRECTION: Utilisation du chemin relatif pour contourner l'erreur de résolution de l'alias "@/types/custom"
import { Licence } from '../../types/custom';

// =================================================================
// NOTE: IDs DE TEST INJECTÉS DIRECTEMENT DEPUIS LES REQUÊTES POSTMAN
// =================================================================
const ADMIN_ID_TEST = "bb58fe2e-ac3d-4db3-ac17-b264bf804135"; // Super Admin
const ALGO_ID_TEST = "bb58fe2e-ac3d-4db3-ac17-b264bf804135";  // Super Admin
const PARRAIN_B_ID = "9fe167ad-d073-41ac-a2fe-62a27f548044"; // Élève B (Parrain)
const ACHETEUR_C_ID = "33dfaf70-26ca-44eb-bff1-e96bdf2bef07"; // Élève C (Acheteur)
// L'élève D n'a pas encore de gain L1, ce qui le rend prioritaire pour la rotation L2 !
// =================================================================

// Constantes pour les licences pour le formulaire
const LICENCES = [Licence.L1, Licence.L2, Licence.L3];
const MONTANT_L1 = 100.00; // Montant simulé pour une L1

interface LogEntry {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

// Fonction utilitaire pour le fetch avec gestion d'erreurs
async function apiFetch(url: string, method: 'POST', body: any) {
  const response = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `Erreur (${response.status}): ${url}`);
  }

  return data;
}

export default function TestInterfacePage() {
  const [parrainId, setParrainId] = useState(PARRAIN_B_ID);
  const [acheteurId, setAcheteurId] = useState(ACHETEUR_C_ID);
  const [montantAchat, setMontantAchat] = useState(MONTANT_L1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  // SCÉNARIO DE TEST 1: ENREGISTREMENT DE L'ACHAT
  const handleEnregistrerAchat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    addLog("--- Démarrage de l'enregistrement de l'Achat L1 (C achète L1) ---", 'info');

    try {
      // 1. L'Admin École (simulé par ADMIN_ID_TEST) enregistre l'achat
      const body = {
        adminId: ADMIN_ID_TEST, // Utilisation de l'ID du Super Admin pour la démo
        acheteurId: acheteurId,
        licence: Licence.L1, // Pour générer une commission L1
        montantPaye: parseFloat(montantAchat.toString()),
        // Le parrain est ici l'Élève B
        parrainId: parrainId, 
      };

      const result = await apiFetch('/api/achat', 'POST', body);
      
      addLog(`Achat L1 enregistré avec succès. ID Achat: ${result.achat.id}`, 'success');
      addLog(`Le Pot Commun L3 a été mis à jour: ${result.potCommun.montantActuel} €`, 'info');
      addLog("L'achat est maintenant 'en attente de commission' dans la BDD.", 'info');
      
    } catch (error: any) {
      addLog(`Erreur lors de l'enregistrement: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // SCÉNARIO DE TEST 2: LANCEMENT DE L'ALGO
  const handleLancerAlgo = async () => {
    setIsLoading(true);
    addLog("--- Lancement de l'Algorithme de Calcul des Commissions (L1 & L2) ---", 'info');

    try {
      // 1. Le Super Admin (ALGO_ID_TEST) lance le calcul
      const body = {
        superAdminId: ALGO_ID_TEST,
      };

      const result = await apiFetch('/api/algo/calculer', 'POST', body);
      
      addLog("✅ Algorithme L1/L2 exécuté avec succès.", 'success');
      
      // Afficher les résultats critiques de l'algorithme
      addLog(`Achats traités: ${result.achatsTraites.length}`, 'info');
      
      const gainL1 = result.commissionsL1[0];
      if (gainL1) {
          addLog(`COMMISSION L1 (Parrainage): ${gainL1.montant} € crédité à ${gainL1.utilisateur.nom} (ID: ${gainL1.utilisateur.id})`, 'success');
      }

      const rotationL2 = result.rotationL2[0];
      if (rotationL2) {
          addLog(`COMMISSION L2 (Rotation): ${rotationL2.montant} € crédité à ${rotationL2.utilisateur.nom} (ID: ${rotationL2.utilisateur.id})`, 'success');
          addLog(`Critère L2 (Élève D) : Il était le moins gagnant en L1.`, 'info');
      }
      
    } catch (error: any) {
      addLog(`Erreur lors du lancement de l'Algo: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Interface visuelle utilisant Tailwind CSS
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <script src="https://cdn.tailwindcss.com"></script>
      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; }
      `}</style>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-indigo-700">TESTER L'ALGORITHME L1/L2</h1>
          <p className="mt-2 text-lg text-gray-500">Simulez une transaction et lancez l'algorithme de commission et de rotation.</p>
        </header>

        {/* Section 1: Données de Test */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-200">
          <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Clés d'Accès (Injectées)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><span className="font-medium">Admin / Super Admin ID:</span> <code className="break-all text-gray-700">{ADMIN_ID_TEST}</code></p>
            <p><span className="font-medium">Élève B (Parrain L1):</span> <code className="break-all text-gray-700">{PARRAIN_B_ID}</code></p>
            <p><span className="font-medium">Élève C (Acheteur):</span> <code className="break-all text-gray-700">{ACHETEUR_C_ID}</code></p>
            <p><span className="font-medium">Élève D (Futur L2):</span> <code className="break-all text-gray-700">cde0daa7-1f1b-4788-adc0-2cbc838a6293</code></p>
            <p className="md:col-span-2 text-xs text-red-500">L'élève D est censé recevoir la commission L2 car il n'a pas encore de gains L1.</p>
          </div>
        </div>

        {/* Section 2: Scénario d'Achat (L1) */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Étape 1 : Enregistrer une Vente L1</h2>
          <form onSubmit={handleEnregistrerAchat} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="acheteurId" className="block text-sm font-medium text-gray-700">ID de l'Acheteur (Élève C)</label>
                <input
                  type="text"
                  id="acheteurId"
                  value={acheteurId}
                  onChange={(e) => setAcheteurId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50 border"
                  required
                />
              </div>
              <div>
                <label htmlFor="parrainId" className="block text-sm font-medium text-gray-700">ID du Parrain (Élève B - Recevra L1)</label>
                <input
                  type="text"
                  id="parrainId"
                  value={parrainId}
                  onChange={(e) => setParrainId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50 border"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="licence" className="block text-sm font-medium text-gray-700">Licence Achetée</label>
                    <select
                        id="licence"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        defaultValue={Licence.L1}
                        disabled // On teste L1 pour la commission
                    >
                        {LICENCES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="montantAchat" className="block text-sm font-medium text-gray-700">Montant Payé (€)</label>
                    <input
                        type="number"
                        id="montantAchat"
                        value={montantAchat}
                        onChange={(e) => setMontantAchat(parseFloat(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        step="0.01"
                        required
                    />
                </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 border border-transparent rounded-lg text-white font-semibold shadow-md transition duration-300 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-[1.01]'
              }`}
            >
              {isLoading ? 'En cours...' : '1. ENREGISTRER L\'ACHAT L1 (C achète pour B)'}
            </button>
          </form>
        </div>

        {/* Section 3: Lancement de l'Algorithme */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-300">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Étape 2 : Lancer l'Algorithme de Distribution</h2>
          <button
            onClick={handleLancerAlgo}
            disabled={isLoading}
            className={`w-full py-3 px-4 border border-transparent rounded-lg text-white font-bold shadow-xl transition duration-300 ${
              isLoading
                ? 'bg-yellow-600 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 transform hover:scale-[1.01]'
            }`}
          >
            {isLoading ? 'Calcul en cours...' : '2. LANCER L\'ALGO L1/L2 (Distribuer commissions)'}
          </button>
          <p className="mt-2 text-sm text-green-700 text-center">Nécessite le rôle SUPER_ADMIN (ID ci-dessus).</p>
        </div>
        
        {/* Section 4: Logs et Résultats */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-inner max-h-96 overflow-y-auto">
          <h2 className="text-xl font-semibold text-white mb-3">Logs de Console / Résultats</h2>
          <div className="space-y-1">
            {logs.map(log => (
              <p key={log.id} className={`text-sm p-1 rounded-md ${
                log.type === 'info' ? 'text-gray-300' :
                log.type === 'success' ? 'bg-green-900 text-green-300 font-bold' :
                'bg-red-900 text-red-300 font-bold'
              }`}>
                [{new Date(log.id).toLocaleTimeString()}] {log.message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}