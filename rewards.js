const router = require('express').Router();
const User = require('../models/User');
const admin = require('firebase-admin'); // For sending notifications

// Initialize Firebase Admin SDK (if not already initialized)
// const serviceAccount = require("./path/to/your/serviceAccountKey.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   // Other options like databaseURL, storageBucket, etc.
// });

router.post('/calculate', async (req, res) => {
    try {
        // 1. Aggregate credits per user and area
        const users = await User.aggregate([
            {
                $group: {
                    _id: { area: '$area', userId: '$_id' },
                    totalMonthlyCredits: { $sum: '$totalCredits' },
                    name: { $first: '$name' }, // Retrieve the user's name
                    mobileNumber: { $first: '$mobileNumber' } // Retrieve the user's mobile number
                }
            },
            {
                $sort: { 'totalMonthlyCredits': -1 } // Sort by credits in descending order
            },
            {
                $group: {
                    _id: '$_id.area',
                    users: { $push: '$$ROOT' } // Push user data into an array
                }
            }
        ]);

        // 2. Generate rewards and send notifications
        let report = {};

        for (const areaData of users) {
            const area = areaData._id;
            const userList = areaData.users;
            const totalUsers = userList.length;

            const top10Percent = Math.floor(totalUsers * 0.1);
            const next20Percent = Math.floor(totalUsers * 0.2);

            report[area] = {
                extraRationSupply: userList.slice(0, top10Percent).map(user => user.name),
                groceryVoucher: userList.slice(top10Percent, top10Percent + next20Percent).map(user => user.name)
            };

            // --- Send Notifications (Firebase Cloud Messaging) ---
            // You'll need to adapt this to your FCM setup.
            for (let i = 0; i < userList.length; i++) {
                const user = userList[i];
                let reward = null;

                if (i < top10Percent) {
                    reward = "Extra Ration Supply";
                } else if (i < top10Percent + next20Percent) {
                    reward = "Grocery Voucher";
                }

                if (reward) {
                    // Send push notification using Firebase Cloud Messaging (FCM)
                    const message = {
                        notification: {
                            title: 'Congratulations!',
                            body: `You've won a ${reward} for your recycling efforts this month!`,
                        },
                        token: user.mobileNumber // Assuming mobileNumber is the FCM token
                    };

                    try {
                        const response = await admin.messaging().send(message);
                        console.log('Successfully sent message:', response);
                    } catch (error) {
                        console.log('Error sending message:', error);
                    }
                }
            }

            // Reset monthly credits, keeping lifetime credits
            await User.updateMany(
                { area: area },
                { $set: { totalCredits: 0 } } // Reset totalCredits to 0
            );
        }

        res.json({ success: true, message: 'Rewards calculated and notifications sent', report });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;