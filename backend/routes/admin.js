const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const { validatePassword } = require('../utils/passwordValidator');

// ─── LOGIN ADMIN / SUPER ADMIN ────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const [rows] = await db.query(
      `SELECT * FROM users
       WHERE email = ? AND mot_de_passe = ?
       AND role IN ('admin','super_admin') AND actif = TRUE`,
      [email, mot_de_passe]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects ou accès non autorisé'
      });
    }

    const user = rows[0];
    delete user.mot_de_passe;

    res.json({
      success: true,
      data: user  // contient user.role : 'admin' ou 'super_admin'
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── MIDDLEWARE AUTH ADMIN ────────────────────────────
async function authAdmin(req, res, next) {
  try {
    const user_id = req.headers['admin_id'] || req.query['admin_id'];
    if (!user_id) {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }
    const [rows] = await db.query(
      `SELECT id, role FROM users
       WHERE id = ? AND role IN ('admin','super_admin') AND actif = TRUE`,
      [user_id]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Accès refusé' });
    }
    req.adminRole = rows[0].role; // disponible dans les routes
    next();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// Middleware super_admin uniquement
function requireSuperAdmin(req, res, next) {
  if (req.adminRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Action réservée au super administrateur'
    });
  }
  next();
}

router.use(authAdmin);

// ─── STATISTIQUES ─────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [[total]]    = await db.query('SELECT COUNT(*) as count FROM clients');
    const [[attente]]  = await db.query("SELECT COUNT(*) as count FROM clients WHERE statut='en_attente'");
    const [[approuve]] = await db.query("SELECT COUNT(*) as count FROM clients WHERE statut='approuve'");
    const [[rejete]]   = await db.query("SELECT COUNT(*) as count FROM clients WHERE statut='rejete'");
    const [[agents]]   = await db.query("SELECT COUNT(*) as count FROM users WHERE role='agent'");
    const [[agences]]  = await db.query('SELECT COUNT(*) as count FROM agences');

    const [parAgence] = await db.query(`
      SELECT a.nom, COUNT(c.id) as total,
        SUM(c.statut='approuve') as approuve,
        SUM(c.statut='en_attente') as en_attente,
        SUM(c.statut='rejete') as rejete
      FROM agences a
      LEFT JOIN clients c ON c.agence_id = a.id
      GROUP BY a.id, a.nom ORDER BY total DESC
    `);

    const [parMois] = await db.query(`
      SELECT DATE_FORMAT(cree_le, '%Y-%m') as mois, COUNT(*) as total
      FROM clients
      WHERE cree_le >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY mois ORDER BY mois ASC
    `);

    res.json({
      success: true,
      data: {
        total: total.count, en_attente: attente.count,
        approuve: approuve.count, rejete: rejete.count,
        agents: agents.count, agences: agences.count,
        par_agence: parAgence, par_mois: parMois,
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── CLIENTS ──────────────────────────────────────────
router.get('/clients/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, a.nom AS agence_nom,
              u.prenom AS agent_prenom, u.nom AS agent_nom
       FROM clients c
       JOIN agences a ON c.agence_id = a.id
       LEFT JOIN users u ON c.cree_par = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Client introuvable' });
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/clients', async (req, res) => {
  try {
    const { search, agence_id, statut, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let sql = `
      SELECT c.*, a.nom AS agence_nom,
             u.prenom AS agent_prenom, u.nom AS agent_nom
      FROM clients c
      JOIN agences a ON c.agence_id = a.id
      LEFT JOIN users u ON c.cree_par = u.id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      sql += ` AND (c.numero_client LIKE ? OR c.nom LIKE ? OR c.prenom LIKE ? OR c.telephone LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    if (agence_id) { sql += ` AND c.agence_id = ?`; params.push(agence_id); }
    if (statut)    { sql += ` AND c.statut = ?`;    params.push(statut); }
    sql += ` ORDER BY c.cree_le DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await db.query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM clients WHERE 1=1`;
    const countParams = [];
    if (search) {
      countSql += ` AND (numero_client LIKE ? OR nom LIKE ? OR prenom LIKE ?)`;
      const like = `%${search}%`;
      countParams.push(like, like, like);
    }
    if (agence_id) { countSql += ` AND agence_id = ?`; countParams.push(agence_id); }
    if (statut)    { countSql += ` AND statut = ?`;    countParams.push(statut); }
    const [[{ total }]] = await db.query(countSql, countParams);

    res.json({ success: true, data: rows, total, page: parseInt(page) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/clients/:id/statut', async (req, res) => {
  try {
    const { statut, motif } = req.body;
    if (!['approuve','rejete','en_attente'].includes(statut))
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    await db.query(
      `UPDATE clients SET statut=?, motif_rejet=? WHERE id=?`,
      [statut, motif || null, req.params.id]
    );
    res.json({ success: true, message: `Dossier ${statut}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── AGENTS (liste) ───────────────────────────────────
router.get('/agents', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.nom, u.prenom, u.email, u.role, u.actif, u.cree_le,
             a.nom AS agence_nom, a.id AS agence_id,
             COUNT(c.id) AS nb_clients
      FROM users u
      LEFT JOIN agences a ON u.agence_id = a.id
      LEFT JOIN clients c ON c.cree_par = u.id
      WHERE u.role = 'agent'
      GROUP BY u.id ORDER BY u.cree_le DESC
    `);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── AGENTS (creer) ───────────────────────────────────
router.post('/agents', async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, agence_id } = req.body;

    // Validation mot de passe
    const pwCheck = validatePassword(mot_de_passe);
    if (!pwCheck.valid) {
      return res.status(400).json({
        success: false,
        message: pwCheck.errors.join(' | ')
      });
    }

    const [exist] = await db.query(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (exist.length)
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });

    const [result] = await db.query(
      `INSERT INTO users (nom, prenom, email, mot_de_passe, role, agence_id)
       VALUES (?, ?, ?, ?, 'agent', ?)`,
      [nom, prenom, email, mot_de_passe, agence_id]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── AGENTS (modifier) ────────────────────────────────
router.put('/agents/:id', async (req, res) => {
  try {
    const { nom, prenom, email, agence_id, mot_de_passe } = req.body;

    if (mot_de_passe) {
      const pwCheck = validatePassword(mot_de_passe);
      if (!pwCheck.valid) {
        return res.status(400).json({
          success: false,
          message: pwCheck.errors.join(' | ')
        });
      }
    }

    let sql = `UPDATE users SET nom=?, prenom=?, email=?, agence_id=?`;
    const params = [nom, prenom, email, agence_id];
    if (mot_de_passe) { sql += `, mot_de_passe=?`; params.push(mot_de_passe); }
    sql += ` WHERE id=? AND role='agent'`;
    params.push(req.params.id);
    await db.query(sql, params);
    res.json({ success: true, message: 'Agent mis à jour' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── AGENTS (supprimer) ───────────────────────────────
router.delete('/agents/:id', async (req, res) => {
  try {
    const [clients] = await db.query(
      'SELECT COUNT(*) as count FROM clients WHERE cree_par=?', [req.params.id]
    );
    if (clients[0].count > 0)
      return res.status(400).json({
        success: false,
        message: `Impossible : ${clients[0].count} dossier(s) créés par cet agent`
      });
    await db.query(`DELETE FROM users WHERE id=? AND role='agent'`, [req.params.id]);
    res.json({ success: true, message: 'Agent supprimé' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── ADMINS (super_admin uniquement) ──────────────────
router.get('/admins', requireSuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, nom, prenom, email, role, actif, cree_le
      FROM users WHERE role IN ('admin','super_admin')
      ORDER BY role DESC, cree_le DESC
    `);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/admins', requireSuperAdmin, async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, role = 'admin' } = req.body;

    const pwCheck = validatePassword(mot_de_passe);
    if (!pwCheck.valid) {
      return res.status(400).json({
        success: false,
        message: pwCheck.errors.join(' | ')
      });
    }

    if (!['admin','super_admin'].includes(role))
      return res.status(400).json({ success: false, message: 'Rôle invalide' });

    const [exist] = await db.query('SELECT id FROM users WHERE email=?', [email]);
    if (exist.length)
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });

    const [result] = await db.query(
      `INSERT INTO users (nom, prenom, email, mot_de_passe, role)
       VALUES (?,?,?,?,?)`,
      [nom, prenom, email, mot_de_passe, role]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/admins/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, role, actif } = req.body;

    if (mot_de_passe) {
      const pwCheck = validatePassword(mot_de_passe);
      if (!pwCheck.valid) {
        return res.status(400).json({
          success: false,
          message: pwCheck.errors.join(' | ')
        });
      }
    }

    let sql = `UPDATE users SET nom=?, prenom=?, email=?, role=?, actif=?`;
    const params = [nom, prenom, email, role, actif];
    if (mot_de_passe) { sql += `, mot_de_passe=?`; params.push(mot_de_passe); }
    sql += ` WHERE id=? AND role IN ('admin','super_admin')`;
    params.push(req.params.id);
    await db.query(sql, params);
    res.json({ success: true, message: 'Admin mis à jour' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/admins/:id', requireSuperAdmin, async (req, res) => {
  try {
    await db.query(
      `DELETE FROM users WHERE id=? AND role IN ('admin','super_admin')`,
      [req.params.id]
    );
    res.json({ success: true, message: 'Admin supprimé' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── AGENCES ──────────────────────────────────────────
router.get('/agences', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, COUNT(DISTINCT c.id) AS nb_clients,
             COUNT(DISTINCT u.id) AS nb_agents
      FROM agences a
      LEFT JOIN clients c ON c.agence_id = a.id
      LEFT JOIN users u ON u.agence_id = a.id AND u.role='agent'
      GROUP BY a.id ORDER BY a.nom ASC
    `);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/agences', async (req, res) => {
  try {
    const { nom, code } = req.body;
    const [exist] = await db.query('SELECT id FROM agences WHERE code=?', [code]);
    if (exist.length)
      return res.status(400).json({ success: false, message: 'Code déjà utilisé' });
    const [result] = await db.query(
      'INSERT INTO agences (nom, code) VALUES (?,?)', [nom, code]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/agences/:id', async (req, res) => {
  try {
    const { nom, code } = req.body;
    await db.query('UPDATE agences SET nom=?, code=? WHERE id=?', [nom, code, req.params.id]);
    res.json({ success: true, message: 'Agence mise à jour' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/agences/:id', async (req, res) => {
  try {
    const [clients] = await db.query(
      'SELECT COUNT(*) as count FROM clients WHERE agence_id=?', [req.params.id]
    );
    if (clients[0].count > 0)
      return res.status(400).json({
        success: false,
        message: `Impossible : ${clients[0].count} client(s) associé(s)`
      });
    const [agents] = await db.query(
      `SELECT COUNT(*) as count FROM users WHERE agence_id=? AND role='agent'`,
      [req.params.id]
    );
    if (agents[0].count > 0)
      return res.status(400).json({
        success: false,
        message: `Impossible : ${agents[0].count} agent(s) associé(s)`
      });
    await db.query('DELETE FROM agences WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Agence supprimée' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── EXPORT CSV ───────────────────────────────────────
router.get('/export/csv', async (req, res) => {
  try {
    const { statut, agence_id } = req.query;
    let sql = `
      SELECT c.numero_client, c.prenom, c.nom, c.telephone,
             c.nationalite, c.date_naissance, c.adresse, c.ville,
             c.profession, c.source_revenus, c.type_document,
             c.statut, a.nom AS agence, c.cree_le
      FROM clients c JOIN agences a ON c.agence_id=a.id WHERE 1=1
    `;
    const params = [];
    if (statut)    { sql += ` AND c.statut=?`;    params.push(statut); }
    if (agence_id) { sql += ` AND c.agence_id=?`; params.push(agence_id); }
    sql += ` ORDER BY c.cree_le DESC`;
    const [rows] = await db.query(sql, params);

    const headers = ['Numero client','Prenom','Nom','Telephone','Nationalite',
      'Date naissance','Adresse','Ville','Profession','Source revenus',
      'Type document','Statut','Agence','Date creation'];

    const csv = [
      headers.join(','),
      ...rows.map(r => [
        r.numero_client, r.prenom, r.nom, r.telephone, r.nationalite,
        r.date_naissance, `"${r.adresse}"`, r.ville, r.profession,
        r.source_revenus, r.type_document, r.statut, r.agence,
        new Date(r.cree_le).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=kyc_export.csv');
    res.send('\uFEFF' + csv);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;