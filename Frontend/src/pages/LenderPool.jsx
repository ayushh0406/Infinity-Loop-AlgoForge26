import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Card from '../components/ui/Card';
import Badge, { StatusDot } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import CountUp from '../components/ui/CountUp';
import Footer from '../components/sections/Footer';
import { POOL_STATS as MOCK_POOL_STATS, ACTIVITY_FEED as MOCK_ACTIVITY_FEED } from '../utils/mockData';
import { formatCurrency, formatIndianNumber } from '../utils/formatters';
import { ArrowRight, Lock, Shield, Link, Loader, Wallet, X, ArrowUpRight, ArrowDownLeft, Clock, Banknote, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

const BACKEND = 'http://localhost:5000';
const getToken = () => localStorage.getItem('auth_token');

async function apiFetch(path) {
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

// No auth header — for public routes
async function publicFetch(path) {
  try {
    const res = await fetch(`${BACKEND}${path}`);
    if (!res.ok) { console.error('[publicFetch] status', res.status); return null; }
    return res.json();
  } catch (e) { console.error('[publicFetch] error', e.message); return null; }
}

async function apiPost(path, body) {
  const res = await fetch(`${BACKEND}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Failed');
  return data;
}

// Convert backend tx to activity feed format (no populate)
function txToActivity(tx, index) {
  const typeMap = { DEPOSIT: 'deposit', WITHDRAW: 'loan', REPAYMENT: 'repayment', LOAN: 'loan' };
  return {
    id: tx._id || index,
    type: typeMap[tx.type] || 'deposit',
    user: tx.fabricId ? tx.fabricId.slice(-6) : `user_${index}`,
    amount: tx.amount,
    time: tx.createdAt
      ? new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : 'recently'
  };
}

/**
 * Lender Pool Page
 * Investment pool for retail lenders
 */

// Quick deposit amounts
const depositAmounts = [5000, 10000, 25000, 50000];
const tenureOptions = [3, 6, 12];

export default function LenderPool() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [depositAmount, setDepositAmount] = useState(10000);
  const [selectedTenure, setSelectedTenure] = useState(6);
  const [depositLoading, setDepositLoading] = useState(false);

  // null = loading, { totalBalance: N } = real data
  const [poolData, setPoolData]         = useState(null);
  const [walletBal, setWalletBal]       = useState(null);
  const [myTxHistory, setMyTxHistory]   = useState([]);
  const [activityFeed, setActivityFeed] = useState(null);
  const [poolLoaded, setPoolLoaded]     = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(null);
  // Floating wallet widget
  const [walletOpen, setWalletOpen]     = useState(false);
  // My deposits & withdrawals
  const [myDeposits, setMyDeposits]     = useState([]);
  const [withdrawing, setWithdrawing]   = useState(null); // depositId being withdrawn
  const [confirmEarly, setConfirmEarly] = useState(null); // depositId for early withdraw confirm

  const fetchLive = useCallback(async () => {
    // pool-public: no auth header needed
    const publicData = await publicFetch('/api/payments/pool-public');

    if (publicData != null) {
      setPoolData({
        totalBalance: publicData.totalBalance ?? 0,
        activeLoans:  publicData.activeLoans ?? null,
        avgLoanSize:  publicData.avgLoanSize  ?? null,
      });
      if (publicData.recentActivity?.length > 0) {
        setActivityFeed(publicData.recentActivity.map(txToActivity));
      }
    }
    setPoolLoaded(true);

    // Personal wallet data — only when logged in
    if (getToken()) {
      const [profile, txns, deps] = await Promise.all([
        apiFetch('/api/auth/profile'),
        apiFetch('/api/payments/history'),
        apiFetch('/api/payments/my-deposits'),
      ]);
      if (profile) setWalletBal(profile.walletBalance);
      if (txns)    setMyTxHistory(txns);
      if (deps?.deposits) setMyDeposits(deps.deposits);
    }

    setLastUpdated(new Date().toLocaleTimeString('en-IN'));
  }, []);

  // Initial fetch + poll every 10s
  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, 10000);
    return () => clearInterval(id);
  }, [fetchLive]);

  // Real stats from backend — null = loading
  const POOL_STATS = {
    ...MOCK_POOL_STATS,
    totalPool:   poolData !== null ? poolData.totalBalance : null,
    activeLoans: poolData !== null ? poolData.activeLoans  : null,
    avgLoanSize: poolData !== null ? poolData.avgLoanSize  : null,
  };

  // Use real activity if available, else show mock until loaded
  const ACTIVITY_FEED = activityFeed ?? MOCK_ACTIVITY_FEED;

  // Calculate estimated returns
  // APY based on selected tenure: 3m=11%, 6m=12.1%, 12m=13%
  const apyForTenure = { 3: 11.0, 6: 12.1, 12: 13.0 };
  const currentApy = apyForTenure[selectedTenure] || 12.1;

  const estimatedMonthlyReturn = useMemo(() => {
    const monthlyRate = currentApy / 12 / 100;
    return Math.round(depositAmount * monthlyRate);
  }, [depositAmount, currentApy]);

  // Handle real deposit
  const handleDeposit = async () => {
    if (!getToken()) {
      addToast({ message: 'Please login as a lender first', type: 'error' }); return;
    }
    if (!depositAmount || depositAmount <= 0) {
      addToast({ message: 'Enter a valid amount', type: 'error' }); return;
    }
    if (walletBal !== null && depositAmount > walletBal) {
      addToast({ message: `Insufficient balance. Available: ₹${walletBal?.toLocaleString('en-IN')}`, type: 'error' }); return;
    }
    setDepositLoading(true);
    try {
      const res = await apiPost('/api/payments/deposit', { amount: depositAmount, tenure: selectedTenure });
      addToast({ message: res.msg || `₹${depositAmount.toLocaleString('en-IN')} deposited! 🎉`, type: 'success' });
      fetchLive(); // refresh stats
    } catch (err) {
      addToast({ message: err.message || 'Deposit failed', type: 'error' });
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#020817] pt-24"
    >
      <div className="container py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="eyebrow mb-3">
            <span>LENDER POOL</span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">
            Earn Better Returns
          </h1>
          <p className="text-white/60 mt-2 max-w-lg">
            Deposit into the pool. Earn as borrowers repay. 
            Diversified across hundreds of micro-loans.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          <StatCard
            value={POOL_STATS.totalPool}
            label="Total Pool Size"
            prefix="₹"
            formatAsIndian
            sparklineData={POOL_STATS.sparklineData}
          />
          <StatCard
            value={POOL_STATS.apy}
            suffix="% p.a."
            label="Current APY"
            highlight
          />
          <StatCard
            value={POOL_STATS.activeLoans}
            label="Active Loans"
          />
          <StatCard
            value={POOL_STATS.avgLoanSize}
            label="Avg Loan Size"
            prefix="₹"
          />
        </motion.div>


        {/* Main Content */}
        <div className="grid lg:grid-cols-[2fr,3fr] gap-8">
          {/* Left - Deposit Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <h3 className="text-white font-semibold text-lg mb-2">Start Earning</h3>
              <p className="text-white/50 text-sm mb-6">
                Deposit into the pool. Earn as borrowers repay.
              </p>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="text-white/50 text-sm mb-2 block">Deposit Amount</label>
                <div className="flex items-baseline gap-1 border-b border-[rgba(255,255,255,0.1)] pb-2">
                  <span className="text-white/40 text-2xl font-mono">₹</span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                    className="bg-transparent text-white font-mono text-3xl font-bold w-full focus:outline-none"
                  />
                </div>
                <p className="text-[#10B981] text-sm font-mono mt-2">
                  ≈ ₹{estimatedMonthlyReturn.toLocaleString('en-IN')}/month @ {currentApy}% APY
                </p>
              </div>

              {/* Quick Select */}
              <div className="flex flex-wrap gap-2 mb-6">
                {depositAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(amount)}
                    className={`
                      px-4 py-2 rounded-lg font-mono text-sm transition-all
                      ${depositAmount === amount
                        ? 'bg-[#4F8EF7] text-white'
                        : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white/60 hover:border-[rgba(79,142,247,0.3)]'}
                    `}
                  >
                    ₹{formatIndianNumber(amount)}
                  </button>
                ))}
              </div>

              {/* Tenure Selector */}
              <div className="mb-6">
                <label className="text-white/50 text-sm mb-3 block">Lock-in Period</label>
                <div className="flex gap-2">
                  {tenureOptions.map((tenure) => (
                    <button
                      key={tenure}
                      onClick={() => setSelectedTenure(tenure)}
                      className={`
                        flex-1 py-3 rounded-lg font-medium text-sm transition-all
                        ${selectedTenure === tenure
                          ? 'bg-[#4F8EF7] text-white'
                          : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white/60 hover:border-[rgba(79,142,247,0.3)]'}
                      `}
                    >
                      {tenure} months
                    </button>
                  ))}
                </div>
                <p className="text-white/30 text-xs mt-2">
                  APY: {apyForTenure[3]}% (3m) · {apyForTenure[6]}% (6m) · {apyForTenure[12]}% (12m) — Early exit: 0.5% fee
                </p>
              </div>

              {/* Risk Allocation Donut */}
              <div className="mb-6">
                <label className="text-white/50 text-sm mb-3 block">Your funds allocated to:</label>
                <div className="flex items-center gap-6">
                  <RiskDonut data={POOL_STATS.riskDistribution} />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                      <span className="text-white/60 text-xs">Low Risk {POOL_STATS.riskDistribution.low}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                      <span className="text-white/60 text-xs">Medium {POOL_STATS.riskDistribution.medium}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                      <span className="text-white/60 text-xs">High Risk {POOL_STATS.riskDistribution.high}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deposit Button */}
              {walletBal !== null && (
                <p className="text-white/40 text-xs text-center mb-2">
                  Wallet: ₹{walletBal?.toLocaleString('en-IN')} available
                </p>
              )}
              <Button
                fullWidth
                icon={depositLoading ? <Loader size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                onClick={handleDeposit}
                disabled={depositLoading}
              >
                {depositLoading ? 'Processing via Razorpay…' : 'Deposit Now'}
              </Button>

              {/* Trust Icons */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-2 text-white/30 text-xs">
                  <Lock size={14} />
                  <span>Escrow</span>
                </div>
                <div className="flex items-center gap-2 text-white/30 text-xs">
                  <Shield size={14} />
                  <span>Protected</span>
                </div>
                <div className="flex items-center gap-2 text-white/30 text-xs">
                  <Link size={14} />
                  <span>On-Chain</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right - Activity Feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-semibold text-lg">Live Activity</h3>
                  <StatusDot status="success" pulse />
                </div>
                <span className="text-white/30 text-xs font-mono">{lastUpdated ? `Updated ${lastUpdated}` : 'Updating…'}</span>
              </div>

              {/* Activity Feed */}
              <div 
                className="space-y-0 max-h-[380px] overflow-y-auto hide-scrollbar"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
                }}
              >
                <AnimatePresence>
                  {ACTIVITY_FEED.map((activity, index) => (
                    <ActivityItem 
                      key={activity.id} 
                      activity={activity}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Risk Distribution Bar */}
              <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                <p className="text-white/40 text-xs mb-3">Active Loan Risk Distribution</p>
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#10B981]" 
                    style={{ width: `${POOL_STATS.riskDistribution.low}%` }}
                  />
                  <div 
                    className="bg-[#F59E0B]" 
                    style={{ width: `${POOL_STATS.riskDistribution.medium}%` }}
                  />
                  <div 
                    className="bg-[#EF4444]" 
                    style={{ width: `${POOL_STATS.riskDistribution.high}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-white/30">
                  <span>Low {POOL_STATS.riskDistribution.low}%</span>
                  <span>Med {POOL_STATS.riskDistribution.medium}%</span>
                  <span>High {POOL_STATS.riskDistribution.high}%</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ── My Deposits (Withdraw section) ── */}
        {walletBal !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-8"
          >
            <Card>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[rgba(79,142,247,0.15)] flex items-center justify-center">
                  <Banknote size={18} className="text-[#4F8EF7]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">My Deposits</h3>
                  <p className="text-white/40 text-xs">Manage your pool investments & withdrawals</p>
                </div>
              </div>

              <div className="space-y-3">
                {myDeposits.filter(d => !d.withdrawn).length === 0 && (
                  <div className="text-center py-8 text-white/30 text-sm">
                    <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No active deposits yet.</p>
                    <p className="text-xs mt-1">Deposit above to start earning!</p>
                  </div>
                )}
                {myDeposits.filter(d => !d.withdrawn).map(dep => {
                  const matDate = new Date(dep.maturityDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                  const depDate = new Date(dep.depositDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                  return (
                    <div key={dep._id} className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold font-mono">₹{dep.amount.toLocaleString('en-IN')}</p>
                          <p className="text-white/40 text-[11px]">{dep.tenure}m lock-in · {dep.apy}% APY · Deposited {depDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#10B981] text-sm font-mono font-semibold">+₹{dep.earned.toLocaleString('en-IN')}</p>
                          <p className="text-white/30 text-[10px]">earned so far</p>
                        </div>
                      </div>

                      {/* Lock-in progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-white/40">Lock-in status</span>
                          <span className={dep.isMatured ? 'text-[#10B981]' : 'text-[#F59E0B]'}>
                            {dep.isMatured ? '✅ Matured' : `🔒 ${dep.daysLeft} days left`}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${dep.isMatured ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`}
                            style={{ width: `${dep.isMatured ? 100 : Math.max(5, ((dep.tenure * 30 - dep.daysLeft) / (dep.tenure * 30)) * 100)}%` }}
                          />
                        </div>
                        <p className="text-white/30 text-[10px] mt-1">Matures: {matDate}</p>
                      </div>

                      {/* Withdraw button */}
                      {confirmEarly === dep._id ? (
                        <div className="flex items-center gap-2 p-3 bg-[rgba(239,68,68,0.08)] border border-red-500/20 rounded-lg">
                          <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                          <p className="text-red-300 text-xs flex-1">Early exit: 0.5% penalty (₹{Math.round(dep.amount * 0.005).toLocaleString('en-IN')})</p>
                          <button
                            onClick={async () => {
                              setWithdrawing(dep._id);
                              try {
                                const r = await apiPost('/api/payments/lender-withdraw', { depositId: dep._id, forceEarly: true });
                                addToast({ message: r.msg, type: 'success' });
                                fetchLive();
                              } catch (e) { addToast({ message: e.message, type: 'error' }); }
                              finally { setWithdrawing(null); setConfirmEarly(null); }
                            }}
                            disabled={withdrawing === dep._id}
                            className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-lg hover:bg-red-500/30 transition-colors flex-shrink-0"
                          >
                            {withdrawing === dep._id ? 'Processing…' : 'Confirm'}
                          </button>
                          <button onClick={() => setConfirmEarly(null)} className="text-white/30 text-xs hover:text-white/60">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            if (dep.isMatured) {
                              setWithdrawing(dep._id);
                              try {
                                const r = await apiPost('/api/payments/lender-withdraw', { depositId: dep._id });
                                addToast({ message: r.msg, type: 'success' });
                                fetchLive();
                              } catch (e) { addToast({ message: e.message, type: 'error' }); }
                              finally { setWithdrawing(null); }
                            } else {
                              setConfirmEarly(dep._id);
                            }
                          }}
                          disabled={withdrawing === dep._id}
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            dep.isMatured
                              ? 'bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30'
                              : 'bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          {withdrawing === dep._id ? <Loader size={14} className="animate-spin" /> : <Banknote size={14} />}
                          {dep.isMatured ? 'Withdraw (Principal + Interest)' : `Withdraw Early (${dep.daysLeft}d lock-in)`}
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Withdrawn deposits - collapsed */}
                {myDeposits.filter(d => d.withdrawn).length > 0 && (
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-white/30 text-xs mb-2">Withdrawn</p>
                    {myDeposits.filter(d => d.withdrawn).map(dep => (
                      <div key={dep._id} className="flex items-center justify-between py-2 text-white/25 text-xs">
                        <span>₹{dep.amount.toLocaleString('en-IN')} · {dep.tenure}m</span>
                        <span>Withdrawn ✓</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}


        {/* APY Comparison — Why TrustPool Returns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <div className="eyebrow mb-4">
            <span>WHY TRUSTPOOL RETURNS</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <APYComparisonCard
              title="Fixed Deposit"
              rate="6.5–7.5%"
              subtitle="p.a."
            />
            <APYComparisonCard
              title="Mutual Funds"
              rate="9–12%"
              subtitle="p.a."
            />
            <APYComparisonCard
              title="TrustPool AI"
              rate="11–13%"
              subtitle="p.a."
              highlight
              badge="Best Returns"
            />
          </div>
          <p className="text-white/30 text-xs mt-3 text-center">
            Returns are indicative. Past performance not guaranteed.
          </p>
        </motion.div>

      </div>

      <Footer />

      {/* ── Floating Wallet Widget (only when logged in) ── */}
      {walletBal !== null && (
        <>
          {/* Toggle button */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setWalletOpen(o => !o)}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-white text-sm font-medium shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #4F8EF7, #9333EA)', boxShadow: '0 8px 30px rgba(79,142,247,0.4)' }}
          >
            <Wallet size={18} />
            <span>₹{walletBal?.toLocaleString('en-IN')}</span>
          </motion.button>

          {/* Mini panel */}
          <AnimatePresence>
            {walletOpen && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed bottom-24 right-8 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: 'rgba(6,15,36,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-[#4F8EF7]" />
                    <span className="text-white text-sm font-semibold">My Wallet</span>
                  </div>
                  <button onClick={() => setWalletOpen(false)} className="text-white/40 hover:text-white/70">
                    <X size={14} />
                  </button>
                </div>

                {/* Balance */}
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-white/40 text-xs">Available Balance</p>
                  <p className="text-white text-2xl font-bold font-mono mt-0.5">₹{walletBal?.toLocaleString('en-IN')}</p>
                </div>

                {/* Last 3 transactions */}
                <div className="px-4 py-3">
                  <p className="text-white/40 text-[10px] font-medium mb-2 uppercase tracking-wider">Recent Activity</p>
                  {myTxHistory.length === 0 ? (
                    <p className="text-white/30 text-xs py-2">No transactions yet</p>
                  ) : (
                    myTxHistory.slice(0, 3).map((tx, i) => {
                      const isIn = tx.type === 'REPAYMENT';
                      return (
                        <div key={tx._id || i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: isIn ? 'rgba(16,185,129,0.15)' : 'rgba(79,142,247,0.15)' }}>
                            {isIn
                              ? <ArrowDownLeft size={13} className="text-[#10B981]" />
                              : <ArrowUpRight size={13} className="text-[#4F8EF7]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/70 text-xs font-medium">{tx.type}</p>
                            <p className="text-white/30 text-[10px] truncate">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                            </p>
                          </div>
                          <span className="text-xs font-mono font-semibold" style={{ color: isIn ? '#10B981' : '#4F8EF7' }}>
                            {isIn ? '+' : '-'}₹{tx.amount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.main>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ value, label, prefix = '', suffix = '', formatAsIndian = false, sparklineData, highlight = false }) {
  // value === null means still loading
  const isLoading = value === null;

  return (
    <Card hover={false} className="relative overflow-hidden">
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${highlight ? 'bg-[#4F8EF7]' : 'bg-[rgba(79,142,247,0.3)]'}`} />
      
      {/* Sparkline */}
      {sparklineData && (
        <div className="absolute bottom-2 right-2 w-16 h-8 opacity-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#4F8EF7" 
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="relative">
        {isLoading ? (
          <div className="font-display font-extrabold text-2xl md:text-3xl text-white/20 animate-pulse">
            {prefix}—
          </div>
        ) : (
          <div className={`font-display font-extrabold text-2xl md:text-3xl ${highlight ? 'text-[#4F8EF7]' : 'text-white'}`}>
            {prefix}
            <CountUp 
              end={value} 
              formatIndian={formatAsIndian}
              decimals={value % 1 !== 0 ? 1 : 0}
            />
            {suffix}
          </div>
        )}
        <p className="text-white/50 text-xs mt-1">{label}</p>
      </div>
    </Card>
  );
}


/**
 * APY Comparison Card
 */
function APYComparisonCard({ title, rate, subtitle, highlight = false, badge }) {
  return (
    <Card 
      hover={false}
      className={`relative text-center transition-transform ${highlight ? 'scale-105 border-[rgba(79,142,247,0.3)] shadow-[0_0_40px_rgba(79,142,247,0.15)]' : ''}`}
    >
      {badge && (
        <Badge variant="success" size="sm" className="absolute -top-2 right-4">
          {badge}
        </Badge>
      )}
      <h4 className="text-white/60 text-sm mb-2">{title}</h4>
      <div className={`font-display font-bold text-3xl ${highlight ? 'text-[#4F8EF7]' : 'text-white'}`}>
        {rate}
        {highlight && <span className="ml-1">⚡</span>}
      </div>
      <span className="text-white/40 text-xs">{subtitle}</span>
    </Card>
  );
}

/**
 * Risk Donut Chart
 */
function RiskDonut({ data }) {
  const chartData = [
    { name: 'Low', value: data.low, color: '#10B981' },
    { name: 'Medium', value: data.medium, color: '#F59E0B' },
    { name: 'High', value: data.high, color: '#EF4444' }
  ];

  return (
    <div className="w-24 h-24">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={28}
            outerRadius={40}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Activity Item Component
 */
function ActivityItem({ activity, index }) {
  const getActivityBadge = (type) => {
    switch (type) {
      case 'deposit':
        return <Badge variant="success" size="sm">Deposit</Badge>;
      case 'loan':
        return <Badge variant="accent" size="sm">Loan</Badge>;
      case 'repayment':
        return <Badge variant="glass" size="sm">Repayment</Badge>;
      default:
        return <Badge variant="glass" size="sm">{type}</Badge>;
    }
  };

  const getInitials = (name) => {
    if (name.startsWith('user_')) return name.slice(5, 7).toUpperCase();
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 py-3 border-b border-[rgba(255,255,255,0.05)]"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-[rgba(79,142,247,0.15)] flex items-center justify-center flex-shrink-0">
        <span className="text-[#6BA3FF] text-[10px] font-mono font-medium">
          {getInitials(activity.user)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-sm">
          <span className="font-medium">{activity.user}</span>
          {activity.type === 'deposit' && ' deposited '}
          {activity.type === 'loan' && ' · Loan disbursed '}
          {activity.type === 'repayment' && ' · Repayment '}
          <span className="text-white font-mono">
            {formatCurrency(activity.amount)}
          </span>
        </p>
        <p className="text-white/30 text-xs">{activity.time}</p>
      </div>

      {/* Badge */}
      {getActivityBadge(activity.type)}
    </motion.div>
  );
}
