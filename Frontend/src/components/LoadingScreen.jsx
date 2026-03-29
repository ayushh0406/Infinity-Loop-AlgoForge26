import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Loading Screen Component
 * Cinematic app loading animation
 */

export default function LoadingScreen({ onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),   // Show "Trust"
      setTimeout(() => setPhase(2), 600),   // Show "Pool"
      setTimeout(() => setPhase(3), 1000),  // Show tagline
      setTimeout(() => setPhase(4), 1400),  // Progress bar
      setTimeout(() => onComplete?.(), 1800) // Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const letters = 'TrustPool'.split('');

  return (
    <AnimatePresence>
      {phase < 5 && (
        <motion.div
          className="fixed inset-0 z-[100] bg-[#020817] flex flex-col items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo Animation */}
          <div className="flex items-center mb-6">
            {letters.map((letter, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: phase >= 1 ? 1 : 0, 
                  y: phase >= 1 ? 0 : 20 
                }}
                transition={{ 
                  delay: index * 0.05, 
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className={`
                  font-display font-bold text-4xl
                  ${letter === '.' ? 'text-[#4F8EF7]' : 'text-white'}
                `}
              >
                {letter === 't' && index === 5 ? (
                  <>
                    <span className="text-[#4F8EF7]">.</span>
                    {letter}
                  </>
                ) : letter}
              </motion.span>
            ))}
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 3 ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="text-white/40 text-sm mb-12"
          >
            Credit for the uncredited.
          </motion.p>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 4 ? 1 : 0 }}
            className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-[#4F8EF7]"
              initial={{ width: '0%' }}
              animate={{ width: phase >= 4 ? '100%' : '0%' }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
