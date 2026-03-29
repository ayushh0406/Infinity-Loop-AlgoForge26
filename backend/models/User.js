const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['lender', 'borrower'], default: 'borrower' },
    pan: { type: String, default: null },
    aadhaar: { type: String, default: null },
    isPanVerified: { type: Boolean, default: false },
    isAadhaarVerified: { type: Boolean, default: false },
    fabricId: { type: String, required: true, unique: true },
    walletBalance: { type: Number, default: 0 },
    poolContribution: { type: Number, default: 0 },
    deposits: [{
        amount: { type: Number, required: true },
        tenure: { type: Number, required: true },       // months
        apy: { type: Number, default: 12.1 },
        depositDate: { type: Date, default: Date.now },
        maturityDate: { type: Date, required: true },
        withdrawn: { type: Boolean, default: false },
    }],
    trustScore: { type: Number, default: null },
    lastScoreDate: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
