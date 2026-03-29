const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fabricId: { type: String, required: true },
    type: { type: String, enum: ['DEPOSIT', 'WITHDRAW', 'LOAN', 'REPAYMENT'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'SUCCESS' },
    gateway: { type: String, default: 'INTERNAL' }, // Razorpay | Cashfree
    fabricTxId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
