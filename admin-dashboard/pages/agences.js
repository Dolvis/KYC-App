import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const empty = { nom: '', code: '' };

export default function Agences() {
  const [agences, setAgences] = useState([]);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await api.get('/agences');
    setAgences(r.data.data);
  }

  function openCreate() { setForm(empty); setEditing(null); setError(''); setModal(true); }
  function openEdit(a)  { setForm({ nom: a.nom, code: a.code }); setEditing(a.id); setError(''); setModal(true); }

  async function save() {
    setError('');
    try {
      if (editing) {
        await api.put(`/agences/${editing}`, form);
      } else {
        await api.post('/agences', form);
      }
      setModal(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  }

  async function del(id) {
    if (!confirm('Supprimer cette agence ?')) return;
    try {
      await api.delete(`/agences/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Impossible de supprimer');
    }
  }

  return (
    <Layout title="Gestion des agences">
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
        >+ Nouvelle agence</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agences.map(a => (
          <div key={a.id} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-800">{a.nom}</p>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-mono mt-1 inline-block">
                  {a.code}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(a)}
                  className="text-amber-600 hover:underline text-xs">Modifier</button>
                <button onClick={() => del(a.id)}
                  className="text-red-500 hover:underline text-xs">Supprimer</button>
              </div>
            </div>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>👤 {a.nb_agents} agent{a.nb_agents > 1 ? 's' : ''}</span>
              <span>📋 {a.nb_clients} client{a.nb_clients > 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-40  text-gray-800 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-gray-800 mb-4">
              {editing ? 'Modifier agence' : 'Nouvelle agence'}
            </h2>
            <div className="space-y-3">
              <input placeholder="Nom de l'agence" value={form.nom}
                onChange={e => setForm({...form, nom: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              <input placeholder="Code (ex: DLA-CTR)" value={form.code}
                onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"/>
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