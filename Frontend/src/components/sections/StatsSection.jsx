import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import CountUp from '../ui/CountUp';

/**
 * StatsSection Component
 * 4 large animated counters
 */

const stats = [
  {
    value: 400,
    suffix: 'M+',
    label: 'Credit-Invisible',
    sublabel: 'Indians'
  },
  {
    prefix: '₹',
    value: 2.3,
    suffix: ' L Cr',
    label: 'Unmet Credit',
    sublabel: 'Demand in India'
  },
  {
    value: 74,
    suffix: '%',
    label: 'Approval',
    sublabel: 'Rate'
  },
  {
    prefix: '< ',
    value: 60,
    suffix: 's',
    label: 'Score',
    sublabel: 'Generated'
  }
];

export default function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 bg-[#060F24] relative" ref={ref}>
      {/* Top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(79,142,247,0.3)] to-transparent" />
      
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              className={`
                text-center px-4
                ${index < stats.length - 1 ? 'lg:border-r lg:border-[rgba(255,255,255,0.08)]' : ''}
              `}
            >
              {/* Number */}
              <div className="font-display font-extrabold text-4xl md:text-5xl text-white mb-2">
                {stat.prefix && <span>{stat.prefix}</span>}
                {isInView && (
                  <CountUp 
                    end={stat.value} 
                    decimals={stat.value % 1 !== 0 ? 1 : 0}
                  />
                )}
                {stat.suffix && <span>{stat.suffix}</span>}
              </div>
              
              {/* Label */}
              <div className="text-white/60 text-[13px]">
                <div>{stat.label}</div>
                <div>{stat.sublabel}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(79,142,247,0.3)] to-transparent" />
    </section>
  );
}
