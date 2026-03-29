import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, User as UserIcon, LogOut, Wallet } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (err) {
        console.error(err);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <div className="text-center mt-20 text-slate-400">Loading Dashboard...</div>;
  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto pt-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-emerald-400 w-8 h-8" />
          TrustPool AI Dashboard
        </h1>
        <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-6 relative">
            <div className="bg-slate-700 p-4 rounded-full">
              <UserIcon className="w-10 h-10 text-slate-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
              <p className="text-slate-400">{profile.email}</p>
            </div>
          </div>
          
          <div className="space-y-4">
             <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">PAN Verification</span>
                {profile.isPanVerified ? 
                  <span className="text-emerald-400 font-medium">Verified ✅</span> : 
                  <span className="text-amber-400 font-medium">Pending ⏳</span>
                }
             </div>
             <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Aadhaar Verification</span>
                {profile.isAadhaarVerified ? 
                  <span className="text-emerald-400 font-medium">Verified ✅</span> : 
                  <span className="text-amber-400 font-medium">Pending ⏳</span>
                }
             </div>
          </div>
        </div>

        {/* Hyperledger Link Card */}
        <div className="bg-slate-800 border fill-indigo-900/20 border-indigo-500/30 rounded-xl p-6 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
          <div className="flex items-center gap-3 mb-4">
             <Wallet className="w-7 h-7 text-indigo-400" />
             <h2 className="text-xl font-bold text-white">TrustPool Identity</h2>
          </div>
          <p className="text-slate-400 mb-6 text-sm">
             Your account is securely linked to the Hyperledger Fabric Reputation Ledger. This unique ID is used to track your behavior score.
          </p>
          
          <div className="bg-slate-900 p-4 rounded relative overflow-hidden group">
             <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="text-xs text-indigo-300 mb-1 font-mono uppercase tracking-wider">Fabric Address</div>
             <div className="font-mono text-white text-lg tracking-wide">{profile.fabricId}</div>
          </div>

          <div className="mt-6 flex gap-3">
             <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full text-xs font-medium">
               Score: Pending
             </div>
             <div className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-full text-xs font-medium">
               Tier 1 Pool Access
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
