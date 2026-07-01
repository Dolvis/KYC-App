import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';



class KycFormScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  final Map<String, dynamic>? clientExistant;
  const KycFormScreen({super.key, required this.user, this.clientExistant});

  @override
  State<KycFormScreen> createState() => _KycFormScreenState();
}

class _KycFormScreenState extends State<KycFormScreen> {
  static const blue = Color(0xFFD4900A);
  final _pageCtrl = PageController();
  int _page = 0;
  bool _loading = false;

  // Étape 1
  final _prenomCtrl = TextEditingController();
  final _nomCtrl    = TextEditingController();
  DateTime? _ddn;
  String _nationalite = 'Camerounaise';
  final _telCtrl = TextEditingController();

  // Étape 2
  final _adresseCtrl = TextEditingController();
  final _villeCtrl   = TextEditingController();
  String _profession    = 'Salarié(e)';
  String _statutEmploi  = 'Temps plein';
  String _revenus       = 'Salaire / Traitement';
  String _trancheRev    = '< 500 000 FCFA';
  int? _agenceId;
  List<dynamic> _agences = [];

  // Étape 3
  String _docType = 'CNI';
  final _numDocCtrl = TextEditingController();
  File? _rectoFile, _versoFile;

  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadAgences();
    if (widget.clientExistant != null) _prefill();
  }

  Future<void> _loadAgences() async {
    final data = await ApiService.getAgences();
    setState(() {
      _agences = data;
      _agenceId ??= data.isNotEmpty ? data.first['id'] as int : null;
    });
  }

  void _prefill() {
    final c = widget.clientExistant!;
    _prenomCtrl.text  = c['prenom']  ?? '';
    _nomCtrl.text     = c['nom']     ?? '';
    _telCtrl.text     = c['telephone'] ?? '';
    _adresseCtrl.text = c['adresse'] ?? '';
    _villeCtrl.text   = c['ville']   ?? '';
    _numDocCtrl.text  = c['numero_document'] ?? '';
    _nationalite      = c['nationalite']    ?? 'Camerounaise';
    _profession       = c['profession']     ?? 'Salarié(e)';
    _revenus          = c['source_revenus'] ?? 'Salaire / Traitement';
    _docType          = c['type_document']  ?? 'CNI';
    _agenceId         = c['agence_id'];
  }

  void _nextPage() {
    if (_page < 3) {
      _pageCtrl.nextPage(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut);
      setState(() => _page++);
    }
  }

  void _prevPage() {
    if (_page > 0) {
      _pageCtrl.previousPage(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut);
      setState(() => _page--);
    }
  }

  Future<void> _pickImage(bool isRecto) async {
    final src = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: const Icon(Icons.camera_alt),
            title: const Text('Prendre une photo'),
            onTap: () => Navigator.pop(context, ImageSource.camera),
          ),
          ListTile(
            leading: const Icon(Icons.photo_library),
            title: const Text('Depuis la galerie'),
            onTap: () => Navigator.pop(context, ImageSource.gallery),
          ),
        ]),
      ),
    );
    if (src == null) return;
    final picked =
        await _picker.pickImage(source: src, imageQuality: 85);
    if (picked == null) return;
    setState(() {
      if (isRecto) {_rectoFile = File(picked.path);}
      else         {_versoFile = File(picked.path);}
    });
  }

  Future<void> _soumettre() async {
    setState(() => _loading = true);
    final fields = {
      'prenom':          _prenomCtrl.text.trim(),
      'nom':             _nomCtrl.text.trim(),
      'telephone':       _telCtrl.text.trim(),
      'nationalite':     _nationalite,
      'date_naissance':  _ddn != null
          ? '${_ddn!.year}-${_ddn!.month.toString().padLeft(2,'0')}-${_ddn!.day.toString().padLeft(2,'0')}'
          : '',
      'adresse':         _adresseCtrl.text.trim(),
      'ville':           _villeCtrl.text.trim(),
      'profession':      _profession,
      'statut_emploi':   _statutEmploi,
      'source_revenus':  _revenus,
      'tranche_revenus': _trancheRev,
      'type_document':   _docType,
      'numero_document': _numDocCtrl.text.trim(),
      'agence_id':       '${_agenceId ?? ''}',
      'cree_par':        '${widget.user['id']}',
    };

    bool ok;
    if (widget.clientExistant != null) {
      ok = await ApiService.modifierClient(
          widget.clientExistant!['id'], fields);
    } else {
      ok = await ApiService.creerClient(
          fields: fields, recto: _rectoFile, verso: _versoFile);
    }

    setState(() => _loading = false);
    if (!mounted) return;
    if (ok) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          icon: const Icon(Icons.check_circle,
              color: Colors.green, size: 52),
          title: const Text('Dossier soumis !'),
          content: const Text('Le dossier KYC a été enregistré.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Erreur. Réessayez.'),
          backgroundColor: Colors.red));
    }
  }

  // ─── Stepper header ──────────────────────────────
  Widget _stepper() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Column(children: [
        Row(children: List.generate(4, (i) {
          final done   = i < _page;
          final active = i == _page;
          return Expanded(
            child: Row(children: [
              // Circle
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: (done || active) ? blue : Colors.grey.shade200,
                  border: Border.all(
                    color: (done || active)
                        ? blue
                        : Colors.grey.shade400,
                    width: 1.5,
                  ),
                ),
                child: Center(
                  child: done
                      ? const Icon(Icons.check,
                          color: Colors.white, size: 16)
                      : Text('${i + 1}',
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: active
                                  ? Colors.white
                                  : Colors.grey.shade500)),
                ),
              ),
              // Line
              if (i < 3)
                Expanded(
                  child: Container(
                    height: 2,
                    color: i < _page
                        ? blue
                        : Colors.grey.shade300,
                  ),
                ),
            ]),
          );
        })),
        const SizedBox(height: 6),
        Text('Étape ${_page + 1} sur 4',
            style: TextStyle(
                fontSize: 12, color: Colors.grey.shade500)),
      ]),
    );
  }

  // ─── Section header ───────────────────────────────
  Widget _sectionHeader(IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 48, height: 48,
          decoration: BoxDecoration(
              color: blue, borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: Colors.white, size: 26),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start,
              children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 3),
            Text(subtitle,
                style: TextStyle(
                    color: Colors.grey.shade500, fontSize: 13)),
          ]),
        ),
      ]),
    );
  }

  // ─── Field helpers ────────────────────────────────
  Widget _field(String label, Widget child) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label,
          style: const TextStyle(
              fontSize: 14, fontWeight: FontWeight.w500)),
      const SizedBox(height: 6),
      child,
    ]),
  );

  Widget _input(TextEditingController ctrl, String hint, IconData icon,
      {TextInputType type = TextInputType.text}) =>
      TextField(
        controller: ctrl,
        keyboardType: type,
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: Icon(icon, size: 20),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        ),
      );

  Widget _drop(String hint, String value, List<String> items,
      void Function(String?) onChanged, IconData icon) =>
      DropdownButtonFormField<String>(
        initialValue: value,
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: Icon(icon, size: 20),
          border:
              OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        ),
        items: items
            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
            .toList(),
        onChanged: onChanged,
      );

  Widget _uploadBox(String label, bool isRecto) {
    final file = isRecto ? _rectoFile : _versoFile;
    return GestureDetector(
      onTap: () => _pickImage(isRecto),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          border: Border.all(
            color: file != null ? Colors.green : Colors.grey.shade300,
            width: 1.5,
            style: BorderStyle.solid,
          ),
          borderRadius: BorderRadius.circular(10),
          color: file != null
              ? Colors.green.shade50
              : Colors.grey.shade50,
        ),
        child: file != null
            ? Column(children: [
                const Icon(Icons.check_circle,
                    color: Colors.green, size: 28),
                const SizedBox(height: 6),
                Text('$label ajouté',
                    style: const TextStyle(
                        color: Colors.green, fontSize: 13)),
              ])
            : Column(children: [
                Icon(Icons.cloud_upload_outlined,
                    color: blue, size: 32),
                const SizedBox(height: 6),
                Text('Tap to upload or take a photo',
                    style: TextStyle(color: blue, fontSize: 13)),
                const SizedBox(height: 3),
                Text('JPG, PNG • Max 5MB',
                    style: TextStyle(
                        color: Colors.grey.shade500, fontSize: 11)),
              ]),
      ),
    );
  }

  // ─── ÉTAPES ─────────────────────────────────────

  Widget _page1() => ListView(children: [
    _sectionHeader(Icons.person_outline, 'Personal Information',
        'Please provide your personal details.'),
    Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      child: Row(children: [
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('First name', style: TextStyle(
                fontSize: 14, fontWeight: FontWeight.w500)),
            const SizedBox(height: 6),
            TextField(
              controller: _prenomCtrl,
              decoration: InputDecoration(
                hintText: 'Enter first name',
                prefixIcon: const Icon(Icons.person_outline, size: 20),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        )),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Last name', style: TextStyle(
                fontSize: 14, fontWeight: FontWeight.w500)),
            const SizedBox(height: 6),
            TextField(
              controller: _nomCtrl,
              decoration: InputDecoration(
                hintText: 'Enter last name',
                prefixIcon: const Icon(Icons.person_outline, size: 20),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        )),
      ]),
    ),
    _field('Date of birth',
        GestureDetector(
          onTap: () async {
            final d = await showDatePicker(
              context: context,
              initialDate: DateTime(1990),
              firstDate: DateTime(1940),
              lastDate: DateTime.now()
                  .subtract(const Duration(days: 365 * 18)),
            );
            if (d != null) setState(() => _ddn = d);
          },
          child: Container(
            height: 52,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade400),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(children: [
              Icon(Icons.calendar_today_outlined,
                  size: 20, color: Colors.grey.shade600),
              const SizedBox(width: 10),
              Text(
                _ddn == null
                    ? 'Select date'
                    : '${_ddn!.day.toString().padLeft(2,'0')}/${_ddn!.month.toString().padLeft(2,'0')}/${_ddn!.year}',
                style: TextStyle(
                  fontSize: 15,
                  color: _ddn == null
                      ? Colors.grey.shade400
                      : Colors.black87,
                ),
              ),
              const Spacer(),
              Icon(Icons.chevron_right,
                  color: Colors.grey.shade400),
            ]),
          ),
        )),
    _field('Nationality',
        _drop('Select nationality', _nationalite,
            ['Camerounaise', 'Française', 'Nigériane', 'Sénégalaise', 'Autre'],
            (v) => setState(() => _nationalite = v!),
            Icons.language_outlined)),
    _field('Phone number',
        _input(_telCtrl, 'Enter phone number',
            Icons.phone_outlined,
            type: TextInputType.phone)),
  ]);

  Widget _page2() => ListView(children: [
    _sectionHeader(Icons.home_outlined, 'Address & Activity',
        'Please provide your address and activity information.'),
    _field('Address',
        _input(_adresseCtrl, 'Enter full address', Icons.location_on_outlined)),
    _field('City',
        _input(_villeCtrl, 'Enter city', Icons.location_city_outlined)),
    // Padding(
    //   padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
    //   child: Row(children: [
    //     Expanded(child: Column(
    //       crossAxisAlignment: CrossAxisAlignment.start,
    //       children: [
    //         const Text('Profession', style: TextStyle(
    //             fontSize: 14, fontWeight: FontWeight.w500)),
    //         const SizedBox(height: 6),
    //         DropdownButtonFormField<String>(
    //           initialValue: _profession,
    //           decoration: InputDecoration(
    //             hintText: 'Select profession',
    //             prefixIcon: const Icon(Icons.work_outline, size: 20),
    //             border: OutlineInputBorder(
    //                 borderRadius: BorderRadius.circular(10)),
    //           ),
    //           items: ['Salarié(e)', 'Commerçant(e)', 'Entrepreneur',
    //             'Fonctionnaire', 'Étudiant(e)', 'Autre']
    //               .map((e) =>
    //               DropdownMenuItem(value: e, child: Text(e, overflow: TextOverflow.ellipsis)))
    //               .toList(),
    //           onChanged: (v) => setState(() => _profession = v!),
    //         ),
    //       ],
    //     )),
    //     const SizedBox(width: 12),
    //     Expanded(child: Column(
    //       crossAxisAlignment: CrossAxisAlignment.start,
    //       children: [
    //         const Text('Employment status', style: TextStyle(
    //             fontSize: 14, fontWeight: FontWeight.w500)),
    //         const SizedBox(height: 6),
    //         DropdownButtonFormField<String>(
    //           initialValue: _statutEmploi,
    //           decoration: InputDecoration(
    //             hintText: 'Select status',
    //             prefixIcon: const Icon(Icons.person_outline, size: 20),
    //             border: OutlineInputBorder(
    //                 borderRadius: BorderRadius.circular(10)),
    //           ),
    //           items: ['Temps plein', 'Temps partiel', 'Indépendant', 'Sans emploi']
    //               .map((e) =>
    //               DropdownMenuItem(value: e, child: Text(e, overflow: TextOverflow.ellipsis)))
    //               .toList(),
    //           onChanged: (v) => setState(() => _statutEmploi = v!),
    //         ),
    //       ],
    //     )),
    //   ]),
    // ),
    Padding(
  padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
  child: Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Flexible(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Profession',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              initialValue: _profession,
              isExpanded: true,
              isDense: true,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.work_outline, size: 18),
                contentPadding: EdgeInsets.only(right: 8, top: 12, bottom: 12),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.all(Radius.circular(10))),
              ),
              items: ['Salarié(e)', 'Commerçant(e)', 'Entrepreneur',
                'Fonctionnaire', 'Étudiant(e)', 'Autre']
                  .map((e) => DropdownMenuItem(
                      value: e,
                      child: Text(e,
                          style: const TextStyle(fontSize: 11),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1)))
                  .toList(),
              onChanged: (v) => setState(() => _profession = v!),
            ),
          ],
        ),
      ),
      const SizedBox(width: 8),
      Flexible(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Statut d'emploi",
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              initialValue: _statutEmploi,
              isExpanded: true,
              isDense: true,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.person_outline, size: 18),
                contentPadding: EdgeInsets.only(right: 8, top: 12, bottom: 12),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.all(Radius.circular(10))),
              ),
              items: ['Temps plein', 'Temps partiel',
                'Indépendant', 'Sans emploi']
                  .map((e) => DropdownMenuItem(
                      value: e,
                      child: Text(e,
                          style: const TextStyle(fontSize: 11),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1)))
                  .toList(),
              onChanged: (v) => setState(() => _statutEmploi = v!),
            ),
          ],
        ),
      ),
    ],
  ),
),
    _field('Income source',
        _drop('Select income source', _revenus,
            ['Salaire / Traitement', 'Revenus d\'entreprise',
              'Transferts familiaux', 'Retraite', 'Autre'],
            (v) => setState(() => _revenus = v!),
            Icons.attach_money_outlined)),
    _field('Estimated annual income',
        _drop('Select income range', _trancheRev,
            ['< 500 000 FCFA', '500K – 1M FCFA',
              '1M – 3M FCFA', '3M – 5M FCFA', '> 5M FCFA'],
            (v) => setState(() => _trancheRev = v!),
            Icons.monetization_on_outlined)),
    if (_agences.isNotEmpty)
      _field('Agence',
          DropdownButtonFormField<int>(
            initialValue: _agenceId,
            decoration: InputDecoration(
              hintText: 'Sélectionner agence',
              prefixIcon: const Icon(Icons.business_outlined, size: 20),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            items: _agences
                .map((a) => DropdownMenuItem<int>(
                value: a['id'] as int,
                child: Text(a['nom'])))
                .toList(),
            onChanged: (v) => setState(() => _agenceId = v),
          )),
  ]);

  Widget _page3() => ListView(children: [
    _sectionHeader(Icons.description_outlined, 'Document Upload',
        'Please upload clear images of your documents.'),
    _field('Document type',
        _drop('Select document type', _docType,
            ['CNI', 'Passeport', 'Permis de conduire', 'Titre de séjour'],
            (v) => setState(() => _docType = v!),
            Icons.badge_outlined)),
    _field('Document number',
        _input(_numDocCtrl, 'Enter document number', Icons.numbers_outlined)),
    _field('Front side of document', _uploadBox('Recto', true)),
    _field('Back side of document (if applicable)',
        _uploadBox('Verso', false)),
  ]);

  Widget _page4() {
    String agenceNom = '';
    if (_agenceId != null) {
      final found = _agences.where((a) => a['id'] == _agenceId);
      if (found.isNotEmpty) agenceNom = found.first['nom'];
    }
    return ListView(children: [
      _sectionHeader(Icons.shield_outlined, 'Review & Confirm',
          'Please review your information before submitting.'),
      _reviewSection('PERSONAL INFORMATION', [
        _reviewRow('Full name',
            '${_prenomCtrl.text} ${_nomCtrl.text}'),
        _reviewRow('Date of birth',
            _ddn != null
                ? '${_ddn!.day} / ${_ddn!.month} / ${_ddn!.year}'
                : '—'),
        _reviewRow('Nationality', _nationalite),
        _reviewRow('Phone number', _telCtrl.text),
      ]),
      _reviewSection('ADDRESS & ACTIVITY', [
        _reviewRow('Address', _adresseCtrl.text),
        _reviewRow('City', _villeCtrl.text),
        _reviewRow('Profession', _profession),
        _reviewRow('Income source', _revenus),
        _reviewRow('Annual income', _trancheRev),
      ]),
      _reviewSection('DOCUMENT & AGENCY', [
        _reviewRow('Document type', _docType),
        _reviewRow('Document number', _numDocCtrl.text),
        _reviewRow('Agency', agenceNom),
      ]),
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Checkbox(
            value: true,
            onChanged: (_) {},
            activeColor: blue,
          ),
          const Expanded(
            child: Padding(
              padding: EdgeInsets.only(top: 11),
              child: Text(
                'I confirm that the above information is true and correct to the best of my knowledge.',
                style: TextStyle(fontSize: 13),
              ),
            ),
          ),
        ]),
      ),
    ]);
  }

  Widget _reviewSection(String title, List<Widget> rows) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(title,
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: blue,
                letterSpacing: 0.5)),
        TextButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.edit_outlined, size: 14),
          label: const Text('Edit', style: TextStyle(fontSize: 12)),
          style: TextButton.styleFrom(foregroundColor: blue),
        ),
      ]),
      Container(
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade200),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(children: rows),
      ),
    ]),
  );

  Widget _reviewRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
      Text(label,
          style: TextStyle(
              fontSize: 13, color: Colors.grey.shade500)),
      Text(value.isEmpty ? '—' : value,
          style: const TextStyle(
              fontSize: 13, fontWeight: FontWeight.w600)),
    ]),
  );

  // ─── Bottom buttons ───────────────────────────────
  Widget _bottomButtons() => Container(
    padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
    color: Colors.white,
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton(
          onPressed: _loading
              ? null
              : (_page < 3 ? _nextPage : _soumettre),
          style: ElevatedButton.styleFrom(
            backgroundColor: blue,
            foregroundColor: Colors.black87,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
          ),
          child: _loading
              ? const SizedBox(
                  width: 22, height: 22,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white))
              : Text(_page < 3 ? 'Continue' : 'Submit KYC',
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w600)),
        ),
      ),
      const SizedBox(height: 8),
      if (_page > 0)
        TextButton(
          onPressed: _prevPage,
          child: Text('Back',
              style: TextStyle(color: blue, fontSize: 14)),
        ),
    ]),
  );

  @override
  Widget build(BuildContext context) {
    final pages = [_page1(), _page2(), _page3(), _page4()];
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: blue,
        foregroundColor: Colors.black87,
        title: const Text('KYC Form'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(children: [
        _stepper(),
        Expanded(
          child: PageView(
            controller: _pageCtrl,
            physics: const NeverScrollableScrollPhysics(),
            children: pages,
          ),
        ),
        _bottomButtons(),
      ]),
    );
  }

  @override
  void dispose() {
    _prenomCtrl.dispose(); _nomCtrl.dispose(); _telCtrl.dispose();
    _adresseCtrl.dispose(); _villeCtrl.dispose(); _numDocCtrl.dispose();
    _pageCtrl.dispose();
    super.dispose();
  }
}