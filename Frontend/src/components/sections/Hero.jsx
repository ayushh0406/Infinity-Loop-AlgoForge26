import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import HeroCard from './HeroCard';

/**
 * Hero Section Component
 * Full viewport height, two-column layout
 */

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.4
    }
  }
};

const wordVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export default function Hero() {
  // Ambient particles data
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 6
  }));

  return (
    <section className="relative min-h-screen flex flex-col pt-[72px] pb-12 overflow-hidden">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-[#020817]" />
      
      {/* Gradient Orbs */}
      <div className="orb-1" />
      <div className="orb-2" />
      
      {/* Dot Grid */}
      <div 
        className="absolute inset-0 dot-grid opacity-50"
        style={{
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}
      />
      
      {/* Ambient Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: particle.left,
            top: particle.top,
            animation: `particle-drift ${6 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}

      {/* Content */}
      <div className="container relative z-10 my-auto">
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-12 lg:gap-8 items-center">
          {/* Left Column - Text */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Eyebrow */}
            <motion.div variants={fadeUpVariants} className="mb-6">
              <Badge 
                variant="glass" 
                size="lg"
                className="border-[rgba(79,142,247,0.25)]"
              >
                <span className="text-[#4F8EF7]">✦</span>
                <span className="ml-2">AI-POWERED CREDIT SCORING</span>
              </Badge>
            </motion.div>

            {/* Headline */}
            <h1 className="font-display font-extrabold tracking-[-0.03em] leading-[1.1] mb-6">
              <motion.span 
                variants={wordVariants} 
                className="block text-white"
                style={{ fontSize: 'clamp(48px, 6vw, 80px)' }}
              >
                Your UPI History
              </motion.span>
              <motion.span 
                variants={wordVariants} 
                className="block text-white"
                style={{ fontSize: 'clamp(48px, 6vw, 80px)' }}
              >
                Is Your
              </motion.span>
              <motion.span 
                variants={wordVariants} 
                className="block text-[#4F8EF7]"
                style={{ fontSize: 'clamp(48px, 6vw, 80px)' }}
              >
                Credit Score.
              </motion.span>
            </h1>

            {/* Subtext */}
            <motion.p 
              variants={fadeUpVariants}
              className="text-white/60 text-lg leading-[1.7] max-w-[520px] mb-8"
            >
              400 million Indians have income but no credit history.
              TrustPool changes that — using 6 months of UPI data
              to unlock fair, transparent, AI-explained credit.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              variants={containerVariants}
              className="flex flex-wrap items-center gap-4 mb-8"
            >
              <motion.div variants={buttonVariants}>
                <Link to="/score">
                  <Button icon={<ArrowRight size={18} />}>
                    Get Your Score
                  </Button>
                </Link>
              </motion.div>
              <motion.div variants={buttonVariants}>
                <Link to="/lender-login">
                  <Button variant="secondary">
                    Become a Lender
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Strip */}
            <motion.div 
              variants={fadeUpVariants}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/30 text-[13px]"
            >
              <span className="flex items-center gap-1.5">
                <span>🔒</span> RBI AA Framework
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5">
                <span>⚡</span> 60-second scoring
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5">
                <span>🔗</span> Blockchain verified
              </span>
            </motion.div>
          </motion.div>

          {/* Right Column - Hero Card */}
          <div className="flex justify-center lg:justify-end">
            <HeroCard />
          </div>
        </div>
      </div>
    </section>
  );
}
