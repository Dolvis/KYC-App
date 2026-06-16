import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function ClientDetail() {
  const router = useRouter();
  const { id }  = router.query;
  const [client, setClient]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [motif, setMotif]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/clients/${id}`).then(r => {
      setClient(r.data.data);
      setLoading(false);
    });
  }, [id]);

  async function changeStatut(statut) {
    setSaving(true);
    setMsg('');
    try {
      await api.put(`/clients/${id}/statut`, { statut, motif });
      setMsg(statut === 'approuve' ? '✅ Dossier approuvé' : '❌ Dossier rejeté');
      setClient(prev => ({ ...prev, statut }));
    } catch (e) {
      setMsg('Erreur : ' + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Layout title="Détail client"><p style={{ color: '#9CA3AF' }}>Chargement...</p></Layout>;
  if (!client) return <Layout title="Détail client"><p style={{ color: '#9CA3AF' }}>Client introuvable</p></Layout>;

  const statutColor = {
    en_attente: { bg: '#FEF3C7', text: '#D97706' },
    approuve:   { bg: '#D1FAE5', text: '#059669' },
    rejete:     { bg: '#FEE2E2', text: '#DC2626' },
  }[client.statut] || {};

  const statutLabel = {
    en_attente: 'En attente',
    approuve:   'Approuvé',
    rejete:     'Rejeté',
  }[client.statut] || client.statut;

  const imgUrl = path => path
    ? `http://localhost:5000/${path.replace(/\\/g, '/')}`
    : null;

  return (
    <Layout title={`${client.prenom} ${client.nom}`}>

      {/* Bouton retour */}
      <button
        onClick={() => router.back()}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0 }}
      >
        ← Retour à la liste
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

        {/* COLONNE GAUCHE — infos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Header client */}
          <div style={{ backgroundColor: '#F59E0B', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
              {client.prenom?.[0]}{client.nom?.[0]}
            </div>
            <div>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: 0 }}>{client.prenom} {client.nom}</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: '4px 0 0' }}>{client.numero_client}</p>
              <span style={{ display: 'inline-block', marginTop: '8px', backgroundColor: statutColor.bg, color: statutColor.text, fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>
                {statutLabel}
              </span>
            </div>
          </div>

          {/* Identité */}
          <InfoSection title="Identité" items={[
            ['Prénom',           client.prenom],
            ['Nom',              client.nom],
            ['Date de naissance', client.date_naissance?.toString().substring(0,10)],
            ['Nationalité',      client.nationalite],
            ['Téléphone',        client.telephone],
          ]}/>

          {/* Adresse & Activité */}
          <InfoSection title="Adresse & Activité" items={[
            ['Adresse',         client.adresse],
            ['Ville',           client.ville],
            ['Profession',      client.profession],
            ['Statut emploi',   client.statut_emploi],
            ['Source revenus',  client.source_revenus],
            ['Tranche revenus', client.tranche_revenus],
          ]}/>

          {/* Document & Agence */}
          <InfoSection title="Document & Agence" items={[
            ['Type document',   client.type_document],
            ['N° document',     client.numero_document],
            ['Agence',          client.agence_nom],
            ['Agent créateur',  `${client.agent_prenom || ''} ${client.agent_nom || ''}`],
            ['Créé le',         new Date(client.cree_le).toLocaleDateString('fr-FR')],
          ]}/>

          {/* Motif rejet si présent */}
          {client.motif_rejet && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px 16px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#DC2626', marginBottom: '4px' }}>MOTIF DE REJET</p>
              <p style={{ fontSize: '14px', color: '#7F1D1D', margin: 0 }}>{client.motif_rejet}</p>
            </div>
          )}
        </div>

        {/* COLONNE DROITE — photos + décision */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Photos documents */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Pièce d'identité
            </p>

            {/* Recto */}
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Recto</p>
            {imgUrl(client.document_recto) ? (
              <a href={imgUrl(client.document_recto)} target="_blank" rel="noreferrer">
                <img
                  src={imgUrl(client.document_recto)}
                  alt="Document recto"
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer', marginBottom: '12px' }}
                />
              </a>
            ) : (
              <div style={{ width: '100%', height: '120px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px', marginBottom: '12px' }}>
                Aucune photo
              </div>
            )}

            {/* Verso */}
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Verso</p>
            {imgUrl(client.document_verso) ? (
              <a href={imgUrl(client.document_verso)} target="_blank" rel="noreferrer">
                <img
                  src={imgUrl(client.document_verso)}
                  alt="Document verso"
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer' }}
                />
              </a>
            ) : (
              <div style={{ width: '100%', height: '120px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                Aucune photo
              </div>
            )}
          </div>

          {/* Décision admin */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Décision
            </p>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Motif (optionnel pour approbation, recommandé pour rejet)"
              rows={3}
              style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#374151', resize: 'none', boxSizing: 'border-box', outline: 'none', marginBottom: '10px' }}
            />

            {msg && (
              <div style={{ backgroundColor: msg.startsWith('✅') ? '#D1FAE5' : '#FEE2E2', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: msg.startsWith('✅') ? '#065F46' : '#DC2626', marginBottom: '10px' }}>
                {msg}
              </div>
            )}

            <button
              onClick={() => changeStatut('approuve')}
              disabled={saving || client.statut === 'approuve'}
              style={{ width: '100%', backgroundColor: client.statut === 'approuve' ? '#D1FAE5' : '#10B981', color: client.statut === 'approuve' ? '#065F46' : '#fff', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', fontWeight: '600', cursor: client.statut === 'approuve' ? 'default' : 'pointer', marginBottom: '8px' }}
            >
              {client.statut === 'approuve' ? '✓ Déjà approuvé' : '✓ Approuver le dossier'}
            </button>

            <button
              onClick={() => changeStatut('rejete')}
              disabled={saving || client.statut === 'rejete'}
              style={{ width: '100%', backgroundColor: client.statut === 'rejete' ? '#FEE2E2' : '#EF4444', color: client.statut === 'rejete' ? '#DC2626' : '#fff', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', fontWeight: '600', cursor: client.statut === 'rejete' ? 'default' : 'pointer', marginBottom: '8px' }}
            >
              {client.statut === 'rejete' ? '✗ Déjà rejeté' : '✗ Rejeter le dossier'}
            </button>

            {(client.statut === 'approuve' || client.statut === 'rejete') && (
              <button
                onClick={() => changeStatut('en_attente')}
                disabled={saving}
                style={{ width: '100%', backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '11px', fontSize: '14px', cursor: 'pointer' }}
              >
                ↺ Remettre en attente
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function InfoSection({ title, items }) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          {title}
        </p>
      </div>
      {items.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #F9FAFB' }}>
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{label}</span>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{value || '—'}</span>
        </div>
      ))}
    </div>
  );
}