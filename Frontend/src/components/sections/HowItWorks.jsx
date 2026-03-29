import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link2, Cpu, Zap } from 'lucide-react';
import Card from '../ui/Card';

/**
 * HowItWorks Section
 * 3 steps with connected cards
 */

const steps = [
  {
    number: '01',
    icon: Link2,
    title: 'Connect UPI',
    description: 'Securely link your UPI transaction history via the RBI Account Aggregator framework.'
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI Scores You',
    description: 'Our Random Forest model analyses 7 financial indicators and explains every factor via SHAP.'
  },
  {
    number: '03',
    icon: Zap,
    title: 'Access Credit',
    description: 'Get a loan offer in under 60 seconds, matched to your exact risk profile and borrowing capacity.'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="section bg-[#020817] relative">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="eyebrow justify-center mb-4">
            <span>HOW IT WORKS</span>
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-white">
            Three Steps to Credit
          </h2>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="relative"
        >
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-[20%] right-[20%] h-px">
            <div className="w-full h-full border-t-2 border-dashed border-[rgba(255,255,255,0.08)]" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div key={step.number} variants={itemVariants}>
                <Card 
                  className="relative overflow-hidden h-full"
                  padding="lg"
                >
                  {/* Background Number */}
                  <span className="absolute top-4 right-4 font-mono text-[64px] font-bold text-[rgba(79,142,247,0.08)] leading-none select-none">
                    {step.number}
                  </span>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-[rgba(79,142,247,0.12)] flex items-center justify-center mb-5">
                      <step.icon size={24} className="text-[#4F8EF7]" />
                    </div>

                    {/* Title */}
                    <h3 className="font-display font-semibold text-lg text-white mb-3">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/60 text-[14px] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
