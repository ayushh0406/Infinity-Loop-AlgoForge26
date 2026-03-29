const mongoose = require('mongoose');

const PoolSchema = new mongoose.Schema({
    key: { type: String, default: 'POOL', unique: true },
    totalBalance: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pool', PoolSchema);
