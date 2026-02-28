const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// POST /api/dustbin/deposit
// Headers: Authorization: Bearer <token>
router.post('/deposit', auth, async (req, res) => {
    try {
        const { cardId, wasteType, weight, aiValidation, source } = req.body;

        // 1. Validate Input
        if (!cardId || !wasteType || weight === undefined || !aiValidation) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 2. Find User by Card ID
        const user = await User.findOne({ cardId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 3. Calculate Credits Logic
        // Rule: Only 'plastic' waste that is 'valid' gets credits.
        // Rate: 10 credits per 1 kg.
        let credits = 0;
        const isPlastic = wasteType.toLowerCase() === 'plastic';
        const isValid = aiValidation.toLowerCase() === 'valid';

        if (isPlastic && isValid) {
            let rate = 10;
            
            // BPL Incentive: 1.5x credits for Public Area collection
            if (user.isBPL && source === 'Public Area') {
                rate = 15;
            }
            
            credits = Math.round(weight * rate);
        }

        // 4a. Daily Cap Check (Prevent Misuse)
        const DAILY_CAP = 500; // Max credits per day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayTransactions = await Transaction.find({
            userId: user._id,
            timestamp: { $gte: startOfDay }
        });

        const todayCredits = todayTransactions.reduce((sum, t) => sum + t.creditsEarned, 0);

        if (todayCredits + credits > DAILY_CAP) {
            return res.status(400).json({ message: 'Daily credit limit reached' });
        }

        // 4. Update User Balance
        user.totalCredits += credits;
        await user.save();

        // 5. Store Transaction History
        const transaction = new Transaction({
            userId: user._id,
            cardId,
            wasteType,
            source: source || 'Household',
            weight,
            aiValidation,
            creditsEarned: credits
        });
        await transaction.save();

        // 6. Return Response
        res.json({
            success: true,
            message: 'Waste deposited successfully',
            creditsAdded: credits,
            totalBalance: user.totalCredits,
            transactionId: transaction._id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;