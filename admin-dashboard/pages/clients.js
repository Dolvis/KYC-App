import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import api from '../utils/api';
import Cookies from 'js-cookie';

export default function Clients() {
  const router = useRouter();
  const [clients, setClients]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');
  const [statut, setStatut]     = useState('');
  const [agences, setAgences]   = useState([]);
  const [agenceId, setAgenceId] = useState('');
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    api.get('/agences').then(r => setAgences(r.data.data));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [search, statut, agenceId, page]);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/clients', {
        params: { search, statut, agence_id: agenceId, page, limit: 20 }
      });
      setClients(r.data.data);
      setTotal(r.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get('/agences').then(r => setAgences(r.data.data));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [search, statut, agenceId, page]);

  async function exportCSV() {
  try {
    const admin = JSON.parse(
      Cookies.get('admin_user') || '{}'
    );

    const params = new URLSearchParams();

    if (statut) {
      params.append('statut', statut);
    }

    if (agenceId) {
      params.append('agence_id', agenceId);
    }

    params.append('admin_id', admin.id || '');

    window.open(
      `http://localhost:5000/api/admin/export/csv?${params.toString()}`
    );

  } catch (err) {
    console.error(err);
  }
}

  const statutColor = s => ({
    en_attente: { bg: '#FEF3C7', text: '#D97706' },
    approuve:   { bg: '#D1FAE5', text: '#059669' },
    rejete:     { bg: '#FEE2E2', text: '#DC2626' },
  }[s] || { bg: '#F3F4F6', text: '#6B7280' });

  const statutLabel = s => ({
    en_attente: 'En attente',
    approuve:   'Approuvé',
    rejete:     'Rejeté',
  }[s] || s);

  const inputStyle = {
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
  };

  return (
    <Layout title="Dossiers KYC">

      {/* Filtres */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher par nom, prénom, ID..."
          style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
        />
        <select
          value={statut}
          onChange={e => { setStatut(e.target.value); setPage(1); }}
          style={{ ...inputStyle, minWidth: '160px' }}
        >
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="approuve">Approuvé</option>
          <option value="rejete">Rejeté</option>
        </select>
        <select
          value={agenceId}
          onChange={e => { setAgenceId(e.target.value); setPage(1); }}
          style={{ ...inputStyle, minWidth: '180px' }}
        >
          <option value="">Toutes les agences</option>
          {agences.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
        </select>
        <button
          onClick={exportCSV}
          style={{ backgroundColor: '#F59E0B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          ⬇ Exporter CSV
        </button>
      </div>

      <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>{total} dossier(s) trouvé(s)</p>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto', overflowY: 'hidden', width: '100%' }}>
        <table style={{ minWidth: '1000px', width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
              {['N° Client','Nom complet','Téléphone','Agence','Agent','Date','Statut','Action'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Chargement...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Aucun dossier trouvé</td></tr>
            ) : clients.map(c => {
              const sc = statutColor(c.statut);
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #F9FAFB' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFFBEB'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', color: '#6B7280', fontFamily: 'monospace', fontSize: '12px' }}>{c.numero_client}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#111827' }}>{c.prenom} {c.nom}</td>
                  <td style={{ padding: '12px 16px', color: '#374151' }}>{c.telephone}</td>
                  <td style={{ padding: '12px 16px', color: '#F59E0B', fontSize: '12px' }}>{c.agence_nom}</td>
                  <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '12px' }}>{c.agent_prenom} {c.agent_nom}</td>
                  <td style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: '12px' }}>{new Date(c.cree_le).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: sc.bg, color: sc.text, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>
                      {statutLabel(c.statut)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => router.push(`/clients/${c.id}`)}
                      style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Voir détail →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{ padding: '8px 16px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '8px', backgroundColor: '#fff', color: '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
        >← Précédent</button>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={clients.length < 20}
          style={{ padding: '8px 16px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '8px', backgroundColor: '#fff', color: '#374151', cursor: clients.length < 20 ? 'not-allowed' : 'pointer', opacity: clients.length < 20 ? 0.4 : 1 }}
        >Suivant →</button>
      </div>
    </Layout>
  );
}