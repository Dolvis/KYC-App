import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiService {
  // ⚠️ Remplace par l'IP de ton PC sur le réseau local
  static const String baseUrl = 'http://192.168.100.218:5000/api';

  static Future<Map<String, dynamic>?> login(
      String email, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'mot_de_passe': password}),
      );
      final body = jsonDecode(res.body);
      return body['success'] == true ? body['data'] : null;
    } catch (_) {
      return null;
    }
  }

  static Future<List<dynamic>> getAgences() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/agences'));
      return jsonDecode(res.body)['data'] ?? [];
    } catch (_) {
      return [];
    }
  }

  static Future<List<dynamic>> getClients(
      {String? search, int? agenceId}) async {
    try {
      final params = <String, String>{};
      if (search != null && search.isNotEmpty) params['search'] = search;
      if (agenceId != null) params['agence_id'] = '$agenceId';
      final uri = Uri.parse('$baseUrl/clients')
          .replace(queryParameters: params);
      final res = await http.get(uri);
      return jsonDecode(res.body)['data'] ?? [];
    } catch (_) {
      return [];
    }
  }

  static Future<bool> creerClient({
    required Map<String, String> fields,
    File? recto,
    File? verso,
  }) async {
    try {
      final req = http.MultipartRequest(
          'POST', Uri.parse('$baseUrl/clients'));
      req.fields.addAll(fields);
      if (recto != null)
        {req.files.add(
            await http.MultipartFile.fromPath('document_recto', recto.path));}
      if (verso != null)
        {req.files.add(
            await http.MultipartFile.fromPath('document_verso', verso.path));}
      final res = await req.send();
      return res.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> modifierClient(
      int id, Map<String, String> fields) async {
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/clients/$id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(fields),
      );
      return jsonDecode(res.body)['success'] == true;
    } catch (_) {
      return false;
    }
  }
}