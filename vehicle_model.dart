class VehicleTrackingInfo {
  final String vehicleId;
  final double latitude;
  final double longitude;
  final DateTime lastUpdated;
  final String schedule;
  final int etaMinutes;

  VehicleTrackingInfo({
    required this.vehicleId,
    required this.latitude,
    required this.longitude,
    required this.lastUpdated,
    required this.schedule,
    required this.etaMinutes,
  });

  factory VehicleTrackingInfo.fromJson(Map<String, dynamic> json) {
    return VehicleTrackingInfo(
      vehicleId: json['vehicleId'] ?? 'N/A',
      latitude: (json['location'] != null) ? json['location'][1] : 0.0,
      longitude: (json['location'] != null) ? json['location'][0] : 0.0,
      lastUpdated: DateTime.parse(json['lastUpdated']),
      schedule: json['schedule'] ?? 'Not available',
      etaMinutes: json['etaMinutes'] ?? -1,
    );
  }
}