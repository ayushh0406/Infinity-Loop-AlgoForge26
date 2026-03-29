import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Badge from '../ui/Badge';
import { MiniScoreRing } from '../ui/ScoreRing';

/**
 * HeroCard Component
 * 3D parallax score card with mouse tracking
 */

export default function HeroCard() {
  const cardRef = useRef(null);
  
  // Mouse position
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  
  // Spring animation for smooth movement
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [10, -10]), {
    stiffness: 150,
    damping: 20
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), {
    stiffness: 150,
    damping: 20
  });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  // SHAP mini bars data
  const shapBars = [
    { label: 'Income Consistency', value: 18, max: 25, positive: true },
    { label: 'Bill Payments', value: 15, max: 25, positive: true },
    { label: 'Spending Volatility', value: 8, max: 25, positive: false }
  ];

  return (
    <div 
      className="relative"
      style={{ perspective: 1000 }}
    >
      {/* Floating badges */}
      <motion.div
        className="absolute -top-4 -right-4 z-10 float-animation"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <Badge variant="glass" size="lg" icon="✦">
          AI Explained
        </Badge>
      </motion.div>
      
      <motion.div
        className="absolute -bottom-4 -left-4 z-10"
        style={{ animationDelay: '1.5s' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7, duration: 0.5 }}
      >
        <div className="float-animation" style={{ animationDelay: '1s' }}>
          <Badge variant="glass" size="lg" icon="⛓">
            On-Chain Verified
          </Badge>
        </div>
      </motion.div>

      {/* Main Card */}
      <motion.div
        ref={cardRef}
        className="relative w-[340px] md:w-[380px]"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, x: 40, rotateY: -3 }}
        animate={{ opacity: 1, x: 0, rotateY: -3 }}
        transition={{ 
          delay: 1.3,
          duration: 0.8,
          type: 'spring',
          stiffness: 100
        }}
      >
        <div 
          className="
            bg-[rgba(255,255,255,0.04)] 
            border border-[rgba(79,142,247,0.25)]
            backdrop-blur-[20px] backdrop-saturate-[180%]
            rounded-2xl
            p-6
            shadow-[0_0_80px_rgba(79,142,247,0.15),inset_0_1px_0_rgba(255,255,255,0.10)]
          "
        >
          {/* Profile Row */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[rgba(79,142,247,0.2)] flex items-center justify-center">
              <span className="text-[#6BA3FF] font-mono text-sm font-medium">RK</span>
            </div>
            <div>
              <span className="text-white font-medium text-sm">Rahul K.</span>
              <span className="text-white/40 mx-2">·</span>
              <span className="text-white/60 text-sm">Gig Worker</span>
            </div>
          </div>

          {/* Score Ring */}
          <div className="flex justify-center mb-6">
            <MiniScoreRing score={74} size={140} />
            <div className="absolute mt-[140px]">
              <span className="font-mono text-[10px] text-white/30 tracking-[0.15em]">
                TRUST SCORE
              </span>
            </div>
          </div>

          {/* Mini SHAP Bars */}
          <div className="space-y-3 mb-6 mt-10">
            {shapBars.map((bar, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-white/60 text-xs w-32 truncate">{bar.label}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      bar.positive 
                        ? 'bg-[rgba(16,185,129,0.6)]' 
                        : 'bg-[rgba(239,68,68,0.6)]'
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: bar.value / bar.max }}
                    transition={{ delay: 1.8 + index * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
                <span className={`font-mono text-xs ${
                  bar.positive ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}>
                  {bar.positive ? '+' : '-'}{bar.value}
                </span>
              </div>
            ))}
          </div>

          {/* Loan Offer Row */}
          <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[#10B981] font-mono text-xs">Approved ✓</span>
              <span className="text-[#6BA3FF] font-mono text-sm font-medium">
                ₹20,000 @ 11.5% p.a.
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
