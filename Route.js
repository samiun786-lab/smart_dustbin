const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    routeName: { type: String, required: true, unique: true }, // e.g., "Sector 15"
    schedule: { type: String, required: true }, // e.g., "Mon, Wed, Fri at 9:00 AM"
    // A simplified representation of stops for ETA calculation
    stops: [{
        name: String,
        location: {
            type: { type: String, enum: ['Point'], required: true },
            coordinates: { type: [Number], required: true } // [longitude, latitude]
        }
    }]
});

module.exports = mongoose.model('Route', RouteSchema);