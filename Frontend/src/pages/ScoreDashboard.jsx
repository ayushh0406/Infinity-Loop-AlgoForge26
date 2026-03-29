import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import Card, { GradientBorderCard } from '../components/ui/Card';
import ScoreRing from '../components/ui/ScoreRing';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Footer from '../components/sections/Footer';
import { PROFILES, IMPROVEMENT_TIPS } from '../utils/mockData';
import { getScoreZone, getShapBarColor } from '../utils/scoreUtils';
import { formatCurrency } from '../utils/formatters';
import { ChevronDown, ChevronUp, TrendingUp, ArrowRight, CheckCircle, XCircle, AlertTriangle, Lightbulb } from 'lucide-react';

/**
 * Score Dashboard Page
 * Shows real AI scoring results when navigated from AA verification,
 * or falls back to mock profile selector demo.
 */

// Profile cards data (for fallback demo mode)
const profileOptions = [
  { id: 'student', ...PROFILES.student },
  { id: 'gig_worker', ...PROFILES.gig_worker },
  { id: 'salaried', ...PROFILES.salaried }
];

// Feature name → human-readable label
const FEATURE_LABELS = {
  upi_success_rate: 'UPI Success Rate',
  avg_monthly_income: 'Monthly Income',
  bill_payment_delay_days: 'Bill Payment Delay',
  account_age_months: 'Account Age',
  income_volatility: 'Income Volatility',
  savings_consistency: 'Savings Consistency',
  essential_spend_ratio: 'Essential Spend Ratio',
  monthly_repayment_cap: 'Repayment Capacity',
  loan_default_history: 'Default History',
  user_type_encoded: 'User Category',
};

// Score → suggestions
function getSuggestions(score, breakdown) {
  const suggestions = [];
  if (score < 80) {
    suggestions.push({ tip: 'Increase your UPI transaction success rate to 98%+', impact: '+5 pts', timeline: '1-2 months' });
    suggestions.push({ tip: 'Maintain consistent savings of 15%+ monthly', impact: '+4 pts', timeline: '2-3 months' });
  }
  if (score < 65) {
    suggestions.push({ tip: 'Pay all bills within 3 days of due date', impact: '+3 pts', timeline: '1 month' });
    suggestions.push({ tip: 'Reduce essential spending ratio below 50%', impact: '+2 pts', timeline: '2 months' });
  }
  suggestions.push({ tip: 'Keep your bank account active for 12+ months', impact: '+3 pts', timeline: '6 months' });
  suggestions.push({ tip: 'Avoid any loan defaults — 0 tolerance policy', impact: '+8 pts', timeline: 'Immediate' });
  return suggestions.slice(0, 4);
}

