import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, TrendingUp, Users,
  History, Settings, LogOut, ArrowUpRight, ArrowDownLeft,
  RefreshCw, Loader, CheckCircle, X, ShieldCheck
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/apiService';

/**
 * Lender Dashboard
 * Same layout as Dashboard.jsx — sidebar + main content
 * Floating wallet button bottom-right
 */

const BACKEND_URL = 'http://localhost:5000';
const getToken = () => localStorage.getItem('auth_token');

async function apiGet(path) {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

async function apiPost(path, body) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Request failed');
  return data;
}

const formatINR = (n) =>
  typeof n === 'number'
    ? '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : '₹0';

// Sidebar nav items
const navItems = [
  { id: 'overview',  label: 'Overview',    icon: LayoutDashboard },
  { id: 'deposits',  label: 'My Deposits', icon: TrendingUp },
  { id: 'history',   label: 'History',     icon: History },
];

export default function LenderDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [profile,   setProfile]   = useState(null);
  const [pool,      setPool]      = useState(null);
  const [txHistory, setTxHistory] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Wallet drawer
  const [walletOpen,    setWalletOpen]    = useState(false);
  const [depositAmt,    setDepositAmt]    = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg,    setDepositMsg]    = useState(null);

  const fetchAll = async () => {
    const [p, po, tx] = await Promise.all([
      apiGet('/api/auth/profile'),
      apiGet('/api/payments/pool'),
      apiGet('/api/payments/history'),
    ]);
    if (p)  setProfile(p);
    if (po) setPool(po);
    if (tx) setTxHistory(tx);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleDeposit = async () => {
    const amt = Number(depositAmt);
    if (!amt || amt <= 0) return;
    setDepositLoading(true);
    setDepositMsg(null);
    try {
      const res = await apiPost('/api/payments/deposit', { amount: amt });
      setDepositMsg({ ok: true, text: res.msg });
      setDepositAmt('');
      fetchAll();
    } catch (err) {
      setDepositMsg({ ok: false, text: err.message });
    } finally { setDepositLoading(false); }
  };

  const handleLogout = () => { logout(); logoutUser(); navigate('/'); };

  const displayName  = profile?.name  || user?.name  || 'Lender';
  const initials     = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const walletBal    = profile?.walletBalance   ?? 0;
  const poolContrib  = profile?.poolContribution ?? 0;
  const poolTotal    = pool?.totalBalance        ?? 0;
  const estYield     = Math.round(poolContrib * 0.14);

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#020817] flex"
    >
      {/* ── Sidebar (same structure as Dashboard.jsx) ─────────────── */}
      <aside className="hidden lg:flex w-60 flex-col bg-[rgba(6,15,36,0.95)] border-r border-[rgba(255,255,255,0.05)] backdrop-blur-xl fixed top-16 z-30 h-[calc(100vh-64px)]">


        {/* User card */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[rgba(79,142,247,0.2)] flex items-center justify-center">
              <span className="text-[#6BA3FF] font-mono font-medium">{initials}</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">{displayName}</p>
              <Badge variant="success" size="sm">LENDER</Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 2 }}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  transition-all duration-200
                  ${isActive
                    ? 'text-white bg-[rgba(79,142,247,0.12)] border-l-[3px] border-[#4F8EF7] pl-[9px]'
                    : 'text-white/60 hover:text-white hover:bg-[rgba(255,255,255,0.04)]'}
                `}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </motion.button>
            );
          })}

          {/* Separator */}
          <div className="pt-2">
            <div className="h-px bg-[rgba(255,255,255,0.05)] mb-2" />
            <button className="w-full flex items-center gap-3 px-3 py-2 text-white/40 rounded-lg text-sm cursor-not-allowed opacity-50">
              <Settings size={18} />
              <span>Settings</span>
              <Badge variant="glass" size="sm" className="ml-auto">Soon</Badge>
            </button>
          </div>
        </nav>

        {/* KYC status */}
        <div className="px-4 pb-2">
          <div className="bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)] rounded-lg p-3 flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#10B981] flex-shrink-0" />
            <div>
              <p className="text-[10px] text-[#10B981] font-medium">KYC Verified</p>
              <p className="text-[10px] text-white/30">PAN + Aadhaar ✅</p>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.05)]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-60 pt-24">
        <div className="p-6 lg:p-8 pb-32">

          {/* Top bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display font-bold text-2xl md:text-3xl text-white">
                Welcome back, {displayName} 👋
              </h1>
              <p className="text-white/40 text-sm mt-1">{currentDate}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white/70 transition-all"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <Button icon={<ArrowUpRight size={16} />} onClick={() => setWalletOpen(true)}>
                Deposit Funds
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader size={32} className="animate-spin text-[#4F8EF7]" />
            </div>
          ) : (
            <>
              {/* ── Mini Stats (same grid as Dashboard.jsx) ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Wallet Balance',    value: formatINR(walletBal),   icon: <Wallet size={16} />,      variant: 'accent' },
                  { label: 'Pool Contribution', value: formatINR(poolContrib), icon: <TrendingUp size={16} />,  variant: 'success' },
                  { label: 'Est. Annual Yield', value: formatINR(estYield),    icon: <ArrowUpRight size={16} />,variant: 'warning' },
                  { label: 'Total Pool Size',   value: formatINR(poolTotal),   icon: <Users size={16} />,       variant: 'glass' },
                ].map(s => (
                  <Card key={s.label} padding="sm" hover={false}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/40 text-xs mb-1">{s.label}</p>
                        <p className="text-white font-semibold text-xl">{s.value}</p>
                      </div>
                      <Badge variant={s.variant} size="sm">{s.icon}</Badge>
                    </div>
                  </Card>
                ))}
              </div>

              {/* ── Two column grid ── */}
              <div className="grid lg:grid-cols-2 gap-6 mb-6">

                {/* KYC Card */}
                <Card>
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#10B981]" /> Identity Status
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'PAN Verification',    verified: profile?.isPanVerified },
                      { label: 'Aadhaar Verification', verified: profile?.isAadhaarVerified },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0">
                        <span className="text-white/60 text-sm">{item.label}</span>
                        <Badge variant={item.verified ? 'success' : 'warning'} size="sm">
                          {item.verified ? '✅ Verified' : '⏳ Pending'}
                        </Badge>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-white/60 text-sm">Fabric ID</span>
                      <span className="text-white/40 text-xs font-mono">{profile?.fabricId}</span>
                    </div>
                  </div>
                </Card>

                {/* Pool Stats */}
                <Card>
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#4F8EF7]" /> Lending Pool
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Your Contribution', value: formatINR(poolContrib), color: '#4F8EF7' },
                      { label: 'Estimated APY',     value: '14%',                  color: '#10B981' },
                      { label: 'Est. Year Return',  value: formatINR(estYield),    color: '#F59E0B' },
                      { label: 'Pool Total',        value: formatINR(poolTotal),   color: '#9333EA' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0">
                        <span className="text-white/60 text-sm">{item.label}</span>
                        <span className="font-semibold text-sm" style={{ color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* ── Transaction History ── */}
              <Card>
                <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                  <History size={18} className="text-white/40" /> Transaction History
                </h3>
                {txHistory.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-white/30 text-sm">No transactions yet</p>
                    <p className="text-white/20 text-xs mt-1">Use the "Deposit Funds" button to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {txHistory.map((tx, i) => {
                      const isIn = tx.type === 'REPAYMENT' || tx.type === 'WITHDRAW';
                      return (
                        <div
                          key={tx._id || i}
                          className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0"
                        >
                          <Badge
                            variant={isIn ? 'success' : tx.type === 'DEPOSIT' ? 'accent' : 'glass'}
                            size="sm"
                          >
                            {tx.type}
                          </Badge>
                          <span className="text-white/60 text-sm flex-1">
                            {tx.type === 'DEPOSIT' ? 'Deposited to pool'
                              : tx.type === 'REPAYMENT' ? 'Repayment received'
                              : tx.type === 'WITHDRAW' ? 'Withdrawn from pool'
                              : tx.type}
                          </span>
                          <span className="text-white font-mono text-sm">
                            {isIn ? '+' : '-'}{formatINR(tx.amount)}
                          </span>
                          <span className="text-white/30 text-xs hidden md:block">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </main>

      {/* ── Floating Wallet Button ──────────────────────────────────── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setWalletOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-2xl flex items-center justify-center bg-[#4F8EF7] hover:bg-[#6BA3FF] shadow-[0_8px_30px_rgba(79,142,247,0.45)] transition-colors"
        title="Open Wallet"
      >
        <Wallet size={22} className="text-white" />
      </motion.button>

      {/* ── Wallet Drawer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {walletOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setWalletOpen(false); setDepositMsg(null); }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col bg-[rgba(6,15,36,0.98)] backdrop-blur-xl border-l border-white/10"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-[#4F8EF7]" />
                  <span className="font-semibold text-white">Lender Wallet</span>
                </div>
                <button
                  onClick={() => { setWalletOpen(false); setDepositMsg(null); }}
                  className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Balance */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 text-sm mb-1">Available Balance</p>
                  <p className="text-4xl font-bold text-white mb-1">{formatINR(walletBal)}</p>
                  <p className="text-xs text-gray-500">Pool Contribution: {formatINR(poolContrib)}</p>
                </div>

                {/* Deposit */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                  <h3 className="text-white font-medium flex items-center gap-2 text-sm">
                    <ArrowUpRight size={16} className="text-[#10B981]" /> Deposit to Pool
                  </h3>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                    <input
                      type="number"
                      value={depositAmt}
                      onChange={e => { setDepositAmt(e.target.value); setDepositMsg(null); }}
                      placeholder="Enter amount"
                      className="w-full pl-7 pr-4 py-2 text-white bg-white/5 border border-white/10 rounded-lg placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors text-sm"
                    />
                  </div>
                  {/* Quick amounts */}
                  <div className="grid grid-cols-3 gap-2">
                    {[500, 1000, 2500].map(q => (
                      <button key={q}
                        onClick={() => setDepositAmt(String(q))}
                        className="py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/5 border border-white/10 hover:border-[#4F8EF7]/50 rounded-lg transition-all">
                        ₹{q.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleDeposit}
                    disabled={depositLoading || !depositAmt}
                    className="w-full bg-gradient-to-r from-[#4F8EF7] to-[#9333EA] hover:from-[#3a7dd8] hover:to-[#7c2db8] text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {depositLoading
                      ? <><Loader size={14} className="animate-spin" /> Processing via Razorpay…</>
                      : <><ArrowUpRight size={14} /> Deposit to Pool</>}
                  </button>
                  {depositMsg && (
                    <div className={`p-3 rounded-lg text-sm ${depositMsg.ok ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981]' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                      {depositMsg.text}
                    </div>
                  )}
                </div>

                {/* Info box */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-3">
                    <strong>🔒 Secured by Hyperledger Fabric</strong>
                  </p>
                  {[
                    ['Annual Yield', '14% APY'],
                    ['Risk',         'Low (AI-screened borrowers)'],
                    ['Gateway',      'Mock Razorpay'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
                      <span className="text-gray-500">{k}</span>
                      <span className="text-gray-300">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
