const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Pool = require('../models/Pool');
const Loan = require('../models/Loan');

const JWT_SECRET = process.env.JWT_SECRET || 'trustpool-super-secret-key-2024';

// Middleware: verify JWT
const auth = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ msg: 'No token' });
    try {
        req.user = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ msg: 'Invalid token' });
    }
};

// Helper: ensure Pool document exists
const getPool = async () => {
    let pool = await Pool.findOne({ key: 'POOL' });
    if (!pool) pool = await Pool.create({ key: 'POOL', totalBalance: 0 });
    return pool;
};

// Helper: write to Fabric ledger
const writeFabric = async (fabricId, type, amount) => {
    try {
        const { invokeFabric } = require('../fabric-invoke');
        return await invokeFabric(`TX_${crypto.randomUUID().split('-')[0]}`, `${type}:${fabricId}`, amount);
    } catch (e) {
        console.error('[Fabric] Write skipped:', e.message);
        return null;
    }
};

// ──────────────────────────────────────────────────
// POST /api/payments/deposit  (Lender → Pool)
// Mock Razorpay success callback
// ──────────────────────────────────────────────────
router.post('/deposit', auth, async (req, res) => {
    const { amount, tenure } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ msg: 'Invalid amount' });
    const lockInMonths = [3, 6, 12].includes(tenure) ? tenure : 6;

    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.walletBalance < amount) return res.status(400).json({ msg: 'Insufficient wallet balance' });

        // Mock Razorpay gateway delay simulation
        console.log(`[Razorpay Mock] Payment of ₹${amount} received from ${user.name} | Lock-in: ${lockInMonths}m`);

        // Debit user wallet, credit pool
        user.walletBalance -= amount;
        user.poolContribution += amount;

        // Calculate maturity date
        const depositDate = new Date();
        const maturityDate = new Date(depositDate);
        maturityDate.setMonth(maturityDate.getMonth() + lockInMonths);

        // APY range: 11-13%, higher tenure = higher APY
        const apyMap = { 3: 11.0, 6: 12.1, 12: 13.0 };
        const apy = apyMap[lockInMonths] || 12.1;

        // Save deposit record
        user.deposits.push({
            amount,
            tenure: lockInMonths,
            apy,
            depositDate,
            maturityDate,
            withdrawn: false,
        });
        await user.save();

        const pool = await getPool();
        pool.totalBalance += amount;
        pool.updatedAt = Date.now();
        await pool.save();

        // Write to Fabric ledger
        const fabricTxId = await writeFabric(user.fabricId, 'DEPOSIT', amount);

        const tx = await Transaction.create({
            userId: user._id,
            fabricId: user.fabricId,
            type: 'DEPOSIT',
            amount,
            gateway: 'Razorpay',
            fabricTxId: fabricTxId ? `FAB_${crypto.randomUUID().split('-')[0].toUpperCase()}` : null
        });

        res.json({
            msg: `₹${amount} deposited for ${lockInMonths} months @ ${apy}% APY! 🎉`,
            walletBalance: user.walletBalance,
            poolTotal: pool.totalBalance,
            transaction: tx
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ──────────────────────────────────────────────────
// GET /api/payments/my-deposits  (Lender deposits with lock-in)
// ──────────────────────────────────────────────────
router.get('/my-deposits', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const deposits = (user.deposits || []).map(d => {
            const now = new Date();
            const maturity = new Date(d.maturityDate);
            const isMatured = now >= maturity;
            const daysLeft = isMatured ? 0 : Math.ceil((maturity - now) / (1000 * 60 * 60 * 24));
            // Earned interest so far (simple interest)
            const elapsedMonths = Math.min(
                d.tenure,
                (now - new Date(d.depositDate)) / (1000 * 60 * 60 * 24 * 30)
            );
            const earned = Math.round(d.amount * (d.apy / 100) * (elapsedMonths / 12));

            return {
                _id: d._id,
                amount: d.amount,
                tenure: d.tenure,
                apy: d.apy,
                depositDate: d.depositDate,
                maturityDate: d.maturityDate,
                withdrawn: d.withdrawn,
                isMatured,
                daysLeft,
                earned,
            };
        });

        res.json({ deposits, poolContribution: user.poolContribution });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ──────────────────────────────────────────────────
// POST /api/payments/lender-withdraw  (Lender ← Pool)
// Respects lock-in period
// ──────────────────────────────────────────────────
router.post('/lender-withdraw', auth, async (req, res) => {
    const { depositId, forceEarly } = req.body;
    if (!depositId) return res.status(400).json({ msg: 'Deposit ID required' });

    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const deposit = user.deposits.id(depositId);
        if (!deposit) return res.status(404).json({ msg: 'Deposit not found' });
        if (deposit.withdrawn) return res.status(400).json({ msg: 'Already withdrawn' });

        const now = new Date();
        const maturity = new Date(deposit.maturityDate);
        const isMatured = now >= maturity;

        if (!isMatured && !forceEarly) {
            const daysLeft = Math.ceil((maturity - now) / (1000 * 60 * 60 * 24));
            return res.status(400).json({
                msg: `Lock-in period active! ${daysLeft} days remaining. Withdraw early with 0.5% penalty?`,
                locked: true,
                daysLeft,
                maturityDate: maturity,
            });
        }

        // Calculate interest
        const elapsedMonths = (now - new Date(deposit.depositDate)) / (1000 * 60 * 60 * 24 * 30);
        const effectiveMonths = Math.min(deposit.tenure, elapsedMonths);
        let earned = Math.round(deposit.amount * (deposit.apy / 100) * (effectiveMonths / 12));

        // Early withdrawal penalty: 0.5% of principal
        let penalty = 0;
        if (!isMatured && forceEarly) {
            penalty = Math.round(deposit.amount * 0.005);
            earned = Math.max(0, earned - penalty);
        }

        const totalReturn = deposit.amount + earned;

        // Update user
        deposit.withdrawn = true;
        user.poolContribution -= deposit.amount;
        user.walletBalance += totalReturn;
        await user.save();

        // Update pool
        const pool = await getPool();
        pool.totalBalance -= deposit.amount;
        pool.updatedAt = Date.now();
        await pool.save();

        // Fabric ledger
        const fabricTxId = await writeFabric(user.fabricId, 'WITHDRAW', totalReturn);

        const tx = await Transaction.create({
            userId: user._id,
            fabricId: user.fabricId,
            type: 'WITHDRAW',
            amount: totalReturn,
            gateway: 'TrustPool',
            fabricTxId: fabricTxId ? `FAB_${crypto.randomUUID().split('-')[0].toUpperCase()}` : null
        });

        res.json({
            msg: `₹${totalReturn.toLocaleString('en-IN')} withdrawn (₹${deposit.amount.toLocaleString('en-IN')} + ₹${earned.toLocaleString('en-IN')} interest${penalty ? ` - ₹${penalty} penalty` : ''}) ✅`,
            walletBalance: user.walletBalance,
            poolTotal: pool.totalBalance,
            interest: earned,
            penalty,
            transaction: tx,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ──────────────────────────────────────────────────
// POST /api/payments/withdraw  (Borrower ← Pool)
// Mock Cashfree payout
// ──────────────────────────────────────────────────
router.post('/withdraw', auth, async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ msg: 'Invalid amount' });

    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const pool = await getPool();
        if (pool.totalBalance < amount) {
            return res.status(400).json({ msg: 'Insufficient pool balance. Try a smaller amount.' });
        }

        // Mock Cashfree payout
        console.log(`[Cashfree Mock] Payout of ₹${amount} to ${user.name}`);

        pool.totalBalance -= amount;
        pool.updatedAt = Date.now();
        await pool.save();

        user.walletBalance += amount;
        await user.save();

        const fabricTxId = await writeFabric(user.fabricId, 'WITHDRAW', amount);

        const tx = await Transaction.create({
            userId: user._id,
            fabricId: user.fabricId,
            type: 'WITHDRAW',
            amount,
            gateway: 'Cashfree',
            fabricTxId: fabricTxId ? `FAB_${crypto.randomUUID().split('-')[0].toUpperCase()}` : null
        });

        res.json({
            msg: `₹${amount} disbursed to your wallet! ✅`,
            walletBalance: user.walletBalance,
            poolTotal: pool.totalBalance,
            transaction: tx
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ──────────────────────────────────────────────────
// POST /api/payments/repay  (Borrower → Pool)
// Mock Razorpay repayment
// ──────────────────────────────────────────────────
router.post('/repay', auth, async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ msg: 'Invalid amount' });

    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.walletBalance < amount) {
            return res.status(400).json({ msg: 'Insufficient wallet balance to repay this amount.' });
        }

        // Mock Razorpay repayment
        console.log(`[Razorpay Mock] Repayment of ₹${amount} received from ${user.name}`);

        const pool = await getPool();
        pool.totalBalance += amount;
        pool.updatedAt = Date.now();
        await pool.save();

        user.walletBalance -= amount;
        await user.save();

        const fabricTxId = await writeFabric(user.fabricId, 'REPAYMENT', amount);

        const tx = await Transaction.create({
            userId: user._id,
            fabricId: user.fabricId,
            type: 'REPAYMENT',
            amount,
            gateway: 'Razorpay',
            fabricTxId: fabricTxId ? `FAB_${crypto.randomUUID().split('-')[0].toUpperCase()}` : null
        });

        res.json({
            msg: `₹${amount} repaid successfully! 🔄`,
            walletBalance: user.walletBalance,
            poolTotal: pool.totalBalance,
            transaction: tx
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ──────────────────────────────────────────────────
// GET /api/payments/history  — last 10 transactions
// ──────────────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
    try {
        const txns = await Transaction.find({ userId: req.user.userId })
            .sort({ createdAt: -1 }).limit(10);
        res.json(txns);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ──────────────────────────────────────────────────
// GET /api/payments/pool — pool status
// ──────────────────────────────────────────────────
router.get('/pool', auth, async (req, res) => {
    try {
        const pool = await getPool();
        res.json(pool);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ──────────────────────────────────────────────────
// GET /api/payments/pool-public — no auth required
// Returns real pool balance + recent activity
// ──────────────────────────────────────────────────
router.get('/pool-public', async (req, res) => {
    try {
        const pool = await getPool();

        const recentTx = await Transaction.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Real stats from DB
        const loanTxns = await Transaction.find({ type: { $in: ['LOAN', 'WITHDRAW'] } }).lean();
        const activeLoans = loanTxns.length;
        const avgLoanSize = activeLoans > 0
            ? Math.round(loanTxns.reduce((s, t) => s + t.amount, 0) / activeLoans)
            : 0;

        res.json({
            totalBalance: pool.totalBalance,
            activeLoans,
            avgLoanSize,
            recentActivity: recentTx
        });
    } catch (err) {
        console.error('[pool-public]', err.message);
        res.status(500).json({ msg: 'Server error', totalBalance: 0, activeLoans: 0, avgLoanSize: 0, recentActivity: [] });
    }
});

// ──────────────────────────────────────────────────
// POST /api/payments/request-loan
// Borrower requests a loan → calls AI model → creates loan + EMIs
// ──────────────────────────────────────────────────
router.post('/request-loan', auth, async (req, res) => {
    const { amount, reason, mobileNumber, bankName } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ msg: 'Invalid loan amount' });

    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Check if user already has an active loan
        const existingLoan = await Loan.findOne({ userId: user._id, status: 'ACTIVE' });
        if (existingLoan) return res.status(400).json({ msg: 'You already have an active loan. Pay it off first.' });

        // Derive user_type from income/role
        let userType = 'salaried';
        if (user.walletBalance < 5000) userType = 'student';
        else if (user.walletBalance < 30000) userType = 'gig_worker';

        // Build AI model request
        const aiPayload = {
            user_type: userType,
            avg_monthly_income: Math.max(15000, user.walletBalance * 2),
            income_volatility: userType === 'salaried' ? 0.08 : userType === 'gig_worker' ? 0.35 : 0.5,
            upi_success_rate: 0.95,
            bill_payment_delay_days: 2,
            monthly_repayment_cap: Math.max(5000, amount / 6),
            essential_spend_ratio: 0.45,
            account_age_months: Math.max(6, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000))),
            loan_default_history: 0,
            savings_consistency: 0.8
        };

        // Call AI model at :8000/predict
        let aiResult;
        try {
            const aiRes = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiPayload)
            });
            if (!aiRes.ok) throw new Error(`AI model returned ${aiRes.status}`);
            aiResult = await aiRes.json();
        } catch (aiErr) {
            console.error('[AI Model] Error:', aiErr.message);
            return res.status(503).json({ msg: 'AI scoring service unavailable. Please try again.' });
        }

        const { trust_score, eligibility_status, interest_rate, monthly_emi, breakdown } = aiResult;

        // Save trust score on user
        user.trustScore = trust_score;
        user.lastScoreDate = new Date();
        await user.save();

        // If REJECTED
        if (eligibility_status === 'REJECTED') {
            // Save declined loan record
            await Loan.create({
                userId: user._id,
                fabricId: user.fabricId,
                amount,
                reason: reason || '',
                interestRate: 0,
                tenure: 0,
                trustScore: trust_score,
                eligibilityStatus: eligibility_status,
                monthlyEmi: 0,
                totalPayable: 0,
                status: 'DECLINED',
                aiResponse: aiResult,
                mobileNumber: mobileNumber || '',
                bankName: bankName || ''
            });
            return res.json({
                approved: false,
                msg: 'Loan application declined based on trust score.',
                aiResult
            });
        }

        // APPROVED — use user's requested amount (capped by AI's loan_amount)
        const approvedAmount = Math.min(amount, aiResult.loan_amount || amount);
        const tenure = 12;
        const rate = interest_rate;

        // Calculate EMI
        const monthlyRate = rate / 100 / 12;
        const emi = monthlyRate > 0
            ? Math.round(approvedAmount * (monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1))
            : Math.round(approvedAmount / tenure);
        const totalPayable = emi * tenure;

        // Generate EMI schedule
        const emis = [];
        const now = new Date();
        for (let i = 1; i <= tenure; i++) {
            const dueDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            emis.push({ month: i, amount: emi, dueDate, status: 'PENDING' });
        }

        // Check pool has enough funds
        const pool = await getPool();
        if (pool.totalBalance < approvedAmount) {
            return res.status(400).json({ msg: 'Insufficient pool funds. Try a smaller amount.' });
        }

        // Disburse: Pool → Borrower wallet
        pool.totalBalance -= approvedAmount;
        pool.updatedAt = Date.now();
        await pool.save();

        user.walletBalance += approvedAmount;
        await user.save();

        // Create Loan document
        const loan = await Loan.create({
            userId: user._id,
            fabricId: user.fabricId,
            amount: approvedAmount,
            reason: reason || '',
            interestRate: rate,
            tenure,
            trustScore: trust_score,
            eligibilityStatus: eligibility_status,
            monthlyEmi: emi,
            totalPayable,
            status: 'ACTIVE',
            emis,
            aiResponse: aiResult,
            mobileNumber: mobileNumber || '',
            bankName: bankName || ''
        });

        // Write to Fabric + create transaction
        const fabricTxId = await writeFabric(user.fabricId, 'LOAN', approvedAmount);
        await Transaction.create({
            userId: user._id,
            fabricId: user.fabricId,
            type: 'LOAN',
            amount: approvedAmount,
            gateway: 'TrustPool',
            fabricTxId: fabricTxId ? `FAB_${crypto.randomUUID().split('-')[0].toUpperCase()}` : null
        });

        console.log(`[Loan] ₹${approvedAmount} disbursed to ${user.name} | Score: ${trust_score} | ${eligibility_status}`);

        res.json({
            approved: true,
            msg: `Loan of ₹${approvedAmount.toLocaleString('en-IN')} approved and disbursed! 🎉`,
            loan,
            aiResult,
            walletBalance: user.walletBalance,
            poolTotal: pool.totalBalance
        });
    } catch (err) {
        console.error('[request-loan]', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ──────────────────────────────────────────────────
// GET /api/payments/my-loans — all loans for user
// ──────────────────────────────────────────────────
router.get('/my-loans', auth, async (req, res) => {
    try {
        const loans = await Loan.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();
        res.json(loans);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ──────────────────────────────────────────────────
// GET /api/payments/my-emis — all pending EMIs
// ──────────────────────────────────────────────────
router.get('/my-emis', auth, async (req, res) => {
    try {
        const loans = await Loan.find({ userId: req.user.userId, status: 'ACTIVE' }).lean();
        const allEmis = [];
        for (const loan of loans) {
            for (const emi of loan.emis) {
                allEmis.push({
                    loanId: loan._id,
                    loanAmount: loan.amount,
                    interestRate: loan.interestRate,
                    ...emi
                });
            }
        }
        // Sort by dueDate
        allEmis.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        res.json(allEmis);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ──────────────────────────────────────────────────
// POST /api/payments/pay-emi
// Pay a specific EMI: wallet → pool
// ──────────────────────────────────────────────────
router.post('/pay-emi', auth, async (req, res) => {
    const { loanId, emiIndex } = req.body;
    if (!loanId || emiIndex === undefined) return res.status(400).json({ msg: 'loanId and emiIndex required' });

    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const loan = await Loan.findOne({ _id: loanId, userId: user._id, status: 'ACTIVE' });
        if (!loan) return res.status(404).json({ msg: 'Active loan not found' });

        if (emiIndex < 0 || emiIndex >= loan.emis.length) return res.status(400).json({ msg: 'Invalid EMI index' });

        const emi = loan.emis[emiIndex];
        if (emi.status === 'PAID') return res.status(400).json({ msg: 'EMI already paid' });
        if (user.walletBalance < emi.amount) return res.status(400).json({ msg: `Insufficient wallet balance. Need ₹${emi.amount}` });

        // Deduct from wallet, credit pool
        user.walletBalance -= emi.amount;
        await user.save();

        const pool = await getPool();
        pool.totalBalance += emi.amount;
        pool.updatedAt = Date.now();
        await pool.save();

        // Mark EMI paid
        loan.emis[emiIndex].status = 'PAID';
        loan.emis[emiIndex].paidAt = new Date();
        loan.emis[emiIndex].txId = `EMI_${crypto.randomUUID().split('-')[0].toUpperCase()}`;

        // Write to Fabric
        const fabricTxId = await writeFabric(user.fabricId, 'REPAYMENT', emi.amount);
        loan.emis[emiIndex].fabricTxId = fabricTxId ? `FAB_${crypto.randomUUID().split('-')[0].toUpperCase()}` : null;

        // Create transaction record
        await Transaction.create({
            userId: user._id,
            fabricId: user.fabricId,
            type: 'REPAYMENT',
            amount: emi.amount,
            gateway: 'Razorpay',
            fabricTxId: loan.emis[emiIndex].fabricTxId
        });

        // Check if all EMIs paid → mark loan completed
        const allPaid = loan.emis.every(e => e.status === 'PAID');
        if (allPaid) loan.status = 'COMPLETED';

        await loan.save();

        console.log(`[EMI] ₹${emi.amount} paid by ${user.name} | EMI ${emiIndex + 1}/${loan.tenure} | ${allPaid ? 'LOAN COMPLETED' : 'ongoing'}`);

        res.json({
            msg: `EMI #${emiIndex + 1} of ₹${emi.amount} paid successfully! ${allPaid ? '🎉 Loan fully repaid!' : ''}`,
            walletBalance: user.walletBalance,
            poolTotal: pool.totalBalance,
            loanStatus: loan.status,
            emisPaid: loan.emis.filter(e => e.status === 'PAID').length,
            emisTotal: loan.emis.length
        });
    } catch (err) {
        console.error('[pay-emi]', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
