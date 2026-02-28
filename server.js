const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const dustbinRoutes = require('./routes/dustbin');
const rewardRoutes = require('./routes/rewards');
const vehicleRoutes = require('./routes/vehicles');
const complaintRoutes = require('./routes/complaints');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_dustbin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Routes
app.use('/api/dustbin', dustbinRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/complaints', complaintRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));