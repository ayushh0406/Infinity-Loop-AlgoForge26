/**
 * Badge Component
 * For type badges, status indicators, and pills
 */

const variants = {
  default: 'bg-[rgba(255,255,255,0.08)] text-white/60 border-[rgba(255,255,255,0.08)]',
  accent: 'bg-[rgba(79,142,247,0.12)] text-[#6BA3FF] border-[rgba(79,142,247,0.25)]',
  success: 'bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.25)]',
  warning: 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.25)]',
  danger: 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.25)]',
  glass: 'bg-[rgba(255,255,255,0.04)] text-white/80 border-[rgba(255,255,255,0.08)] backdrop-blur-md',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-[11px]',
  lg: 'px-4 py-1.5 text-[12px]',
};

export default function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  ...props 
}) {
  return (
    <span 
      className={`
        inline-flex items-center gap-1.5
        font-mono font-medium
        border rounded-md
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

/**
 * Status Dot - for live indicators
 */
export function StatusDot({ status = 'success', pulse = false, className = '' }) {
  const colors = {
    success: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    danger: 'bg-[#EF4444]',
    accent: 'bg-[#4F8EF7]',
  };

  return (
    <span className={`relative inline-flex ${className}`}>
      <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
      {pulse && (
        <span 
          className={`absolute inset-0 w-2 h-2 rounded-full ${colors[status]} animate-ping opacity-75`}
        />
      )}
    </span>
  );
}
