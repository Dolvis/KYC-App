import 'package:flutter/material.dart';
import 'kyc_form_screen.dart';

class ClientDetailScreen extends StatelessWidget {
  final Map<String, dynamic> client;
  final Map<String, dynamic> user;

  const ClientDetailScreen({
    super.key,
    required this.client,
    required this.user,
  });

  static const blue = Color(0xFFD4900A);

  Color _statutColor(String statut) {
    switch (statut) {
      case 'approuve': return Colors.green;
      case 'rejete':   return Colors.red;
      default:         return Colors.orange;
    }
  }

  String _statutLabel(String statut) {
    switch (statut) {
      case 'approuve': return 'Approuvé';
      case 'rejete':   return 'Rejeté';
      default:         return 'En attente';
    }
  }

  @override
  Widget build(BuildContext context) {
    final statut = client['statut'] ?? 'en_attente';
    final initiales =
        '${(client['prenom'] ?? ' ')[0]}${(client['nom'] ?? ' ')[0]}'
            .toUpperCase();

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        backgroundColor: blue,
        foregroundColor: Colors.black87,
        title: Text('${client['prenom']} ${client['nom']}'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => KycFormScreen(
                  user: user,
                  clientExistant: client,
                ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          // Header card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(
                vertical: 24, horizontal: 16),
            decoration: BoxDecoration(
              color: blue,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(children: [
              CircleAvatar(
                radius: 34,
                backgroundColor: Colors.white24,
                child: Text(
                  initiales,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                '${client['prenom']} ${client['nom']}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                client['numero_client'] ?? '',
                style: const TextStyle(
                    color: Colors.white70, fontSize: 13),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 5),
                decoration: BoxDecoration(
                  color: _statutColor(statut).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _statutColor(statut).withValues(alpha: 0.4),
                  ),
                ),
                child: Text(
                  _statutLabel(statut),
                  style: TextStyle(
                    color: _statutColor(statut),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 16),

          // Section Identité
          _Section(
            title: 'IDENTITÉ',
            rows: [
              _Row('Prénom',      client['prenom']),
              _Row('Nom',         client['nom']),
              _Row('Nationalité', client['nationalite']),
              _Row('Téléphone',   client['telephone']),
              _Row('Date de naissance', () {
                  final raw = client['date_naissance']?.toString();
                  if (raw == null || raw.isEmpty) return '—';
                  final parts = raw.substring(0, 10).split('-');
                  if (parts.length != 3) return raw;
                  return '${parts[2]}/${parts[1]}/${parts[0]}';
                  }()),
            ],
          ),
          const SizedBox(height: 12),

          // Section Adresse & Activité
          _Section(
            title: 'ADRESSE & ACTIVITÉ',
            rows: [
              _Row('Adresse',         client['adresse']),
              _Row('Ville',           client['ville']),
              _Row('Profession',      client['profession']),
              _Row('Statut emploi',   client['statut_emploi']),
              _Row('Source revenus',  client['source_revenus']),
              _Row('Tranche revenus', client['tranche_revenus']),
            ],
          ),
          const SizedBox(height: 12),

          // Section Document & Agence
          _Section(
            title: 'DOCUMENT & AGENCE',
            rows: [
              _Row('Type document',   client['type_document']),
              _Row('N° document',     client['numero_document']),
              _Row('Agence',          client['agence_nom']),
              _Row('Créé le',
                  client['cree_le']?.toString().substring(0, 10)),
            ],
          ),
          const SizedBox(height: 24),

          // Bouton modifier
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => KycFormScreen(
                    user: user,
                    clientExistant: client,
                  ),
                ),
              ),
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Modifier le dossier',
                  style: TextStyle(fontSize: 15)),
              style: ElevatedButton.styleFrom(
                backgroundColor: blue,
                foregroundColor: Colors.black87,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ]),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<Widget> rows;
  const _Section({required this.title, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
          children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: Color(0xFFD4900A),
              letterSpacing: 0.6,
            ),
          ),
        ),
        const Divider(height: 1),
        ...rows,
      ]),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String? value;
  const _Row(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: 16, vertical: 11),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 14,
              ),
            ),
            Text(
              value ?? '—',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
      const Divider(height: 1),
    ]);
  }
}