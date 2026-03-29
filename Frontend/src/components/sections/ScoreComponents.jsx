import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card, { GradientBorderCard } from '../ui/Card';
import ScoreRing from '../ui/ScoreRing';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { getScoreZone, getShapBarColor } from '../../utils/scoreUtils';
import { formatCurrency } from '../../utils/formatters';
import { PROFILES, IMPROVEMENT_TIPS } from '../../utils/mockData';
import { ChevronDown, ChevronUp, TrendingUp, ArrowRight } from 'lucide-react';

/**
 * ShapBreakdown Component
 * Explainability panel showing SHAP factors
 */

export function ShapBreakdown({ shapData, animate = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate max impact for bar scaling
  const maxImpact = Math.max(...shapData.map(s => Math.abs(s.impact)));

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Why this score?</h3>
        <span className="text-white/30 text-xs font-mono">Powered by SHAP</span>
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(255,255,255,0.05)] -mx-6 mb-4" />

      {/* Factor Rows */}
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
                {/* Factor Name */}
                <span className="text-white/80 text-sm font-medium w-40 flex-shrink-0">
                  {factor.factor}
                </span>

                {/* Bar Track */}
                <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors.fill }}
                    initial={animate ? { scaleX: 0 } : { scaleX: barWidth / 100 }}
                    animate={{ scaleX: barWidth / 100 }}
                    transition={{ 
                      delay: 0.5 + index * 0.12, 
                      duration: 0.8, 
                      ease: [0.22, 1, 0.36, 1] 
                    }}
                  />
                </div>

                {/* Impact Value */}
                <span 
                  className="font-mono text-sm w-12 text-right flex-shrink-0"
                  style={{ color: colors.text }}
                >
                  {factor.impact > 0 ? '+' : ''}{factor.impact} {colors.arrow}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Expandable Explanation */}
      <div className="mt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-white/40 hover:text-white/60 text-sm transition-colors"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          What does this mean?
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 text-white/50 text-sm leading-relaxed">
                <p className="mb-2">
                  <strong className="text-white/70">Income Consistency</strong> measures how regular your incoming payments are. 
                  Steady deposits indicate reliable income and boost your score.
                </p>
                <p>
                  <strong className="text-white/70">Bill Payments</strong> track your history of paying recurring bills on time. 
                  This shows lenders you're responsible with financial obligations.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

/**
 * ScoreImprovementTips Component
 */
export function ScoreImprovementTips() {
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
              {/* Step Number */}
              <div className="w-6 h-6 rounded-full bg-[rgba(79,142,247,0.2)] flex items-center justify-center flex-shrink-0">
                <span className="text-[#4F8EF7] text-xs font-mono font-bold">{tip.step}</span>
              </div>
              
              {/* Tip Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm">{tip.tip}</p>
                <p className="text-white/40 text-xs mt-1">→ {tip.timeline}</p>
              </div>

              {/* Points Badge */}
              <Badge variant="success" size="sm">
                +{tip.points} pts
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

/**
 * LoanOfferCard Component
 * The gradient border loan offer
 */
export function LoanOfferCard({ profile }) {
  const zone = getScoreZone(profile.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientBorderCard>
        <div className="p-6">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#10B981] font-mono text-sm flex items-center gap-1.5">
              ✓ Approved
            </span>
            <span className="text-white/40 text-xs">Instant Disbursal</span>
          </div>

          {/* Divider */}
          <div className="h-px bg-[rgba(255,255,255,0.08)] mb-6" />

          {/* Loan Details */}
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div>
              <div className="font-mono font-bold text-2xl md:text-3xl text-white">
                {formatCurrency(profile.loanAmount)}
              </div>
              <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">
                Loan Amount
              </div>
            </div>
            <div className="border-x border-[rgba(255,255,255,0.08)] px-4">
              <div className="font-mono font-bold text-2xl md:text-3xl text-white">
                {profile.rate}%
              </div>
              <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">
                Interest Rate
              </div>
            </div>
            <div>
              <div className="font-mono font-bold text-2xl md:text-3xl text-white">
                {profile.tenure}
              </div>
              <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">
                Months
              </div>
            </div>
          </div>

          {/* Progress Bar */}
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
            <p className="text-white/30 text-xs mt-2 text-center">
              Score 85+ unlocks {formatCurrency(profile.maxLoan)} @ 9% p.a.
            </p>
          </div>

          {/* CTA */}
          <Button fullWidth icon={<ArrowRight size={18} />}>
            Apply for Loan
          </Button>

          {/* Fine Print */}
          <p className="text-white/30 text-xs text-center mt-4">
            No hidden fees · No prepayment penalty · Blockchain-recorded
          </p>
        </div>
      </GradientBorderCard>
    </motion.div>
  );
}
