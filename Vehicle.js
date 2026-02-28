const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
    vehicleId: { type: String, required: true, unique: true }, // e.g., license plate
    driverName: { type: String },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    lastUpdated: { type: Date, default: Date.now }
});

VehicleSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Vehicle', VehicleSchema);