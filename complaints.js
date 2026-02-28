const router = require('express').Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User'); // To fetch FCM token
const auth = require('../middleware/auth');
const multer = require('multer'); // For handling file uploads
const admin = require('firebase-admin'); // Firebase Admin SDK

// Initialize Firebase Admin SDK (if not already initialized)
// const serviceAccount = require("./path/to/your/serviceAccountKey.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: "your-storage-bucket.appspot.com" // Optional: For file uploads to Firebase Storage
// });

// Multer configuration (store files in memory for now)
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

// POST /api/complaints (auth middleware for logged-in users)
router.post('/', auth, upload.single('photo'), async (req, res) => {
    try {
        const { userId, description, latitude, longitude, status } = req.body;

        // 1. Validate input
        if (!userId || !description || !latitude || !longitude) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 2. Handle image upload (if any)
        let photoUrl = null;
        if (req.file) {
            // Upload the file to Firebase Storage or AWS S3
            const bucket = admin.storage().bucket();
            const filename = `complaints/${Date.now()}_${req.file.originalname}`;
            const file = bucket.file(filename);

            const stream = file.createWriteStream({
                metadata: { contentType: req.file.mimetype },
            });

            stream.on('error', (err) => {
                console.error(err);
                return res.status(500).json({ message: 'File upload failed' });
            });

            stream.on('finish', async () => {
                // Make the file public
                await file.makePublic();
                photoUrl = file.publicUrl();

                // 3. Create and save complaint
                const complaint = new Complaint({
                    userId,
                    description,
                    photoUrl,
                    location: { coordinates: [longitude, latitude] },
                    status // Default is 'Pending'
                });
                await complaint.save();

                res.status(201).json({ message: 'Complaint submitted', complaintId: complaint._id });
            });

            stream.end(req.file.buffer);
        } else {
             // 3. Create and save complaint
            const complaint = new Complaint({
                userId,
                description,
                location: { coordinates: [longitude, latitude] },
                status // Default is 'Pending'
            });
            await complaint.save();

            res.status(201).json({ message: 'Complaint submitted', complaintId: complaint._id });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /api/complaints/:id/resolve (Admin only - implement admin auth)
router.put('/:id/resolve', auth, async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        // --- Send Push Notification (FCM) ---
        // See next step for FCM implementation.

        res.json({ message: 'Complaint resolved', complaint });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;