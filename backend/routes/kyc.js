const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const db       = require('../db');
const { validatePassword } = require('../utils/passwordValidator');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

function genNumero() {
  return 'KYC-' + Date.now().toString().slice(-8);
}

// ─── LOGIN AGENT (mobile) ─────────────────────────────
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
      `SELECT u.*, a.nom AS agence_nom
       FROM users u
       LEFT JOIN agences a ON u.agence_id = a.id
       WHERE u.email = ? AND u.mot_de_passe = ? AND u.role = 'agent' AND u.actif = TRUE`,
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

    res.json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── AGENCES ──────────────────────────────────────────
router.get('/agences', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM agences ORDER BY nom');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── CLIENTS : liste + recherche ──────────────────────
router.get('/clients', async (req, res) => {
  try {
    const { search, agence_id } = req.query;
    let sql = `SELECT c.*, a.nom AS agence_nom
               FROM clients c
               JOIN agences a ON c.agence_id = a.id
               WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ` AND (c.numero_client LIKE ? OR c.nom LIKE ? OR c.prenom LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (agence_id) { sql += ` AND c.agence_id = ?`; params.push(agence_id); }
    sql += ` ORDER BY c.cree_le DESC`;
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── CLIENT : detail ──────────────────────────────────
router.get('/clients/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, a.nom AS agence_nom
       FROM clients c
       JOIN agences a ON c.agence_id = a.id
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

// ─── CLIENT : creer ───────────────────────────────────
router.post('/clients',
  upload.fields([
    { name: 'document_recto', maxCount: 1 },
    { name: 'document_verso', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        prenom, nom, date_naissance, nationalite, telephone,
        adresse, ville, profession, statut_emploi, source_revenus,
        tranche_revenus, type_document, numero_document, agence_id, cree_par,
      } = req.body;
      const recto = req.files?.document_recto?.[0]?.path || null;
      const verso = req.files?.document_verso?.[0]?.path || null;
      const [result] = await db.query(
        `INSERT INTO clients
          (numero_client, prenom, nom, date_naissance, nationalite,
           telephone, adresse, ville, profession, statut_emploi,
           source_revenus, tranche_revenus, type_document, numero_document,
           document_recto, document_verso, agence_id, cree_par)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          genNumero(), prenom, nom, date_naissance || null, nationalite,
          telephone, adresse, ville, profession, statut_emploi,
          source_revenus, tranche_revenus, type_document, numero_document,
          recto, verso, agence_id, cree_par || null,
        ]
      );
      res.status(201).json({ success: true, id: result.insertId });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
);

// ─── CLIENT : modifier ────────────────────────────────
router.put('/clients/:id', async (req, res) => {
  try {
    const {
      prenom, nom, date_naissance, nationalite, telephone,
      adresse, ville, profession, statut_emploi, source_revenus,
      tranche_revenus, type_document, numero_document, agence_id,
    } = req.body;
    await db.query(
      `UPDATE clients SET
        prenom=?, nom=?, date_naissance=?, nationalite=?, telephone=?,
        adresse=?, ville=?, profession=?, statut_emploi=?,
        source_revenus=?, tranche_revenus=?, type_document=?,
        numero_document=?, agence_id=?
       WHERE id=?`,
      [
        prenom, nom, date_naissance || null, nationalite, telephone,
        adresse, ville, profession, statut_emploi, source_revenus,
        tranche_revenus, type_document, numero_document, agence_id,
        req.params.id,
      ]
    );
    res.json({ success: true, message: 'Client mis à jour' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;