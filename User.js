const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    cardId: { type: String, required: true, unique: true }, // Maps to Smart Waste Card ID
    rationCardId: { type: String },
    isBPL: { type: Boolean, default: false }, // Below Poverty Line status
    area: { type: String },
    mobileNumber: { type: String },
    totalCredits: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);