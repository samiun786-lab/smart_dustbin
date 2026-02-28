import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/vehicle_model.dart';

class VehicleService {
  // IMPORTANT: Replace with your actual backend IP address.
  // Use 10.0.2.2 for Android emulator, or your machine's network IP for a physical device.
  final String _baseUrl = "http://10.0.2.2:3000/api/vehicles";

  Future<VehicleTrackingInfo> getTrackingInfo(String routeName) async {
    final response = await http.get(Uri.parse('$_baseUrl/track/$routeName'));

    if (response.statusCode == 200) {
      return VehicleTrackingInfo.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load vehicle tracking info: ${response.body}');
    }
  }
}