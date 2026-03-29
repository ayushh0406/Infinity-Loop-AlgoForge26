const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Load environment variables if any
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const kycRoutes = require('./routes/kyc');
const paymentRoutes = require('./routes/payments');

app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('TrustPool AI Backend API Running');
});

// Database connection (Mocked or real)
// For demonstration, we'll try to connect but won't crash if it fails
mongoose.connect('mongodb+srv://panigrahibalram16:Ping420+@cluster0.ne7hd.mongodb.net/Trustpool')
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log('MongoDB connection error. Starting without DB for mock testing...', err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
