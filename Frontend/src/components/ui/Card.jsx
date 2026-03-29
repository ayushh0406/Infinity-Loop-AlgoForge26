import { motion } from 'framer-motion';

/**
 * Card Component
 * Variants: glass (default), glow, gradient-border
 */

export default function Card({ 
  children, 
  variant = 'glass',
  className = '',
  hover = true,
  padding = 'md',
  onClick,
  ...props 
}) {
  const paddingSizes = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseStyles = `
    relative
    bg-[rgba(255,255,255,0.04)]
    border border-[rgba(255,255,255,0.08)]
    backdrop-blur-[20px] backdrop-saturate-[180%]
    rounded-2xl
    ${paddingSizes[padding]}
  `;

  const glowStyles = variant === 'glow' ? `
    shadow-[0_0_80px_rgba(79,142,247,0.15),inset_0_1px_0_rgba(255,255,255,0.10)]
    border-[rgba(79,142,247,0.25)]
  ` : '';

  const hoverAnimation = hover ? {
    whileHover: {
      y: -4,
      transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }
    }
  } : {};

  return (
    <motion.div
      className={`
        ${baseStyles}
        ${glowStyles}
        ${hover ? 'transition-all duration-350 hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(79,142,247,0.30)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(79,142,247,0.10)]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...hoverAnimation}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Gradient Border Card - for loan offer cards
 */
export function GradientBorderCard({ children, className = '', ...props }) {
  return (
    <div className={`relative p-[1px] rounded-2xl ${className}`} {...props}>
      {/* Gradient border */}
      <div 
        className="absolute inset-0 rounded-2xl gradient-border-animated"
        style={{
          background: 'linear-gradient(135deg, #4F8EF7 0%, #10B981 100%)',
        }}
      />
      {/* Inner content */}
      <div className="relative bg-[#060F24] rounded-2xl backdrop-blur-[20px] overflow-hidden">
        {children}
      </div>
    </div>
  );
}
