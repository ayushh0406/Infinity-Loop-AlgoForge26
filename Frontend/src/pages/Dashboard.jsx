import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ScoreRing from '../components/ui/ScoreRing';
import RegistrationModal from '../components/RegistrationModal';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { borrowerService } from '../services/borrowerService';
import { PROFILES, ACTIVITY_FEED } from '../utils/mockData';
import { formatCurrency } from '../utils/formatters';
import { 
  LayoutDashboard, 
  Star, 
  CreditCard, 
  Wallet, 
  Link as LinkIcon, 
  Settings, 
  LogOut,
  ArrowRight,
  TrendingUp,
  Zap,
  RefreshCw,
  Phone,
  MapPin,
  X,
  Loader,
  CheckCircle,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

const BACKEND = 'http://localhost:5000';
const getToken = () => localStorage.getItem('auth_token');

/**
 * Dashboard Page
 * User dashboard with sidebar navigation
 */

// Navigation items
const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'score', label: 'My Score', icon: Star },
  { id: 'loans', label: 'My Loans', icon: CreditCard },
  { id: 'deposits', label: 'My Deposits', icon: Wallet, lenderOnly: true },
  { id: 'ledger', label: 'Ledger', icon: LinkIcon, href: '/ledger' },
  { id: 'settings', label: 'Settings', icon: Settings, disabled: true }
];

