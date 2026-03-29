import { motion } from 'framer-motion';

/**
 * Button Component
 * Variants: primary, secondary, ghost
 * All buttons have minimum 6px border radius
 */

const variants = {
  primary: {
    base: `
      bg-[#4F8EF7] text-white border-none
      hover:bg-[#6BA3FF]
      shadow-[0_4px_15px_rgba(79,142,247,0.25)]
      hover:shadow-[0_8px_25px_rgba(79,142,247,0.35)]
    `,
    hover: { y: -1 }
  },
  secondary: {
    base: `
      bg-transparent text-white/80
      border border-white/15
      hover:border-[rgba(79,142,247,0.5)] hover:text-white
      hover:bg-[rgba(79,142,247,0.08)]
    `,
    hover: { y: -1 }
  },
  ghost: {
    base: `
      bg-transparent text-[#6BA3FF] border-none
      hover:underline hover:underline-offset-4
    `,
    hover: {}
  }
};

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  icon,
  iconPosition = 'right',
  disabled = false,
  fullWidth = false,
  onClick,
  ...props 
}) {
  const sizes = {
    sm: 'px-4 py-2 text-[13px]',
    md: 'px-7 py-3 text-[15px]',
    lg: 'px-8 py-4 text-base'
  };

  const variantStyles = variants[variant];

  return (
    <motion.button
      className={`
        relative overflow-hidden
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-all duration-200
        ${sizes[size]}
        ${variantStyles.base}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${variant === 'primary' ? 'btn-shimmer' : ''}
        ${className}
      `}
      whileHover={disabled ? {} : variantStyles.hover}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </motion.button>
  );
}
