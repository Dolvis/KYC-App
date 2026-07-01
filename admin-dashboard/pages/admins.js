import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import Cookies from 'js-cookie';

const empty = { nom: '', prenom: '', email: '', mot_de_passe: '', role: 'admin' };

function validatePassword(pwd) {
  if (!pwd) return null;
  if (pwd.length < 8) return 'Minimum 8 caractères';
  if (!/[a-z]/.test(pwd)) return 'Au moins 1 lettre minuscule';
  if (!/[A-Z]/.test(pwd)) return 'Au moins 1 lettre majuscule';
  if (!/[0-9]/.test(pwd)) return 'Au moins 1 chiffre';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd))
    return 'Au moins 1 caractère spécial (!@#$%...)';
  return null;
}

export default function Admins() {
  const [admins, setAdmins]   = useState([]);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);
  const [showPw, setShowPw]   = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/admins');
      setAdmins(r.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
  try {
    const admin = Cookies.get('admin_user');
    if (!admin) {
      window.location.href = '/';
      return;
    }
    const parsed = JSON.parse(admin);
    if (parsed.role !== 'super_admin') {
      window.location.href = '/dashboard';
      return;
    }
    // setTimeout évite le setState synchrone dans useEffect
    setTimeout(() => load(), 0);
  } catch (e) {
    window.location.href = '/';
  }
}, []); /// eslint-disable-line react-hooks/exhaustive-deps


  function openCreate() {
    setForm(empty);
    setEditing(null);
    setError('');
    setShowPw(false);
    setModal(true);
  }

  function openEdit(a) {
    setForm({ nom: a.nom, prenom: a.prenom, email: a.email,
              mot_de_passe: '', role: a.role });
    setEditing(a.id);
    setError('');
    setShowPw(false);
    setModal(true);
  }

  async function save() {
    setError('');
    if (!editing && !form.mot_de_passe) {
      setError('Le mot de passe est obligatoire');
      return;
    }
    if (form.mot_de_passe) {
      const pwError = validatePassword(form.mot_de_passe);
      if (pwError) { setError(pwError); return; }
    }
    if (!form.nom || !form.prenom || !form.email) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    try {
      if (editing) {
        await api.put(`/admins/${editing}`, { ...form, actif: true });
      } else {
        await api.post('/admins', form);
      }
      setModal(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur serveur');
    }
  }

  async function del(id) {
    const me = JSON.parse(Cookies.get('admin_user') || '{}');
    if (me.id === id) {
      alert('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    if (!confirm('Supprimer cet administrateur ?')) return;
    try {
      await api.delete(`/admins/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur');
    }
  }

  const roleBadge = role => ({
    super_admin: { bg: '#FEF3C7', text: '#D97706', label: '⭐ Super Admin' },
    admin:       { bg: '#EEF2FF', text: '#4338CA', label: '🔑 Admin' },
  }[role] || { bg: '#F3F4F6', text: '#6B7280', label: role });

  const inputStyle = {
    width: '100%', border: '1px solid #D1D5DB', borderRadius: '8px',
    padding: '10px 12px', fontSize: '14px', color: '#111827',
    backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <Layout title="Gestion des administrateurs">
      <>
        <style>{`
          .admins-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
          }
          .admin-card {
            background: #fff;
            border-radius: 12px;
            padding: 18px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          }
          .admin-card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
          }
          .admin-avatar {
            width: 44px; height: 44px; border-radius: 50%;
            background: #F59E0B; color: #fff;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; font-weight: 700; flex-shrink: 0;
          }
          .admin-actions { display: flex; gap: 10px; }
          .btn-edit {
            color: #F59E0B; background: none; border: none;
            cursor: pointer; font-size: 13px; font-weight: 600;
          }
          .btn-edit:hover { text-decoration: underline; }
          .btn-del {
            color: #EF4444; background: none; border: none;
            cursor: pointer; font-size: 13px; font-weight: 600;
          }
          .btn-del:hover { text-decoration: underline; }
          .pw-wrapper { position: relative; }
          .pw-toggle {
            position: absolute; right: 10px; top: 50%;
            transform: translateY(-50%);
            background: none; border: none; cursor: pointer;
            color: #9CA3AF; font-size: 16px;
          }
          @media (max-width: 640px) {
            .admins-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', color: '#92400E' }}>
            ⚠️ Page réservée au <strong>Super Administrateur</strong>
          </div>
          <button
            onClick={openCreate}
            style={{ background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            + Nouvel admin
          </button>
        </div>

        {/* Grille */}
        {loading ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px' }}>Chargement...</p>
        ) : admins.length === 0 ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px' }}>Aucun administrateur trouvé</p>
        ) : (
          <div className="admins-grid">
            {admins.map(a => {
              const rb = roleBadge(a.role);
              const initiales = `${a.prenom[0]}${a.nom[0]}`.toUpperCase();
              return (
                <div key={a.id} className="admin-card">
                  <div className="admin-card-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="admin-avatar">{initiales}</div>
                      <div>
                        <p style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>
                          {a.prenom} {a.nom}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                          {a.email}
                        </p>
                      </div>
                    </div>
                    <div className="admin-actions">
                      <button className="btn-edit" onClick={() => openEdit(a)}>Modifier</button>
                      <button className="btn-del" onClick={() => del(a.id)}>Supprimer</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ backgroundColor: rb.bg, color: rb.text, fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px' }}>
                      {rb.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      {new Date(a.cree_le).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div style={{ paddingTop: '10px', borderTop: '1px solid #F9FAFB' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '600',
                      color: a.actif ? '#059669' : '#DC2626',
                      backgroundColor: a.actif ? '#D1FAE5' : '#FEE2E2',
                      padding: '2px 8px', borderRadius: '20px'
                    }}>
                      {a.actif ? '● Actif' : '● Inactif'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
                {editing ? 'Modifier administrateur' : 'Nouvel administrateur'}
              </h2>

              {/* Prénom + Nom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Prénom</label>
                  <input style={inputStyle} placeholder="Jean" value={form.prenom}
                    onChange={e => setForm({...form, prenom: e.target.value})}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Nom</label>
                  <input style={inputStyle} placeholder="Dupont" value={form.nom}
                    onChange={e => setForm({...form, nom: e.target.value})}/>
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Email</label>
                <input style={inputStyle} type="email" placeholder="admin@kyc.com" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}/>
              </div>

              {/* Mot de passe */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Mot de passe{' '}
                  {editing && <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(laisser vide pour conserver)</span>}
                </label>
                <div className="pw-wrapper">
                  <input
                    style={{ ...inputStyle, paddingRight: '40px' }}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Mot@Passe1!"
                    value={form.mot_de_passe}
                    onChange={e => setForm({...form, mot_de_passe: e.target.value})}
                  />
                  <button className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 12px', marginTop: '6px' }}>
                  <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500', marginBottom: '4px' }}>Doit contenir :</p>
                  {['Min. 8 caractères','1 majuscule (A-Z)','1 minuscule (a-z)','1 chiffre (0-9)','1 caractère spécial (!@#$%...)'].map(r => (
                    <p key={r} style={{ fontSize: '11px', color: '#9CA3AF', margin: '1px 0' }}>• {r}</p>
                  ))}
                </div>
              </div>

              {/* Rôle */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Rôle</label>
                <select style={inputStyle} value={form.role}
                  onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="admin">🔑 Admin</option>
                  <option value="super_admin">⭐ Super Admin</option>
                </select>
              </div>

              {/* Erreur */}
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '13px', color: '#DC2626' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Boutons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={save} style={{ flex: 1, background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  {editing ? 'Enregistrer' : 'Créer'}
                </button>
                <button onClick={() => setModal(false)} style={{ padding: '11px 18px', border: '1px solid #E5E7EB', borderRadius: '8px', background: '#fff', fontSize: '14px', color: '#6B7280', cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </Layout>
  );
}