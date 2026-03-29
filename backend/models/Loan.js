const mongoose = require('mongoose');

const EmiSchema = new mongoose.Schema({
    month: { type: Number, required: true },       // 1, 2, 3...
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
    paidAt: { type: Date, default: null },
    txId: { type: String, default: null },
    fabricTxId: { type: String, default: null }
});

const LoanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fabricId: { type: String, required: true },
    amount: { type: Number, required: true },
    reason: { type: String, default: '' },
    interestRate: { type: Number, required: true },
    tenure: { type: Number, required: true },          // months
    trustScore: { type: Number, required: true },
    eligibilityStatus: { type: String, required: true },
    monthlyEmi: { type: Number, required: true },
    totalPayable: { type: Number, required: true },
    status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'DECLINED'], default: 'ACTIVE' },
    emis: [EmiSchema],
    aiResponse: { type: Object, default: {} },         // full AI /predict response
    mobileNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Loan', LoanSchema);
