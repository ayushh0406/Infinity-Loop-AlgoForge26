import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * ScoreRing Component
 * Animated SVG score ring with zone-based colors
 */

export default function ScoreRing({ 
  score = 74, 
  size = 280, 
  strokeWidth = 12,
  showTicks = true,
  showLabel = true,
  animate = true,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Score zone colors
  const getZoneColor = (score) => {
    if (score <= 40) return { color: '#EF4444', glow: 'rgba(239,68,68,0.25)', label: 'NEEDS WORK' };
    if (score <= 70) return { color: '#F59E0B', glow: 'rgba(245,158,11,0.25)', label: 'BUILDING' };
    return { color: '#10B981', glow: 'rgba(16,185,129,0.25)', label: 'CREDITWORTHY' };
  };

  const zone = getZoneColor(score);
  
  // Ring calculations
  const center = size / 2;
  const radius = (size - strokeWidth) / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Animated score number
  const springScore = useSpring(0, { stiffness: 50, damping: 20 });
  const displayScore = useTransform(springScore, (val) => Math.round(val));

  useEffect(() => {
    if (animate) {
      setIsVisible(true);
      springScore.set(score);
    }
  }, [score, animate, springScore]);

  // Generate tick marks
  const ticks = [];
  const tickCount = 28;
  const tickRadius = radius + 8;
  for (let i = 0; i < tickCount; i++) {
    const angle = (i / tickCount) * 360 - 90;
    const radians = (angle * Math.PI) / 180;
    const x1 = center + (tickRadius - 4) * Math.cos(radians);
    const y1 = center + (tickRadius - 4) * Math.sin(radians);
    const x2 = center + tickRadius * Math.cos(radians);
    const y2 = center + tickRadius * Math.sin(radians);
    ticks.push({ x1, y1, x2, y2, key: i });
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Zone glow background */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${zone.glow} 0%, transparent 70%)`,
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isVisible ? { opacity: 0.6, scale: 1 } : {}}
        transition={{ delay: 1.8, duration: 0.5, ease: 'easeOut' }}
      />

      <svg width={size} height={size} className="transform -rotate-90">
        {/* Tick marks */}
        {showTicks && ticks.map((tick) => (
          <line
            key={tick.key}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Track ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />

        {/* Progress ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={zone.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={isVisible ? { strokeDashoffset } : {}}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <motion.span 
          className="font-mono font-extrabold text-white"
          style={{ fontSize: size * 0.22 }}
        >
          {displayScore}
        </motion.span>
        {showLabel && (
          <>
            <span 
              className="font-mono font-medium mt-1"
              style={{ 
                fontSize: size * 0.04, 
                color: zone.color,
                letterSpacing: '0.05em'
              }}
            >
              {zone.label}
            </span>
            <span 
              className="font-mono text-white/30 mt-1"
              style={{ 
                fontSize: size * 0.035,
                letterSpacing: '0.15em'
              }}
            >
              TRUST SCORE
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Mini Score Ring - for hero card
 */
export function MiniScoreRing({ score = 74, size = 120 }) {
  return (
    <ScoreRing 
      score={score} 
      size={size} 
      strokeWidth={8} 
      showTicks={false}
      showLabel={false}
    />
  );
}
