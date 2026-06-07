import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'kyc_form_screen.dart';
import 'client_detail_screen.dart';

class ClientsListScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const ClientsListScreen({super.key, required this.user});

  @override
  State<ClientsListScreen> createState() => _ClientsListScreenState();
}

class _ClientsListScreenState extends State<ClientsListScreen> {
  static const blue = Color(0xFFD4900A);
  final _searchCtrl = TextEditingController();
  List<dynamic> _clients = [];
  List<dynamic> _agences = [];
  int? _agenceFiltree;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAgences();
    _loadClients();
  }

  Future<void> _loadAgences() async {
    final data = await ApiService.getAgences();
    setState(() => _agences = data);
  }

  Future<void> _loadClients() async {
    setState(() => _loading = true);
    final data = await ApiService.getClients(
      search:   _searchCtrl.text.trim(),
      agenceId: _agenceFiltree,
    );
    setState(() {
      _clients = data;
      _loading = false;
    });
  }

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
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        backgroundColor: blue,
        foregroundColor: Colors.black87,
        title: const Text('Liste des clients'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => KycFormScreen(user: widget.user),
                ),
              );
              _loadClients();
            },
          ),
        ],
      ),
      body: Column(children: [
        // Barre de recherche
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: TextField(
            controller: _searchCtrl,
            onChanged: (_) => _loadClients(),
            decoration: InputDecoration(
              hintText: 'Rechercher par ID, nom ou prénom...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchCtrl.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchCtrl.clear();
                        _loadClients();
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              filled: true,
              fillColor: Colors.grey.shade50,
            ),
          ),
        ),

        // Chips agences
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(children: [
              // Chip "Toutes"
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: const Text('Toutes'),
                  selected: _agenceFiltree == null,
                  onSelected: (_) {
                    setState(() => _agenceFiltree = null);
                    _loadClients();
                  },
                  selectedColor: const Color(0xFFDCEAFD),
                  checkmarkColor: blue,
                  labelStyle: TextStyle(
                    color: _agenceFiltree == null ? blue : Colors.grey.shade700,
                    fontWeight: _agenceFiltree == null
                        ? FontWeight.w600
                        : FontWeight.normal,
                  ),
                ),
              ),
              // Chips par agence
              ..._agences.map((a) {
                final selected = _agenceFiltree == a['id'];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(a['nom']),
                    selected: selected,
                    onSelected: (_) {
                      setState(() => _agenceFiltree =
                          selected ? null : a['id'] as int);
                      _loadClients();
                    },
                    selectedColor: const Color(0xFFDCEAFD),
                    checkmarkColor: blue,
                    labelStyle: TextStyle(
                      color: selected ? blue : Colors.grey.shade700,
                      fontWeight: selected
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
                  ),
                );
              }),
            ]),
          ),
        ),

        // Compteur
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
          child: Row(children: [
            Text(
              '${_clients.length} client${_clients.length > 1 ? 's' : ''} trouvé${_clients.length > 1 ? 's' : ''}',
              style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 13,
              ),
            ),
          ]),
        ),

        const Divider(height: 1),

        // Liste
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _clients.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search_off,
                              size: 60, color: Colors.grey.shade300),
                          const SizedBox(height: 12),
                          Text(
                            'Aucun client trouvé',
                            style: TextStyle(color: Colors.grey.shade500),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadClients,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _clients.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 10),
                        itemBuilder: (_, i) {
                          final c = _clients[i];
                          final statut = c['statut'] ?? 'en_attente';
                          final initiales =
                              '${(c['prenom'] ?? ' ')[0]}${(c['nom'] ?? ' ')[0]}'
                                  .toUpperCase();
                          return InkWell(
                            onTap: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ClientDetailScreen(
                                    client: c,
                                    user: widget.user,
                                  ),
                                ),
                              );
                              _loadClients();
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(children: [
                                // Avatar
                                CircleAvatar(
                                  radius: 24,
                                  backgroundColor: blue,
                                  child: Text(
                                    initiales,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                // Infos
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${c['prenom']} ${c['nom']}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 15,
                                        ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        c['numero_client'] ?? '',
                                        style: TextStyle(
                                          color: Colors.grey.shade500,
                                          fontSize: 12,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        c['agence_nom'] ?? '',
                                        style: TextStyle(
                                          color: blue,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                // Badge statut
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _statutColor(statut)
                                        .withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    _statutLabel(statut),
                                    style: TextStyle(
                                      color: _statutColor(statut),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ]),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ]),

      // FAB
      floatingActionButton: FloatingActionButton(
        backgroundColor: blue,
        foregroundColor: Colors.black87,
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => KycFormScreen(user: widget.user),
            ),
          );
          _loadClients();
        },
        child: const Icon(Icons.person_add),
      ),
    );
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }
}