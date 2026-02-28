const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cardId: { type: String, required: true },
    wasteType: { type: String, required: true }, // 'plastic', 'biodegradable', etc.
    source: { type: String, default: 'Household' }, // 'Household' or 'Public Area'
    weight: { type: Number, required: true }, // in kg
    aiValidation: { type: String, required: true }, // 'valid' or 'invalid'
    creditsEarned: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);