import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const empty = { nom: '', prenom: '', email: '', mot_de_passe: '', agence_id: '' };

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

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
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