export default function ScoreDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const aiData = location.state; // { aiResult, loanData, approved, msg, walletBalance }

  // If real AI data exists, use it; otherwise fall back to demo mode
  const isRealMode = !!(aiData?.aiResult);

  // Demo mode state
  const [selectedProfile, setSelectedProfile] = useState('gig_worker');
  const [animateKey, setAnimateKey] = useState(0);

  const profile = PROFILES[selectedProfile];
  const zone = getScoreZone(profile.score);

  const handleProfileSelect = useCallback((profileId) => {
    if (profileId !== selectedProfile) {
      setSelectedProfile(profileId);
      setAnimateKey(prev => prev + 1);
    }
  }, [selectedProfile]);

  // ─── Real AI Mode ───
  if (isRealMode) {
    const ai = aiData.aiResult;
    const loan = aiData.loanData;
    const approved = aiData.approved;
    const score = Math.round(ai.trust_score);
    const scoreZone = getScoreZone(score);

    // Map AI breakdown to SHAP format
    const shapData = (ai.breakdown || []).map(b => ({
      factor: FEATURE_LABELS[b.feature] || b.feature,
      impact: parseFloat(b.impact),
      direction: parseFloat(b.impact) >= 0 ? 'positive' : 'negative',
    }));

    const suggestions = getSuggestions(score, ai.breakdown);

    return (
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen bg-[#020817] pt-24"
      >
        <div className="container py-12">
          {/* Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 ${
              approved
                ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.2)]'
                : 'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.2)]'
            }`}
          >
            {approved
              ? <CheckCircle className="text-[#10B981] flex-shrink-0" size={22} />
              : <XCircle className="text-[#EF4444] flex-shrink-0" size={22} />}
            <div>
              <p className={`font-semibold ${approved ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {approved ? 'Loan Approved & Disbursed! 🎉' : 'Loan Application Declined'}
              </p>
              <p className="text-white/50 text-sm">{aiData.msg}</p>
            </div>
            <Badge variant={approved ? 'success' : 'glass'} className="ml-auto">
              {ai.eligibility_status}
            </Badge>
          </motion.div>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="eyebrow mb-3">
              <span>AI TRUST SCORE — LIVE RESULT</span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-white">
              Your AI Credit Analysis
            </h1>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-[2fr,3fr] gap-8">
            {/* Left Column - Score Display */}
            <div className="space-y-6">
              {/* Score Ring Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card variant="glow" className="flex flex-col items-center py-10">
                  <ScoreRing 
                    score={score} 
                    size={280} 
                    animate={true}
                  />

                  {/* Score Bar */}
                  <div className="w-full max-w-[260px] mt-8">
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div className="flex-1 bg-[rgba(239,68,68,0.6)]" />
                      <div className="flex-1 bg-[rgba(245,158,11,0.6)]" />
                      <div className="flex-1 bg-[rgba(16,185,129,0.6)]" />
                    </div>
                    <div className="relative h-4 mt-1">
                      <motion.div
                        className="absolute w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-white"
                        initial={{ left: '0%' }}
                        animate={{ left: `${score}%` }}
                        transition={{ delay: 1.5, duration: 0.8, ease: 'easeOut' }}
                        style={{ transform: 'translateX(-50%)' }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/30 font-mono mt-1">
                      <span>LOW</span>
                      <span>MID</span>
                      <span>HIGH</span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Input Data Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Monthly Income', value: `₹${Math.round(ai.input_data.avg_monthly_income).toLocaleString('en-IN')}` },
                    { label: 'UPI Success', value: `${(ai.input_data.upi_success_rate * 100).toFixed(0)}%` },
                    { label: 'Income Volatility', value: `${(ai.input_data.income_volatility * 100).toFixed(0)}%` },
                    { label: 'Account Age', value: `${Math.round(ai.input_data.account_age_months)} mo` },
                    { label: 'Savings Rate', value: `${(ai.input_data.savings_consistency * 100).toFixed(0)}%` },
                    { label: 'Bill Delay', value: `${ai.input_data.bill_payment_delay_days} days` },
                  ].map((item, idx) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + idx * 0.06 }}
                    >
                      <Card padding="sm" hover={false}>
                        <p className="text-white/40 text-[11px] font-mono uppercase tracking-wider mb-1">
                          {item.label}
                        </p>
                        <p className="font-mono text-lg font-medium text-white">
                          {item.value}
                        </p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Analysis */}
            <div className="space-y-6">
              {/* SHAP Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-lg">Why this score?</h3>
                    <span className="text-white/30 text-xs font-mono">Powered by SHAP · XGBoost</span>
                  </div>
                  <div className="h-px bg-[rgba(255,255,255,0.05)] -mx-6 mb-4" />

                  <div className="space-y-0">
                    {shapData.map((factor, index) => {
                      const maxImpact = Math.max(...shapData.map(s => Math.abs(s.impact)));
                      const colors = getShapBarColor(factor.direction);
                      const barWidth = (Math.abs(factor.impact) / maxImpact) * 100;
                      return (
                        <motion.div
                          key={factor.factor}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                          className="py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-white/80 text-sm font-medium w-40 flex-shrink-0">
                              {factor.factor}
                            </span>
                            <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: colors.fill }}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: barWidth / 100 }}
                                transition={{ delay: 0.5 + index * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </div>
                            <span 
                              className="font-mono text-sm w-12 text-right flex-shrink-0"
                              style={{ color: colors.text }}
                            >
                              {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)} {colors.arrow}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>

              {/* Suggestions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb size={18} className="text-[#F59E0B]" />
                    <h3 className="text-white font-semibold text-lg">Score Improvement Tips</h3>
                  </div>
                  <div className="space-y-3">
                    {suggestions.map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-[rgba(79,142,247,0.2)] flex items-center justify-center flex-shrink-0">
                            <span className="text-[#4F8EF7] text-xs font-mono font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-sm">{tip.tip}</p>
                            <p className="text-white/40 text-xs mt-1">→ {tip.timeline}</p>
                          </div>
                          <Badge variant="success" size="sm">{tip.impact}</Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Loan Offer (only if approved) */}
              {approved && loan && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <GradientBorderCard>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[#10B981] font-mono text-sm flex items-center gap-1.5">
                          ✓ Disbursed to Wallet
                        </span>
                        <span className="text-white/40 text-xs">₹{aiData.walletBalance?.toLocaleString('en-IN')} balance</span>
                      </div>
                      <div className="h-px bg-[rgba(255,255,255,0.08)] mb-6" />
                      <div className="grid grid-cols-3 gap-4 text-center mb-6">
                        <div>
                          <div className="font-mono font-bold text-2xl md:text-3xl text-white">
                            ₹{loan.amount?.toLocaleString('en-IN')}
                          </div>
                          <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Loan Amount</div>
                        </div>
                        <div className="border-x border-[rgba(255,255,255,0.08)] px-4">
                          <div className="font-mono font-bold text-2xl md:text-3xl text-white">
                            {loan.interestRate}%
                          </div>
                          <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Interest</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-2xl md:text-3xl text-white">
                            ₹{loan.monthlyEmi?.toLocaleString('en-IN')}
                          </div>
                          <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Monthly EMI</div>
                        </div>
                      </div>

                      <Button fullWidth icon={<ArrowRight size={18} />} onClick={() => navigate('/dashboard')}>
                        Go to Dashboard — Pay EMIs
                      </Button>

                      <p className="text-white/30 text-xs text-center mt-4">
                        {loan.tenure} EMIs · Total payable ₹{loan.totalPayable?.toLocaleString('en-IN')} · Blockchain-recorded
                      </p>
                    </div>
                  </GradientBorderCard>
                </motion.div>
              )}

              {/* If rejected, show retry */}
              {!approved && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <Card className="text-center py-6">
                    <AlertTriangle size={32} className="text-[#F59E0B] mx-auto mb-3" />
                    <p className="text-white/60 text-sm mb-4">
                      Improve your score by following the tips above, then try again.
                    </p>
                    <Button icon={<ArrowRight size={16} />} onClick={() => navigate('/dashboard')}>
                      Back to Dashboard
                    </Button>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </motion.main>
    );
  }

  // ─── Fallback: Demo Mode (original behavior) ───
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
            <span>TRUST SCORE</span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">
            Your AI Credit Score
          </h1>
        </motion.div>

        {/* Profile Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          {profileOptions.map((opt) => (
            <ProfileCard
              key={opt.id}
              profile={opt}
              isSelected={selectedProfile === opt.id}
              onSelect={() => handleProfileSelect(opt.id)}
            />
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[2fr,3fr] gap-8">
          {/* Left Column - Score Display */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`score-${animateKey}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card variant="glow" className="flex flex-col items-center py-10">
                  <ScoreRing 
                    score={profile.score} 
                    size={280} 
                    animate={true}
                    key={`ring-${animateKey}`}
                  />
                  <div className="w-full max-w-[260px] mt-8">
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div className="flex-1 bg-[rgba(239,68,68,0.6)]" />
                      <div className="flex-1 bg-[rgba(245,158,11,0.6)]" />
                      <div className="flex-1 bg-[rgba(16,185,129,0.6)]" />
                    </div>
                    <div className="relative h-4 mt-1">
                      <motion.div
                        className="absolute w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-white"
                        initial={{ left: '0%' }}
                        animate={{ left: `${profile.score}%` }}
                        transition={{ delay: 1.5, duration: 0.8, ease: 'easeOut' }}
                        style={{ transform: 'translateX(-50%)' }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/30 font-mono mt-1">
                      <span>LOW</span>
                      <span>MID</span>
                      <span>HIGH</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`metrics-${animateKey}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <UPIMetricsGrid metrics={profile.metrics} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column - Analysis + Offer */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`shap-${animateKey}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ShapBreakdownFallback shapData={profile.shap} animate={true} />
              </motion.div>
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ScoreImprovementTipsFallback />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div key={`loan-${animateKey}`}>
                <LoanOfferCardFallback profile={profile} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Footer />
    </motion.main>
  );
}


// ─── Fallback Components (same as originals) ───

function ProfileCard({ profile, isSelected, onSelect }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card
        hover={false}
        onClick={onSelect}
        className={`relative cursor-pointer transition-all duration-300 ${
          isSelected ? 'border-[rgba(79,142,247,0.5)] bg-[rgba(79,142,247,0.08)]' : 'hover:border-[rgba(255,255,255,0.15)]'
        }`}
      >
        {isSelected && <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#4F8EF7] rounded-t-2xl" />}
        <div className="flex items-center gap-4">
          <span className="text-2xl">{profile.icon}</span>
          <div className="flex-1">
            <h3 className="text-white font-medium">{profile.type}</h3>
            <p className="text-white/40 text-sm font-mono">Score range: {profile.scoreRange}</p>
          </div>
          {isSelected && <Badge variant="accent" size="sm">Selected</Badge>}
        </div>
      </Card>
    </motion.div>
  );
}

function UPIMetricsGrid({ metrics }) {
  const metricItems = [
    { label: 'Avg Monthly Income', value: formatCurrency(metrics.avgIncome) },
    { label: 'Bill Payment Ratio', value: `${metrics.billRatio}%` },
    { label: 'Income Consistency', value: metrics.consistency, isStatus: true },
    { label: 'UPI Active Days/Mo', value: metrics.activeDays },
    { label: 'Failed Transactions', value: metrics.failedTxns },
    { label: 'Savings Rate', value: `${metrics.savingsRate}%` }
  ];

  const getStatusColor = (value) => {
    if (value === 'Very High' || value === 'High') return 'text-[#10B981]';
    if (value === 'Medium') return 'text-[#F59E0B]';
    return 'text-[#EF4444]';
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {metricItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + index * 0.06 }}
        >
          <Card padding="sm" hover={false}>
            <p className="text-white/40 text-[11px] font-mono uppercase tracking-wider mb-1">{item.label}</p>
            <p className={`font-mono text-lg font-medium ${item.isStatus ? getStatusColor(item.value) : 'text-white'}`}>
              {item.value}
              {item.isStatus && item.value.includes('High') && ' ↑'}
            </p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function ShapBreakdownFallback({ shapData, animate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxImpact = Math.max(...shapData.map(s => Math.abs(s.impact)));

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Why this score?</h3>
        <span className="text-white/30 text-xs font-mono">Powered by SHAP</span>
      </div>
      <div className="h-px bg-[rgba(255,255,255,0.05)] -mx-6 mb-4" />
      <div className="space-y-0">
        {shapData.map((factor, index) => {
          const colors = getShapBarColor(factor.direction);
          const barWidth = (Math.abs(factor.impact) / maxImpact) * 100;
          return (
            <motion.div
              key={factor.factor}
              initial={animate ? { opacity: 0, x: -20 } : {}}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              className="py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0"
            >
              <div className="flex items-center gap-4">
                <span className="text-white/80 text-sm font-medium w-40 flex-shrink-0">{factor.factor}</span>
                <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors.fill }}
                    initial={animate ? { scaleX: 0 } : { scaleX: barWidth / 100 }}
                    animate={{ scaleX: barWidth / 100 }}
                    transition={{ delay: 0.5 + index * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="font-mono text-sm w-12 text-right flex-shrink-0" style={{ color: colors.text }}>
                  {factor.impact > 0 ? '+' : ''}{factor.impact} {colors.arrow}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

function ScoreImprovementTipsFallback() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} className="text-[#10B981]" />
        <h3 className="text-white font-semibold text-lg">Improve Your Score</h3>
      </div>
      <div className="space-y-3">
        {IMPROVEMENT_TIPS.map((tip, index) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            whileHover={{ y: -2 }}
            className="p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl cursor-pointer transition-all hover:border-[rgba(79,142,247,0.2)]"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[rgba(79,142,247,0.2)] flex items-center justify-center flex-shrink-0">
                <span className="text-[#4F8EF7] text-xs font-mono font-bold">{tip.step}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm">{tip.tip}</p>
                <p className="text-white/40 text-xs mt-1">→ {tip.timeline}</p>
              </div>
              <Badge variant="success" size="sm">+{tip.points} pts</Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function LoanOfferCardFallback({ profile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientBorderCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#10B981] font-mono text-sm flex items-center gap-1.5">✓ Approved</span>
            <span className="text-white/40 text-xs">Instant Disbursal</span>
          </div>
          <div className="h-px bg-[rgba(255,255,255,0.08)] mb-6" />
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div>
              <div className="font-mono font-bold text-2xl md:text-3xl text-white">{formatCurrency(profile.loanAmount)}</div>
              <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Loan Amount</div>
            </div>
            <div className="border-x border-[rgba(255,255,255,0.08)] px-4">
              <div className="font-mono font-bold text-2xl md:text-3xl text-white">{profile.rate}%</div>
              <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Interest Rate</div>
            </div>
            <div>
              <div className="font-mono font-bold text-2xl md:text-3xl text-white">{profile.tenure}</div>
              <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Months</div>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-white/40 mb-2">
              <span>Your limit</span>
              <span>Max {formatCurrency(profile.maxLoan)}</span>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#4F8EF7] to-[#10B981]"
                initial={{ width: 0 }}
                animate={{ width: `${(profile.loanAmount / profile.maxLoan) * 100}%` }}
                transition={{ delay: 1.8, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-white/30 text-xs mt-2 text-center">Score 85+ unlocks {formatCurrency(profile.maxLoan)} @ 9% p.a.</p>
          </div>
          <Button fullWidth icon={<ArrowRight size={18} />}>Apply for Loan</Button>
          <p className="text-white/30 text-xs text-center mt-4">No hidden fees · No prepayment penalty · Blockchain-recorded</p>
        </div>
      </GradientBorderCard>
    </motion.div>
  );
}
