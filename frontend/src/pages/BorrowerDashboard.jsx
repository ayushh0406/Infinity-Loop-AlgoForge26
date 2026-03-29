import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Wallet, ArrowUpCircle, LogOut, ExternalLink, Database, AlertCircle } from 'lucide-react';
import MockRazorpay from '../components/MockRazorpay';

const API = 'http://localhost:5000/api';

const BorrowerDashboard = () => {
  const [user, setUser] = useState(null);
  const [pool, setPool] = useState(null);
  const [txns, setTxns] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
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

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) return setMsg('Enter a valid amount');
    setLoading(true); setMsg('');
    try {
      const res = await axios.post(`${API}/payments/withdraw`, { amount: Number(withdrawAmount) }, { headers });
      setMsg(res.data.msg);
      setWithdrawAmount('');
      await fetchData();
    } catch (err) {
      setMsg(err.response?.data?.msg || 'Withdrawal failed');
    } finally { setLoading(false); }
  };

  const handleRepayInitiate = () => {
    if (!repayAmount || isNaN(repayAmount) || Number(repayAmount) <= 0) return setMsg('Enter a valid amount');
    setShowRazorpay(true);
    setMsg('');
  };

  const processRepay = async (paymentDetails) => {
    setShowRazorpay(false);
    setLoading(true); setMsg('Synching repayment with Fabric Ledger...');
    try {
      const res = await axios.post(`${API}/payments/repay`, { amount: Number(repayAmount), paymentId: paymentDetails.paymentId }, { headers });
      setMsg(res.data.msg);
      setRepayAmount('');
      await fetchData();
    } catch (err) {
      setMsg(err.response?.data?.msg || 'Repayment failed on backend');
    } finally { setLoading(false); }
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  if (!user) return <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="text-indigo-400" /> Borrower Dashboard
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
            <p className="text-3xl font-bold text-indigo-400">₹{(user.walletBalance || 0).toLocaleString()}</p>
            <p className="text-slate-500 text-xs mt-2">Disbursed loan amount</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Pool Available</p>
            <p className="text-3xl font-bold text-emerald-400">₹{pool ? pool.totalBalance.toLocaleString() : '...'}</p>
            <p className="text-slate-500 text-xs mt-2">Community lending pool</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5 border border-indigo-500/30 bg-indigo-500/5">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Trust Score</p>
            <p className="text-3xl font-bold text-white">742</p>
            <p className="text-indigo-400 text-xs mt-2">Based on UPI behavior</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Withdraw Box */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowUpCircle className="text-indigo-400 w-5 h-5" /> Request Loan
            </h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="text-amber-400 w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300 text-xs text-left">
                Funds are instantly disbursed to your wallet via <span className="text-blue-300">Cashfree</span> payout mock.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-4 py-3 text-white outline-none focus:border-indigo-500" />
              </div>
              <button onClick={handleWithdraw} disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 rounded-lg transition">
                Withdraw
              </button>
            </div>
          </div>

          {/* Repay Box */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wallet className="text-emerald-400 w-5 h-5" /> Repay Loan
            </h2>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="text-emerald-400 w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-emerald-300 text-xs text-left">
                Return funds to the community pool via <span className="text-orange-400">Razorpay</span> gateway mock.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input type="number" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} placeholder="Amount"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-4 py-3 text-white outline-none focus:border-emerald-500" />
              </div>
              <button onClick={handleRepayInitiate} disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 rounded-lg transition shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                Repay
              </button>
            </div>
          </div>
        </div>
        
        {msg && <p className={`mb-6 text-center text-sm ${msg.includes('failed') || msg.includes('Insufficient') || msg.includes('Enter') ? 'text-red-400' : 'text-emerald-400'}`}>{msg}</p>}

        {/* Transaction History */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Wallet className="text-indigo-400 w-5 h-5" /> Transaction History</h2>
          {txns.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No transactions yet. Request your first loan!</p>
          ) : (
            <div className="space-y-3">
              {txns.slice(0, 5).map(tx => (
                <div key={tx._id} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${tx.type === 'WITHDRAW' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {tx.type === 'WITHDRAW' ? '↑' : '↓'}
                    </span>
                    <div>
                      <p className="text-white text-sm font-medium">{tx.type === 'WITHDRAW' ? 'LOAN DISBURSED' : 'LOAN REPAID'}</p>
                      <p className="text-slate-500 text-xs">{new Date(tx.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'WITHDRAW' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                      {tx.type === 'WITHDRAW' ? '+' : '-'}₹{tx.amount.toLocaleString()}
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
          amount={Number(repayAmount)} 
          email={user.email} 
          onSuccess={processRepay}
          onClose={() => setShowRazorpay(false)} 
        />
      )}
    </div>
  );
};

export default BorrowerDashboard;
