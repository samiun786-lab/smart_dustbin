const router = require('express').Router();
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');
const auth = require('../middleware/auth'); // Secure endpoint for device

// Endpoint for the GPS device in the vehicle to post its location
router.post('/update-location', auth, async (req, res) => {
    const { vehicleId, latitude, longitude } = req.body;

    if (!vehicleId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const vehicle = await Vehicle.findOneAndUpdate(
            { vehicleId },
            {
                'currentLocation.coordinates': [longitude, latitude],
                lastUpdated: Date.now()
            },
            { new: true, upsert: true } // Creates the vehicle doc if it doesn't exist
        );

        // --- Conceptual Notification Logic ---
        // In a real system, you would add a function here to:
        // 1. Find the vehicle's next stop.
        // 2. Calculate ETA to that stop.
        // 3. If ETA is ~30 mins, query for users in that area.
        // 4. Send a push notification via Firebase Cloud Messaging (FCM).
        // await triggerNotificationCheck(vehicle);

        res.json({ success: true, message: 'Location updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Endpoint for the Flutter app to get tracking info for a specific area/route
router.get('/track/:routeName', async (req, res) => {
    try {
        const route = await Route.findOne({ routeName: req.params.routeName });
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        const vehicle = await Vehicle.findOne({ routeId: route._id });
        if (!vehicle) {
            return res.status(404).json({ message: 'No vehicle currently assigned to this route' });
        }

        // --- Simplified ETA Calculation ---
        // A real-world app would use a service like Google Maps Directions API
        // to calculate a precise ETA based on traffic.
        // For this demo, we'll return a static mock value.
        let etaMinutes = 25;

        res.json({
            vehicleId: vehicle.vehicleId,
            location: vehicle.currentLocation.coordinates, // [lng, lat]
            lastUpdated: vehicle.lastUpdated,
            schedule: route.schedule,
            etaMinutes: etaMinutes
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;