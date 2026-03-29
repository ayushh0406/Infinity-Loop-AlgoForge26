import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, CheckCircle, TrendingUp, User } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Register = () => {
  const [step, setStep] = useState(0); // 0=role, 1=info, 2=PAN, 3=Aadhaar
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', pan: '', panOtp: '', aadhaar: '', aadhaarOtp: '' });
  const [refIds, setRefIds] = useState({ pan: '', aadhaar: '' });
  const [verified, setVerified] = useState({ pan: false, aadhaar: false });
  const [errors, setErrors] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleBasicSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return setErrors('All fields required.');
    setErrors(''); setStep(2);
  };

  const sendOtp = async (type) => {
    setErrors('');
    const field = type === 'pan' ? formData.pan : formData.aadhaar;
    const regex = type === 'pan' ? /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ : /^[0-9]{12}$/;
    if (!regex.test(field)) return setErrors(type === 'pan' ? 'Invalid PAN (e.g. ABCDE1234F)' : 'Invalid Aadhaar (12 digits)');
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/kyc/initiate-${type}`, { [type]: field });
      setRefIds({ ...refIds, [type]: res.data.referenceId });
      alert(res.data.msg);
    } catch (err) { setErrors(err.response?.data?.msg || 'Error'); } 
    finally { setLoading(false); }
  };

  const verifyOtp = async (type) => {
    setErrors('');
    try {
      setLoading(true);
      await axios.post(`${API_URL}/kyc/verify-${type}`, { otp: formData[`${type}Otp`], referenceId: refIds[type] });
      setVerified({ ...verified, [type]: true });
    } catch (err) { setErrors(err.response?.data?.msg || 'Invalid OTP. Use 9876'); }
    finally { setLoading(false); }
  };

  const completeRegistration = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, { name: formData.name, email: formData.email, password: formData.password, role });
      alert(`✅ Registration complete! Your identity has been committed to the Hyperledger Fabric network.`);
      navigate('/login');
    } catch (err) { setErrors(err.response?.data?.msg || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 outline-none transition";

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-600 p-3 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-1">Join TrustPool AI</h2>
        <p className="text-center text-slate-400 text-sm mb-6">Decentralized micro-lending on Hyperledger Fabric</p>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {['Role', 'Info', 'PAN', 'Aadhaar'].map((s, i) => (
            <div key={s} className={`flex items-center gap-2 text-xs ${step >= i ? 'text-indigo-400' : 'text-slate-600'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${step >= i ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-slate-700 text-slate-600'}`}>{i+1}</span>
              {s}
              {i < 3 && <span className="text-slate-700">›</span>}
            </div>
          ))}
        </div>

        {errors && <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 mb-5 rounded-lg text-sm">{errors}</div>}

        {/* STEP 0: Role Selection */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-slate-300 text-center font-medium mb-2">I want to join as a...</p>

            {/* Lender Card */}
            <button onClick={() => { setRole('lender'); setStep(1); }}
              className="w-full group border-2 border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/5 rounded-2xl p-5 text-left transition duration-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500/10 px-3 py-1 rounded-bl-xl text-emerald-400 text-xs font-bold">LENDER</div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-base">Deposit & Earn</p>
                  <p className="text-slate-400 text-xs mt-0.5">Add funds to the pool · 9–14% APY · Lock-free liquidity</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Starting wallet</span>
                <span className="text-2xl font-black text-emerald-400">₹10,000</span>
              </div>
            </button>

            {/* Borrower Card */}
            <button onClick={() => { setRole('borrower'); setStep(1); }}
              className="w-full group border-2 border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5 rounded-2xl p-5 text-left transition duration-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-500/10 px-3 py-1 rounded-bl-xl text-indigo-400 text-xs font-bold">BORROWER</div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition">
                  <User className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-base">Borrow from Pool</p>
                  <p className="text-slate-400 text-xs mt-0.5">No CIBIL needed · UPI-based scoring · Instant disbursal</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Starting wallet</span>
                <span className="text-2xl font-black text-indigo-400">₹0</span>
              </div>
            </button>

            <p className="text-center text-slate-500 text-xs pt-2">
              Already have an account? <a href="/login" className="text-indigo-400 hover:underline">Login</a>
            </p>
          </div>
        )}


        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <form onSubmit={handleBasicSubmit} className="space-y-4">
            <div className="mb-2 p-2 text-center text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              Registering as: <span className="font-bold capitalize">{role}</span>
            </div>
            {['name', 'email', 'password'].map(field => (
              <div key={field}>
                <label className="block text-slate-300 mb-1 text-sm font-medium capitalize">{field === 'name' ? 'Full Name' : field}</label>
                <input type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  name={field} value={formData[field]} onChange={handleChange} className={inputClass} required />
              </div>
            ))}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition mt-2">Continue to PAN Verification →</button>
          </form>
        )}

        {/* STEP 2: PAN */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">PAN Verification</h3>
              {verified.pan && <CheckCircle className="text-emerald-500 w-5 h-5" />}
            </div>
            <div className="flex gap-2">
              <input type="text" name="pan" value={formData.pan} onChange={handleChange} disabled={verified.pan || !!refIds.pan}
                className={`${inputClass} uppercase flex-1 disabled:opacity-50`} placeholder="ABCDE1234F" />
              {!refIds.pan && <button onClick={() => sendOtp('pan')} disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 rounded-lg font-medium">Send OTP</button>}
            </div>
            {refIds.pan && !verified.pan && (
              <div className="flex gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <input type="text" name="panOtp" value={formData.panOtp} onChange={handleChange}
                  className="flex-1 bg-slate-800 border border-slate-600 text-white rounded p-2 outline-none" placeholder="OTP (Demo: 9876)" />
                <button onClick={() => verifyOtp('pan')} disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded font-medium disabled:opacity-50">Verify</button>
              </div>
            )}
            {verified.pan && (
              <button onClick={() => setStep(3)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition">
                Next: Aadhaar Verification →
              </button>
            )}
          </div>
        )}

        {/* STEP 3: Aadhaar */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Aadhaar Verification</h3>
              {verified.aadhaar && <CheckCircle className="text-emerald-500 w-5 h-5" />}
            </div>
            <div className="flex gap-2">
              <input type="text" name="aadhaar" value={formData.aadhaar} onChange={handleChange} disabled={verified.aadhaar || !!refIds.aadhaar}
                className={`${inputClass} flex-1 disabled:opacity-50`} placeholder="12-digit Aadhaar" maxLength="12" />
              {!refIds.aadhaar && <button onClick={() => sendOtp('aadhaar')} disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 rounded-lg font-medium">Send OTP</button>}
            </div>
            {refIds.aadhaar && !verified.aadhaar && (
              <div className="flex gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <input type="text" name="aadhaarOtp" value={formData.aadhaarOtp} onChange={handleChange}
                  className="flex-1 bg-slate-800 border border-slate-600 text-white rounded p-2 outline-none" placeholder="OTP (Demo: 9876)" />
                <button onClick={() => verifyOtp('aadhaar')} disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded font-medium disabled:opacity-50">Verify</button>
              </div>
            )}
            {verified.aadhaar && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center mt-4">
                <CheckCircle className="text-emerald-500 w-8 h-8 mx-auto mb-2" />
                <p className="text-emerald-300 font-medium text-sm">Identity Fully Verified</p>
                <p className="text-slate-400 text-xs mt-1">Your fabricId will be committed to the Hyperledger Fabric ledger</p>
                <button onClick={completeRegistration} disabled={loading}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
                  {loading ? '⛓ Committing to Blockchain...' : '✅ Complete Registration'}
                </button>
              </div>
            )}
          </div>
        )}

        {step >= 1 && (
          <p className="mt-6 text-center text-slate-500 text-sm">
            Already have an account? <a href="/login" className="text-indigo-400 hover:text-indigo-300">Login</a>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
