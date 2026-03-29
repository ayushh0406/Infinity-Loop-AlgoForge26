import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Footer from '../components/sections/Footer';
import { ArrowRight, ArrowLeft, Phone, Building2, ShieldCheck, Loader, CheckCircle, FileText, Landmark } from 'lucide-react';

const BACKEND = 'http://localhost:5000';
const getToken = () => localStorage.getItem('auth_token');

const BANKS = [
  { id: 'sbi', name: 'State Bank of India', short: 'SBI' },
  { id: 'hdfc', name: 'HDFC Bank', short: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', short: 'ICICI' },
  { id: 'axis', name: 'Axis Bank', short: 'AXIS' },
  { id: 'pnb', name: 'Punjab National Bank', short: 'PNB' },
  { id: 'bob', name: 'Bank of Baroda', short: 'BOB' },
];

export default function AAVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loanAmount, loanReason } = location.state || {};

  const [step, setStep] = useState(1); // 1=mobile, 2=bank, 3=consent, 4=verifying
  const [mobile, setMobile] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('');
  const [error, setError] = useState('');

  // Step 1 → 2
  const handleMobileSubmit = () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setStep(2);
  };

  // Step 2 → 3 (consent screen)
  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setStep(3);
    setError('');
  };

  // Step 3 → 4 (actual verification + AI scoring)
  const handleConsentAllow = async () => {
    setStep(4);
    setError('');

    // Mock OTP sending
    setVerifyStatus('sending_otp');
    await delay(800);

    setVerifyStatus('verifying');
    await delay(1000);

    setVerifyStatus('scoring');

    // Call backend which calls AI model
    try {
      const res = await fetch(`${BACKEND}/api/payments/request-loan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          amount: loanAmount || 10000,
          reason: loanReason || '',
          mobileNumber: mobile,
          bankName: selectedBank.name
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || 'Loan request failed');
        setStep(1);
        return;
      }

      setVerifyStatus('done');
      await delay(800);

      // Navigate to /score with AI result
      navigate('/score', {
        state: {
          aiResult: data.aiResult,
          loanData: data.loan,
          approved: data.approved,
          msg: data.msg,
          walletBalance: data.walletBalance
        }
      });
    } catch (err) {
      setError('Connection error. Please try again.');
      setStep(1);
    }
  };

  // Masked account number
  const maskedAcct = `52xxxxxx${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#020817] pt-24"
    >
      <div className="container py-12 max-w-xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="eyebrow mb-3 justify-center">
            <span>ACCOUNT AGGREGATOR</span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">
            Verify Your Account
          </h1>
          <p className="text-white/60 mt-2">
            Securely connect your bank for AI-powered credit scoring
          </p>
          {loanAmount && (
            <Badge variant="accent" className="mt-3">
              Loan Request: ₹{Number(loanAmount).toLocaleString('en-IN')}
            </Badge>
          )}
        </motion.div>

        {/* Steps Indicator — now 4 steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s
                  ? 'bg-[#4F8EF7] text-white'
                  : 'bg-white/5 text-white/30'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-[#4F8EF7]' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Mobile Number */}
          {step === 1 && (
            <motion.div key="mobile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[rgba(79,142,247,0.15)] flex items-center justify-center">
                    <Phone size={18} className="text-[#4F8EF7]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Mobile Number</h3>
                    <p className="text-white/40 text-xs">Linked to your bank account</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <span className="text-white/40 text-lg font-mono">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="bg-transparent text-white font-mono text-2xl font-bold w-full focus:outline-none placeholder:text-white/15"
                    />
                  </div>
                </div>

                <Button fullWidth icon={<ArrowRight size={18} />} onClick={handleMobileSubmit}>
                  Continue
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Select Bank */}
          {step === 2 && (
            <motion.div key="bank" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[rgba(79,142,247,0.15)] flex items-center justify-center">
                    <Building2 size={18} className="text-[#4F8EF7]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Select Your Bank</h3>
                    <p className="text-white/40 text-xs">Choose primary bank for AA consent</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {BANKS.map(bank => (
                    <motion.button
                      key={bank.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleBankSelect(bank)}
                      className="p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl hover:border-[rgba(79,142,247,0.4)] transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[rgba(79,142,247,0.12)] flex items-center justify-center mb-2">
                        <span className="text-[#4F8EF7] text-xs font-bold font-mono">{bank.short}</span>
                      </div>
                      <p className="text-white/80 text-sm font-medium">{bank.name}</p>
                    </motion.button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── Step 3: Give Consent ── */}
          {step === 3 && selectedBank && (
            <motion.div key="consent" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card>
                {/* Back + Title */}
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setStep(2)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <ArrowLeft size={16} className="text-white/70" />
                  </button>
                  <h3 className="text-white font-semibold text-lg">Give Consent</h3>
                </div>

                {/* Consent info banner */}
                <div className="flex items-start gap-3 mb-6 p-3 bg-[rgba(79,142,247,0.06)] border border-[rgba(79,142,247,0.15)] rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(79,142,247,0.15)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck size={18} className="text-[#4F8EF7]" />
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Allow <strong className="text-white">TrustPool AI</strong> to share below listed financial information with <strong className="text-white">{selectedBank.name}</strong>
                  </p>
                </div>

                {/* Purpose / Duration / Frequency card */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mb-5">
                  <div className="mb-3">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Purpose</p>
                    <p className="text-white font-semibold text-sm">Financial Reporting</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Duration</p>
                      <p className="text-white font-semibold text-sm">Last 6 months</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Frequency</p>
                      <p className="text-white font-semibold text-sm">One Time</p>
                    </div>
                  </div>
                </div>

                {/* GST Invoices */}
                <div className="mb-4">
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">GST Invoices</p>
                  <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[rgba(16,185,129,0.12)] flex items-center justify-center">
                        <FileText size={14} className="text-[#10B981]" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">29ABCDE1234F3F7</p>
                        <p className="text-white/40 text-[11px]">M.K.Retail Pvt. Ltd.</p>
                      </div>
                    </div>
                    <CheckCircle size={18} className="text-[#10B981]" />
                  </div>
                </div>

                {/* Bank Accounts */}
                <div className="mb-6">
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Bank Accounts</p>
                  <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[rgba(79,142,247,0.12)] flex items-center justify-center">
                        <Landmark size={14} className="text-[#4F8EF7]" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{selectedBank.name}</p>
                        <p className="text-white/40 text-[11px]">Overdraft - {maskedAcct}</p>
                      </div>
                    </div>
                    <CheckCircle size={18} className="text-[#10B981]" />
                  </div>
                </div>

                {/* Allow button */}
                <Button fullWidth onClick={handleConsentAllow}>
                  Allow
                </Button>

                <p className="text-white/25 text-[10px] text-center mt-3">
                  By clicking Allow you agree to share financial data as per RBI Account Aggregator framework
                </p>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Verifying */}
          {step === 4 && (
            <motion.div key="verify" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Card className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[rgba(79,142,247,0.15)] flex items-center justify-center mx-auto mb-6">
                  {verifyStatus === 'done'
                    ? <CheckCircle size={28} className="text-[#10B981]" />
                    : <Loader size={28} className="text-[#4F8EF7] animate-spin" />}
                </div>

                <div className="space-y-4">
                  <VerifyStep label="Sending OTP to +91 ****" active={verifyStatus === 'sending_otp'} done={['verifying', 'scoring', 'done'].includes(verifyStatus)} />
                  <VerifyStep label="Verifying bank consent" active={verifyStatus === 'verifying'} done={['scoring', 'done'].includes(verifyStatus)} />
                  <VerifyStep label="AI Trust Scoring in progress..." active={verifyStatus === 'scoring'} done={verifyStatus === 'done'} />
                  {verifyStatus === 'done' && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#10B981] font-semibold mt-4">
                      ✓ Score calculated! Redirecting...
                    </motion.p>
                  )}
                </div>

                {selectedBank && (
                  <p className="text-white/30 text-xs mt-6">
                    Connected to {selectedBank.name} via Account Aggregator
                  </p>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </motion.main>
  );
}

function VerifyStep({ label, active, done }) {
  return (
    <div className={`flex items-center gap-3 justify-center transition-all ${done ? 'text-[#10B981]' : active ? 'text-white' : 'text-white/20'}`}>
      {done ? <CheckCircle size={16} /> : active ? <Loader size={16} className="animate-spin" /> : <div className="w-4 h-4 rounded-full border border-white/20" />}
      <span className="text-sm">{label}</span>
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