// Quick actions
const quickActions = [
  { icon: Star, label: 'Check Score', href: '/score' },
  { icon: CreditCard, label: 'Apply Loan', href: '/score' },
  { icon: LinkIcon, label: 'View Ledger', href: '/ledger' },
  { icon: Wallet, label: 'Lend Funds', href: '/pool' }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const { data: wsData, isConnected } = useWebSocket(user?.id);
  const [realtimeData, setRealtimeData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [borrowerData, setBorrowerData] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [loading, setLoading] = useState(false);

  // Loan request modal
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState(10000);
  const [loanReason, setLoanReason] = useState('');

  // Real-time loan/wallet data from backend
  const [myLoans, setMyLoans] = useState([]);
  const [myEmis, setMyEmis] = useState([]);
  const [walletBal, setWalletBal] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [payingEmi, setPayingEmi] = useState(null);

  // Fetch real-time loan data
  useEffect(() => {
    const fetchLoanData = async () => {
      const token = getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [loansRes, emisRes, profileRes, histRes] = await Promise.all([
          fetch(`${BACKEND}/api/payments/my-loans`, { headers }),
          fetch(`${BACKEND}/api/payments/my-emis`, { headers }),
          fetch(`${BACKEND}/api/auth/profile`, { headers }),
          fetch(`${BACKEND}/api/payments/history`, { headers }),
        ]);
        if (loansRes.ok) setMyLoans(await loansRes.json());
        if (emisRes.ok) setMyEmis(await emisRes.json());
        if (profileRes.ok) { const p = await profileRes.json(); setWalletBal(p.walletBalance); }
        if (histRes.ok) setRecentTxns(await histRes.json());
      } catch {}
    };
    fetchLoanData();
    const id = setInterval(fetchLoanData, 10000);
    return () => clearInterval(id);
  }, []);

  // Check if need to show registration modal
  useEffect(() => {
    const checkProfileCompletion = async () => {
      try {
        setLoading(true);
        const profile = await borrowerService.getBorrowerProfile(user?.id);
        
        if (profile) {
          setBorrowerData(profile);
          setShowRegistration(false);
        } else {
          setShowRegistration(!searchParams.get('skip'));
        }
      } catch (error) {
        console.log('Profile check:', error.message);
        setShowRegistration(true);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      checkProfileCompletion();
    }
  }, [user?.id, searchParams]);

  // Update real-time data when WebSocket receives data
  useEffect(() => {
    if (wsData?.current_user) {
      setRealtimeData(wsData.current_user);
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [wsData]);

  // Map user type to profile data
  const getUserTypeContent = () => {
    // Use greeting with real name
    const firstName = user?.name?.split(' ')[0] || 'there';
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const type = user?.type?.toLowerCase();
    if (type?.includes('student')) {
      return {
        greeting: `${timeGreet}, ${firstName}. 👋`,
        profile: PROFILES.student,
        icon: '🎓',
        color: '#4AF87F'
      };
    } else if (type?.includes('gig')) {
      return {
        greeting: `${timeGreet}, ${firstName}. 👋`,
        profile: PROFILES.gig_worker,
        icon: '🛺',
        color: '#FFB84D'
      };
    } else {
      return {
        greeting: `${timeGreet}, ${firstName}. 👋`,
        profile: PROFILES.salaried || PROFILES.gig_worker,
        icon: '💼',
        color: '#4F8EF7'
      };
    }
  };

  const content = getUserTypeContent();
  const profile = realtimeData ? {
    ...content.profile,
    score: Math.round(realtimeData.trust_score)
  } : content.profile;

  const isLender = false; // Demo as borrower

  // Current date
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleRegistrationComplete = () => {
    setShowRegistration(false);
    // Refresh borrower data
    borrowerService.getBorrowerProfile(user?.id).then(data => {
      if (data) setBorrowerData(data);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#020817] flex"
    >
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-[rgba(6,15,36,0.95)] border-r border-[rgba(255,255,255,0.05)] backdrop-blur-xl fixed top-16 z-30 h-[calc(100vh-64px)]">


        {/* User Card */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[rgba(79,142,247,0.2)] flex items-center justify-center">
              <span className="text-[#6BA3FF] font-mono font-medium text-sm">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user?.name || 'User'}</p>
              <Badge variant="accent" size="sm">{(user?.role || 'BORROWER').toUpperCase()}</Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            if (item.lenderOnly && !isLender) return null;
            
            const isActive = activeTab === item.id;
            const isDisabled = item.disabled;

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    transition-all duration-200
                    text-white/60 hover:text-white hover:bg-[rgba(255,255,255,0.04)]
                  `}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <motion.button
                key={item.id}
                whileHover={!isDisabled ? { x: 2 } : {}}
                onClick={() => !isDisabled && setActiveTab(item.id)}
                disabled={isDisabled}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  transition-all duration-200
                  ${isActive 
                    ? 'text-white bg-[rgba(79,142,247,0.12)] border-l-[3px] border-[#4F8EF7] pl-[9px]' 
                    : 'text-white/60 hover:text-white hover:bg-[rgba(255,255,255,0.04)]'}
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {isDisabled && (
                  <Badge variant="glass" size="sm" className="ml-auto">Soon</Badge>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.05)]">
          <button className="flex items-center gap-3 px-3 py-2 text-white/40 hover:text-white/60 text-sm transition-colors">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 pt-24">
        <div className="p-6 lg:p-8">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-white">
                {content.greeting}
              </h1>
              <p className="text-white/40 text-sm mt-2">{currentDate}</p>
              {/* WebSocket Status */}
              {isConnected && (
                <div className="flex items-center gap-2 mt-2 text-xs text-[#10B981]">
                  <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                  <span>Real-time updates active {lastUpdate && `(${lastUpdate})`}</span>
                </div>
              )}
            </div>
            <Button icon={<ArrowRight size={16} />} onClick={() => setShowLoanModal(true)}>
              Request Loan
            </Button>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <MiniStatCard
              label="Trust Score"
              value={profile.score}
              icon={<MiniScoreIcon score={profile.score} />}
            />
            <MiniStatCard
              label="Active Loans"
              value={myLoans.filter(l => l.status === 'ACTIVE').length}
            />
            <MiniStatCard
              label="Total Borrowed"
              value={myLoans.filter(l => l.status !== 'DECLINED').reduce((s, l) => s + l.amount, 0) > 0 ? formatCurrency(myLoans.filter(l => l.status !== 'DECLINED').reduce((s, l) => s + l.amount, 0)) : '₹0'}
            />
            <MiniStatCard
              label="Wallet Balance"
              value={walletBal !== null ? formatCurrency(walletBal) : '—'}
            />
          </div>

          {/* Two Column Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Real-time All Users */}
            {wsData?.all_users && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                    <Zap size={18} className="text-[#FFB84D]" />
                    Live Dashboard
                  </h3>
                  <Badge 
                    variant={isConnected ? "success" : "glass"} 
                    size="sm"
                    className="animate-pulse"
                  >
                    {isConnected ? '● LIVE' : '○ Offline'}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'student', name: '🎓 Student', color: '#4AF87F' },
                    { id: 'gig_worker', name: '🛺 Gig Worker', color: '#FFB84D' },
                    { id: 'salaried', name: '💼 Salaried', color: '#4F8EF7' }
                  ].map((userType) => {
                    const userData = wsData.all_users[userType.id];
                    if (!userData) return null;
                    return (
                      <motion.div
                        key={userType.id}
                        whileHover={{ x: 2 }}
                        className="p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg hover:border-[rgba(255,255,255,0.15)] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{userType.name.split(' ')[0]}</span>
                            <div>
                              <p className="text-white/80 text-sm font-medium">{userType.name}</p>
                              <p className="text-white/40 text-xs">{userData.user_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{Math.round(userData.trust_score)}</p>
                            <p className="text-white/40 text-xs">Score</p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)] text-xs text-white/60 space-y-1">
                          <div className="flex justify-between">
                            <span>Loan Eligible:</span>
                            <span className="text-white">{formatCurrency(userData.eligible_loan_amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rate:</span>
                            <span className="text-white">{userData.interest_rate}%</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <p className="text-xs text-white/40 mt-4">
                  Updates every 2 seconds when connected
                </p>
              </Card>
            )}

            {/* Recent Activity — real-time */}
            <Card>
              <h3 className="text-white font-semibold text-lg mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {(recentTxns.length > 0 ? recentTxns.slice(0, 5) : ACTIVITY_FEED.slice(0, 5)).map((activity, index) => {
                  const isBackend = !!activity.type; // backend tx has .type uppercase
                  const type = isBackend ? activity.type.toLowerCase() : activity.type;
                  const amount = activity.amount;
                  return (
                    <div 
                      key={activity._id || activity.id || index}
                      className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0"
                    >
                      <Badge 
                        variant={type === 'deposit' || type === 'repayment' ? 'success' : type === 'loan' || type === 'withdraw' ? 'accent' : 'glass'}
                        size="sm"
                      >
                        {type}
                      </Badge>
                      <span className="text-white/60 text-sm flex-1">
                        {type === 'repayment' ? 'EMI payment' : 
                         type === 'loan' || type === 'withdraw' ? 'Loan disbursed' : 
                         type === 'deposit' ? 'Pool deposit' : type}
                      </span>
                      <span className="text-white font-mono text-sm">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link 
                to="/ledger" 
                className="inline-flex items-center gap-1 text-[#6BA3FF] text-sm mt-4 hover:underline"
              >
                View Full Ledger <ArrowRight size={14} />
              </Link>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-white font-semibold text-lg mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link key={action.label} to={action.href}>
                    <motion.div
                      whileHover={{ y: -2, borderColor: 'rgba(79,142,247,0.3)' }}
                      className="p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl cursor-pointer transition-colors"
                    >
                      <action.icon size={20} className="text-[#4F8EF7] mb-2" />
                      <span className="text-white/80 text-sm">{action.label}</span>
                      <ArrowRight size={14} className="text-white/30 mt-2" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* Score History Chart */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">Score History — Last 6 Months</h3>
              <div className="flex items-center gap-2 text-[#10B981] text-sm">
                <TrendingUp size={16} />
                <span>+12 points</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profile.scoreHistory}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F8EF7" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#4F8EF7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(6,15,36,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                    itemStyle={{ color: '#4F8EF7' }}
                    formatter={(value) => [`Score: ${value}`, '']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#4F8EF7"
                    strokeWidth={2.5}
                    dot={{ fill: '#4F8EF7', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#4F8EF7', stroke: 'white', strokeWidth: 2 }}
                    fill="url(#scoreGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </main>

      {/* Registration Modal */}
      {!loading && <RegistrationModal user={user} isOpen={showRegistration} onComplete={handleRegistrationComplete} />}

      {/* ── Loan Request Modal ── */}
      <AnimatePresence>
        {showLoanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLoanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md mx-4 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(6,15,36,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h3 className="text-white font-semibold text-lg">Request a Loan</h3>
                <button onClick={() => setShowLoanModal(false)} className="text-white/40 hover:text-white/70">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Amount */}
                <div>
                  <label className="text-white/50 text-sm mb-2 block">Loan Amount (₹)</label>
                  <div className="flex items-baseline gap-1 border-b border-white/10 pb-2">
                    <span className="text-white/40 text-xl font-mono">₹</span>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={e => setLoanAmount(Number(e.target.value) || 0)}
                      className="bg-transparent text-white font-mono text-2xl font-bold w-full focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[5000, 10000, 20000, 50000].map(a => (
                      <button
                        key={a}
                        onClick={() => setLoanAmount(a)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          loanAmount === a
                            ? 'bg-[#4F8EF7] text-white'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        ₹{a.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="text-white/50 text-sm mb-2 block">Reason for Loan</label>
                  <textarea
                    value={loanReason}
                    onChange={e => setLoanReason(e.target.value)}
                    placeholder="e.g., Medical emergency, Education fees, Business expansion..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#4F8EF7]/50 placeholder:text-white/20 resize-none"
                  />
                </div>

                <Button
                  fullWidth
                  icon={<ArrowRight size={18} />}
                  onClick={() => {
                    if (!loanAmount || loanAmount <= 0) {
                      addToast({ message: 'Enter a valid amount', type: 'error' });
                      return;
                    }
                    setShowLoanModal(false);
                    navigate('/aa-verify', { state: { loanAmount, loanReason } });
                  }}
                >
                  Proceed to AA Verification
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── My EMIs Floating Panel (when loans tab active) ── */}
      {activeTab === 'loans' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveTab('overview')}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto rounded-2xl"
            style={{ background: 'rgba(6,15,36,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0" style={{ background: 'rgba(6,15,36,0.98)' }}>
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <CreditCard size={18} className="text-[#4F8EF7]" />
                My Loans & EMIs
              </h3>
              <button onClick={() => setActiveTab('overview')} className="text-white/40 hover:text-white/70">
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {myLoans.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">No loans yet. Request your first loan!</p>
              ) : (
                myLoans.filter(l => l.status !== 'DECLINED').map(loan => (
                  <div key={loan._id} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">₹{loan.amount?.toLocaleString('en-IN')}</p>
                        <p className="text-white/40 text-xs">{loan.interestRate}% · {loan.tenure} months</p>
                      </div>
                      <Badge variant={loan.status === 'ACTIVE' ? 'accent' : loan.status === 'COMPLETED' ? 'success' : 'glass'} size="sm">
                        {loan.status}
                      </Badge>
                    </div>

                    {/* EMI progress */}
                    {loan.emis && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white/40">
                          <span>EMIs Paid</span>
                          <span>{loan.emis.filter(e => e.status === 'PAID').length}/{loan.emis.length}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#4F8EF7] to-[#10B981] rounded-full transition-all"
                            style={{ width: `${(loan.emis.filter(e => e.status === 'PAID').length / loan.emis.length) * 100}%` }}
                          />
                        </div>

                        {/* Individual EMIs */}
                        {loan.status === 'ACTIVE' && (
                          <div className="mt-3 space-y-2">
                            {loan.emis.map((emi, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-2.5 bg-white/3 rounded-lg border border-white/5">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ background: emi.status === 'PAID' ? 'rgba(16,185,129,0.15)' : 'rgba(79,142,247,0.1)' }}>
                                  {emi.status === 'PAID'
                                    ? <CheckCircle size={13} className="text-[#10B981]" />
                                    : <Calendar size={13} className="text-[#4F8EF7]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white/70 text-xs">EMI #{idx + 1} — ₹{emi.amount?.toLocaleString('en-IN')}</p>
                                  <p className="text-white/30 text-[10px]">
                                    {emi.status === 'PAID'
                                      ? `Paid ${new Date(emi.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                                      : `Due ${new Date(emi.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                  </p>
                                </div>
                                {emi.status === 'PENDING' && (
                                  <button
                                    disabled={payingEmi === `${loan._id}-${idx}`}
                                    onClick={async () => {
                                      setPayingEmi(`${loan._id}-${idx}`);
                                      try {
                                        const r = await fetch(`${BACKEND}/api/payments/pay-emi`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                                          body: JSON.stringify({ loanId: loan._id, emiIndex: idx })
                                        });
                                        const d = await r.json();
                                        if (r.ok) addToast({ message: d.msg, type: 'success' });
                                        else addToast({ message: d.msg, type: 'error' });
                                      } catch { addToast({ message: 'Payment failed', type: 'error' }); }
                                      finally { setPayingEmi(null); }
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#4F8EF7] text-white hover:bg-[#3a7dd8] transition-all disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {payingEmi === `${loan._id}-${idx}` ? <Loader size={12} className="animate-spin" /> : <IndianRupee size={12} />}
                                    Pay
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Mini Stat Card
 */
function MiniStatCard({ label, value, icon }) {
  return (
    <Card padding="sm" hover={false}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs mb-1">{label}</p>
          <p className="text-white font-semibold text-xl">{value}</p>
        </div>
        {icon && <div>{icon}</div>}
      </div>
    </Card>
  );
}

/**
 * Mini Score Icon
 */
function MiniScoreIcon({ score }) {
  const color = score > 70 ? '#10B981' : score > 40 ? '#F59E0B' : '#EF4444';
  
  return (
    <div 
      className="w-10 h-10 rounded-full flex items-center justify-center"
      style={{ background: `${color}20` }}
    >
      <span className="font-mono text-sm font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}
