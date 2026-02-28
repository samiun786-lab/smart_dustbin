import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import '../models/vehicle_model.dart';
import '../services/vehicle_service.dart';

class VehicleTrackingScreen extends StatefulWidget {
  // The user's area/route name, passed from the previous screen.
  final String userArea;

  const VehicleTrackingScreen({super.key, required this.userArea});

  @override
  State<VehicleTrackingScreen> createState() => _VehicleTrackingScreenState();
}

class _VehicleTrackingScreenState extends State<VehicleTrackingScreen> {
  final VehicleService _vehicleService = VehicleService();
  GoogleMapController? _mapController;
  Timer? _timer;

  VehicleTrackingInfo? _trackingInfo;
  Marker? _vehicleMarker;
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _fetchData();
    // Poll for new data every 30 seconds to simulate live tracking
    _timer = Timer.periodic(const Duration(seconds: 30), (timer) => _fetchData());
  }

  @override
  void dispose() {
    _timer?.cancel(); // Always cancel timers to prevent memory leaks
    super.dispose();
  }

  Future<void> _fetchData() async {
    try {
      final info = await _vehicleService.getTrackingInfo(widget.userArea);
      if (!mounted) return;

      setState(() {
        _trackingInfo = info;
        _vehicleMarker = Marker(
          markerId: MarkerId(info.vehicleId),
          position: LatLng(info.latitude, info.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: InfoWindow(
            title: 'Vehicle: ${info.vehicleId}',
            snippet: 'Updated: ${DateFormat.jm().format(info.lastUpdated.toLocal())}',
          ),
        );
        if (_isLoading) { // Only animate camera on first load
          _mapController?.animateCamera(
            CameraUpdate.newLatLngZoom(LatLng(info.latitude, info.longitude), 15),
          );
        }
        _isLoading = false;
        _error = '';
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Track Vehicle (${widget.userArea})"),
      ),
      body: Column(
        children: [
          Expanded(
            flex: 3,
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error.isNotEmpty
                    ? Center(child: Padding(padding: const EdgeInsets.all(16.0), child: Text('Error: $_error')))
                    : GoogleMap(
                        initialCameraPosition: CameraPosition(
                          target: _vehicleMarker?.position ?? const LatLng(0, 0),
                          zoom: 15,
                        ),
                        markers: _vehicleMarker != null ? {_vehicleMarker!} : {},
                        onMapCreated: (controller) => _mapController = controller,
                      ),
          ),
          Expanded(
            flex: 2,
            child: _buildInfoPanel(),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoPanel() {
    if (_isLoading || _error.isNotEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16.0),
      width: double.infinity,
      child: Card(
        elevation: 4,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              const Text("Collection Details", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              _infoRow(Icons.calendar_today, "Schedule", _trackingInfo?.schedule ?? 'N/A'),
              _infoRow(Icons.timer, "Est. Arrival", "${_trackingInfo?.etaMinutes ?? 'N/A'} minutes"),
              _infoRow(Icons.local_shipping, "Vehicle ID", _trackingInfo?.vehicleId ?? 'N/A'),
              const SizedBox(height: 10),
              const Text(
                "Note: You will be notified 30 minutes before arrival.",
                style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(children: [
        Icon(icon, color: Theme.of(context).primaryColor),
        const SizedBox(width: 16),
        Text("$label: ", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 16))),
      ]),
    );
  }
}