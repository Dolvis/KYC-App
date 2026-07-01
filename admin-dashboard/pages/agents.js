import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const empty = { nom: '', prenom: '', email: '', mot_de_passe: '', agence_id: '' };

function validatePassword(pwd) {
  if (!pwd) return null;
  if (pwd.length < 8) return 'Minimum 8 caractères requis';
  if (!/[a-z]/.test(pwd)) return 'Au moins 1 lettre minuscule requise';
  if (!/[A-Z]/.test(pwd)) return 'Au moins 1 lettre majuscule requise';
  if (!/[0-9]/.test(pwd)) return 'Au moins 1 chiffre requis';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd))
    return 'Au moins 1 caractère spécial requis (!@#$%...)';
  return null;
}

export default function Agents() {
  const [agents, setAgents]   = useState([]);
  const [agences, setAgences] = useState([]);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const [a, ag] = await Promise.all([api.get('/agents'), api.get('/agences')]);
    setAgents(a.data.data);
    setAgences(ag.data.data);
  }

  function openCreate() { setForm(empty); setEditing(null); setError(''); setModal(true); }
  function openEdit(a)  { setForm({ ...a, mot_de_passe: '' }); setEditing(a.id); setError(''); setModal(true); }

  async function save() {
  setError('');

  // Mot de passe obligatoire pour un nouvel agent
  if (!editing && !form.mot_de_passe) {
    setError('Le mot de passe est obligatoire');
    return;
  }

  // Validation si mot de passe saisi
  if (form.mot_de_passe) {
    const pwError = validatePassword(form.mot_de_passe);
    if (pwError) { setError(pwError); return; }
  }

  try {
    if (editing) {
      await api.put(`/agents/${editing}`, form);
    } else {
      await api.post('/agents', form);
    }
    setModal(false);
    load();
  } catch (e) {
    setError(e.response?.data?.message || 'Erreur');
  }
}

  async function del(id) {
    if (!confirm('Supprimer cet agent ?')) return;
    try {
      await api.delete(`/agents/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur');
    }
  }

  return (
    <Layout title="Gestion des agents">
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
        >+ Nouvel agent</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm"
        style={{ overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch' }}>
        <table className="text-sm"
        style={{
      minWidth: '900px',
      width: '100%'
    }}>
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Nom complet','Email','Agence','Dossiers créés','Membre depuis','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{a.prenom} {a.nom}</td>
                <td className="px-4 py-3 text-gray-600">{a.email}</td>
                <td className="px-4 py-3 text-amber-600 text-xs">{a.agence_nom}</td>
                <td className="px-4 py-3 text-gray-500">{a.nb_clients}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(a.cree_le).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3 flex gap-3">
                  <button onClick={() => openEdit(a)} className="text-amber-600 hover:underline text-xs">Modifier</button>
                  <button onClick={() => del(a.id)}   className="text-red-500 hover:underline text-xs">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-400  text-gray-800 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-semibold text-gray-800 mb-4">
              {editing ? 'Modifier agent' : 'Nouvel agent'}
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Prénom" value={form.prenom}
                  onChange={e => setForm({...form, prenom: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                <input placeholder="Nom" value={form.nom}
                  onChange={e => setForm({...form, nom: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              </div>
              <input placeholder="Email" type="email" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              <input
                placeholder={editing ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe'}
                type="password" value={form.mot_de_passe}
                onChange={e => setForm({...form, mot_de_passe: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500">
                  <p className="font-medium mb-1">Le mot de passe doit contenir :</p>
                  <p>• Min. 8 caractères</p>
                  <p>• 1 majuscule (A-Z)</p>
                  <p>• 1 minuscule (a-z)</p>
                  <p>• 1 chiffre (0-9)</p>
                  <p>• 1 caractère spécial (!@#$%...)</p>
                </div>
              <select value={form.agence_id}
                onChange={e => setForm({...form, agence_id: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
                <option value="">Sélectionner une agence</option>
                {agences.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={save}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg text-sm font-medium transition">
                {editing ? 'Enregistrer' : 'Créer'}
              </button>
              <button onClick={() => setModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}