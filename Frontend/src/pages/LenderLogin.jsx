import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader, User, CreditCard, Fingerprint, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
  registerLender, loginUser,
  initiatePanVerification, verifyPanOtp,
  initiateAadhaarVerification, verifyAadhaarOtp,
} from '../services/apiService';

/**
 * Lender Login / KYC Flow
 * Step 0: Account (login or register)
 * Step 1: PAN verification
 * Step 2: Aadhaar verification
 * Step 3: Success
 */

const STEPS = ['Account', 'PAN', 'Aadhaar', 'Done'];

const slideVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
};

export default function LenderLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [step, setStep]         = useState(0);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  // Step 0
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [userEmail, setUserEmail] = useState('');
  const [alreadyKyc, setAlreadyKyc] = useState({ pan: false, aadhaar: false });

  // Step 1 – PAN (direct verify, no OTP)
  const [pan, setPan]         = useState('');
  const [panName, setPanName] = useState('');
  const [panDob, setPanDob]   = useState('');
  const [panRef, setPanRef]   = useState('');
  const [panDone, setPanDone] = useState(false);

  // Step 2 – Aadhaar
  const [aadhaar, setAadhaar]         = useState('');
  const [aadhaarRef, setAadhaarRef]   = useState('');
  const [aadhaarOtp, setAadhaarOtp]   = useState('');
  const [aadhaarSent, setAadhaarSent] = useState(false);

  /* ── Step 0 handler ─────────────────────────────────────────────── */
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      addToast({ message: 'Please fill all fields', type: 'error' }); return;
    }
    setLoading(true);
    try {
      let data;
      if (isSignUp) {
        if (!form.name) { addToast({ message: 'Name is required', type: 'error' }); return; }
        await registerLender({ name: form.name, email: form.email, password: form.password });
        addToast({ message: 'Account created! Logging you in…', type: 'success' });
        data = await loginUser(form.email, form.password);
      } else {
        data = await loginUser(form.email, form.password);
        if (data.user?.role !== 'lender') {
          addToast({ message: 'This is not a lender account. Please register first.', type: 'error' });
          setLoading(false); return;
        }
      }
      login(data);
      setUserEmail(form.email);
      const kyc = { pan: !!data.user?.isPanVerified, aadhaar: !!data.user?.isAadhaarVerified };
      setAlreadyKyc(kyc);
      if (kyc.pan && kyc.aadhaar) { setStep(3); }
      else { setStep(1); }
    } catch (err) {
      addToast({ message: err.message || 'Authentication failed', type: 'error' });
    } finally { setLoading(false); }
  };

  /* ── Step 1 – PAN (direct verify via Sandbox, no OTP) ─────────── */
  const handleVerifyPan = async () => {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      addToast({ message: 'Invalid PAN format. Example: ABCDE1234F', type: 'error' }); return;
    }
    if (!panName.trim()) {
      addToast({ message: 'Enter your name as per PAN card', type: 'error' }); return;
    }
    if (!panDob.trim()) {
      addToast({ message: 'Enter your date of birth', type: 'error' }); return;
    }
    setLoading(true);
    try {
      const res = await initiatePanVerification(pan, panName.trim(), panDob.trim());
      setPanRef(res.referenceId || '');
      setPanDone(true);
      addToast({ message: res.msg || 'PAN Verified ✅', type: 'success' });
      await verifyPanOtp('CONFIRM', res.referenceId || '', userEmail);
      alreadyKyc.aadhaar ? setStep(3) : setStep(2);
    } catch (err) {
      addToast({ message: err.message, type: 'error' });
    } finally { setLoading(false); }
  };

  /* ── Step 2 – Aadhaar ───────────────────────────────────────────── */
  const handleSendAadhaar = async () => {
    if (!/^[0-9]{12}$/.test(aadhaar)) {
      addToast({ message: 'Aadhaar must be exactly 12 digits', type: 'error' }); return;
    }
    setLoading(true);
    try {
      const res = await initiateAadhaarVerification(aadhaar);
      setAadhaarRef(res.referenceId);
      setAadhaarSent(true);
      addToast({ message: 'OTP sent! Demo OTP: 9876', type: 'success' });
    } catch (err) { addToast({ message: err.message, type: 'error' }); }
    finally { setLoading(false); }
  };

  const handleVerifyAadhaar = async () => {
    if (!aadhaarOtp) { addToast({ message: 'Enter OTP', type: 'error' }); return; }
    setLoading(true);
    try {
      await verifyAadhaarOtp(aadhaarOtp, aadhaarRef, userEmail);
      addToast({ message: 'Aadhaar Verified ✅', type: 'success' });
      setStep(3);
    } catch (err) { addToast({ message: err.message, type: 'error' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020817] via-[#0f1b3a] to-[#020817] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs — same as Login.jsx */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#4F8EF7] to-transparent opacity-10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[#9333EA] to-transparent opacity-10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card — same as Login.jsx */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4F8EF7] to-[#9333EA] bg-clip-text text-transparent mb-1">
              TrustPool
            </h1>
            <p className="text-gray-400 text-sm">Lender Portal — KYC Verification</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-8 px-2">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    i < step  ? 'bg-[#10B981] text-white'
                    : i === step ? 'bg-[#4F8EF7] text-white'
                    : 'bg-white/10 text-white/30'
                  }`}>
                    {i < step ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={`text-[10px] ${i === step ? 'text-[#4F8EF7]' : i < step ? 'text-[#10B981]' : 'text-white/30'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 h-px mx-1 mb-4 transition-colors duration-300 ${i < step ? 'bg-[#10B981]' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">

            {/* ── STEP 0: Login / Register ── */}
            {step === 0 && (
              <motion.div key="step0" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <form onSubmit={handleAuth} className="space-y-4 mb-6">

                  {isSignUp && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="Rahul Kumar"
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-300" disabled={loading}>
                        {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#4F8EF7] to-[#9333EA] hover:from-[#3a7dd8] hover:to-[#7c2db8] text-white font-semibold py-2 rounded-lg mt-2 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <><Loader className="w-4 h-4 animate-spin" /> Please wait…</> : <>{isSignUp ? 'Create Account & Continue' : 'Sign In & Continue'} <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                {/* Toggle sign up / sign in */}
                <div className="text-center text-sm text-gray-400 mb-4">
                  {isSignUp ? 'Already have a lender account? ' : "Don't have a lender account? "}
                  <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#4F8EF7] hover:underline">
                    {isSignUp ? 'Sign In' : 'Register'}
                  </button>
                </div>

                {/* Info */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-gray-400">
                    <strong>Note:</strong> After login, you'll complete PAN + Aadhaar KYC to access the lender dashboard.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 1: PAN ── */}
            {step === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-5 h-5 text-[#4F8EF7]" />
                    <h2 className="text-white font-semibold">PAN Verification</h2>
                  </div>
                  <p className="text-gray-400 text-sm">Required for lender compliance (RBI guidelines)</p>
                </div>

                <div className="space-y-4">
                  {/* PAN Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={pan}
                        onChange={e => setPan(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors tracking-widest"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Name as per PAN */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name as per PAN Card</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={panName}
                        onChange={e => setPanName(e.target.value)}
                        placeholder="BALRAM DINESH PANIGRAHI"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth (DD/MM/YYYY)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm">📅</span>
                      <input
                        type="text"
                        value={panDob}
                        onChange={e => setPanDob(e.target.value)}
                        placeholder="16/05/2004"
                        maxLength={10}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#4F8EF7] transition-colors tracking-wider"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button onClick={handleVerifyPan} disabled={loading}
                    className="w-full bg-gradient-to-r from-[#4F8EF7] to-[#9333EA] hover:from-[#3a7dd8] hover:to-[#7c2db8] text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                    {loading ? <><Loader className="w-4 h-4 animate-spin" /> Verifying PAN…</> : <>Verify PAN <CheckCircle className="w-4 h-4" /></>}
                  </button>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-gray-400">🔒 Your PAN details are verified securely via NSDL. No data is stored without consent.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Aadhaar ── */}
            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Fingerprint className="w-5 h-5 text-[#9333EA]" />
                    <h2 className="text-white font-semibold">Aadhaar Verification</h2>
                  </div>
                  <p className="text-gray-400 text-sm">Final KYC step to activate your lender account</p>
                </div>

                {!aadhaarSent ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Aadhaar Number (12 digits)</label>
                      <div className="relative">
                        <Fingerprint className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={aadhaar}
                          onChange={e => setAadhaar(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456789012"
                          maxLength={12}
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#9333EA] transition-colors tracking-widest"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <button onClick={handleSendAadhaar} disabled={loading}
                      className="w-full bg-gradient-to-r from-[#4F8EF7] to-[#9333EA] hover:from-[#3a7dd8] hover:to-[#7c2db8] text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                      {loading ? <><Loader className="w-4 h-4 animate-spin" /> Sending…</> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-xs text-gray-400">✅ OTP sent to Aadhaar-linked mobile. <strong className="text-white">Demo OTP: 9876</strong></p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Enter OTP</label>
                      <input
                        type="text"
                        value={aadhaarOtp}
                        onChange={e => setAadhaarOtp(e.target.value)}
                        placeholder="Enter OTP"
                        maxLength={6}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#9333EA] transition-colors text-center tracking-[0.3em] text-lg"
                        disabled={loading}
                      />
                    </div>
                    <button onClick={handleVerifyAadhaar} disabled={loading}
                      className="w-full bg-gradient-to-r from-[#4F8EF7] to-[#9333EA] hover:from-[#3a7dd8] hover:to-[#7c2db8] text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                      {loading ? <><Loader className="w-4 h-4 animate-spin" /> Verifying…</> : <>Verify Aadhaar <CheckCircle className="w-4 h-4" /></>}
                    </button>
                    <button onClick={() => setAadhaarSent(false)} className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors">
                      ← Enter a different Aadhaar
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: Done ── */}
            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="w-8 h-8 text-[#10B981]" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white mb-2">KYC Complete! 🎉</h2>
                  <p className="text-gray-400 text-sm mb-6">
                    Your identity has been verified. You can now access the Lender Dashboard.
                  </p>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: 'Starting Wallet', value: '₹10,000' },
                      { label: 'Pool APY',         value: '14%' },
                      { label: 'Risk Level',       value: 'Low' },
                    ].map(s => (
                      <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-white font-semibold text-sm">{s.value}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate('/pool')}
                    className="w-full bg-gradient-to-r from-[#4F8EF7] to-[#9333EA] hover:from-[#3a7dd8] hover:to-[#7c2db8] text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    Go to Lender Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © 2026 TrustPool AI. Powered by advanced ML & financial analysis.
        </p>
      </motion.div>
    </div>
  );
}
