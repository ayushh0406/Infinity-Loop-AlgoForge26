import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Wallet, ArrowDownCircle, LogOut, ExternalLink, Database } from 'lucide-react';
import MockRazorpay from '../components/MockRazorpay';

const API = 'http://localhost:5000/api';

const LenderDashboard = () => {
  const [user, setUser] = useState(null);
  const [pool, setPool] = useState(null);
  const [txns, setTxns] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showRazorpay, setShowRazorpay] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [profileRes, poolRes, histRes] = await Promise.all([
        axios.get(`${API}/auth/profile`, { headers }),
        axios.get(`${API}/payments/pool`, { headers }),
        axios.get(`${API}/payments/history`, { headers })
      ]);
      setUser(profileRes.data);
      setPool(poolRes.data);
      setTxns(histRes.data);
    } catch {
      navigate('/login');
    }
  };

  useEffect(() => { if (!token) navigate('/login'); else fetchData(); }, []);

  const handleDepositInitiate = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setMsg('Enter a valid amount');
    setShowRazorpay(true);
    setMsg('');
  };

  const processDeposit = async (paymentDetails) => {
    setShowRazorpay(false);
    setLoading(true); setMsg('Synching payment with Fabric Ledger...');
    try {
      const res = await axios.post(`${API}/payments/deposit`, { amount: Number(amount), paymentId: paymentDetails.paymentId }, { headers });
      setMsg(res.data.msg);
      setAmount('');
      await fetchData();
    } catch (err) {
      setMsg(err.response?.data?.msg || 'Deposit failed on backend');
    } finally { setLoading(false); }
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  if (!user) return <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-emerald-400" /> Lender Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">Welcome back, {user.name}</p>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-red-400 flex items-center gap-1 text-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">My Wallet</p>
            <p className="text-3xl font-bold text-emerald-400">₹{(user.walletBalance || 0).toLocaleString()}</p>
            <p className="text-slate-500 text-xs mt-2">Available to deposit</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">My Pool Contribution</p>
            <p className="text-3xl font-bold text-indigo-400">₹{(user.poolContribution || 0).toLocaleString()}</p>
            <p className="text-slate-500 text-xs mt-2">Earning 9-14% APY</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/5">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">TrustPool Total</p>
            <p className="text-3xl font-bold text-white">₹{pool ? pool.totalBalance.toLocaleString() : '...'}</p>
            <p className="text-emerald-400 text-xs mt-2">Community liquidity pool</p>
          </div>
        </div>

        {/* Fabric ID */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Database className="text-purple-400 w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Hyperledger Fabric Identity</p>
            <p className="text-purple-300 font-mono text-sm">{user.fabricId}</p>
          </div>
          <span className="ml-auto text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">On-Chain ✓</span>
        </div>

        {/* Deposit Box */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ArrowDownCircle className="text-emerald-400 w-5 h-5" /> Deposit to Pool</h2>
          <p className="text-slate-400 text-sm mb-4">Your deposit goes into the community lending pool (via <span className="text-orange-400">Razorpay</span> mock gateway) and gets recorded on the Fabric ledger.</p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-4 py-3 text-white outline-none focus:border-emerald-500" />
            </div>
            <button onClick={handleDepositInitiate} disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 rounded-lg transition shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              {loading ? 'Processing...' : 'Deposit'}
            </button>
          </div>
          {msg && <p className={`mt-3 text-sm ${msg.includes('₹') ? 'text-emerald-400' : 'text-orange-400'}`}>{msg}</p>}
        </div>

        {/* Transaction History */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Wallet className="text-indigo-400 w-5 h-5" /> Transaction History</h2>
          {txns.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No transactions yet. Make your first deposit!</p>
          ) : (
            <div className="space-y-3">
              {txns.slice(0, 5).map(tx => (
                <div key={tx._id} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${tx.type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {tx.type === 'DEPOSIT' ? '↓' : '↑'}
                    </span>
                    <div>
                      <p className="text-white text-sm font-medium">{tx.type}</p>
                      <p className="text-slate-500 text-xs">{new Date(tx.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {tx.type === 'DEPOSIT' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                    </p>
                    {tx.fabricTxId && (
                      <p className="text-purple-400 text-xs font-mono flex items-center gap-1 justify-end">
                        <ExternalLink className="w-3 h-3" />{tx.fabricTxId}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {showRazorpay && (
        <MockRazorpay 
          amount={Number(amount)} 
          email={user.email} 
          onSuccess={processDeposit}
          onClose={() => setShowRazorpay(false)} 
        />
      )}
    </div>
  );
};

export default LenderDashboard;
