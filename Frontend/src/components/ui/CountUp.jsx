import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

/**
 * CountUp Component
 * Animated number counter with Indian formatting
 */

export default function CountUp({ 
  end, 
  duration = 2000, 
  prefix = '', 
  suffix = '',
  decimals = 0,
  formatIndian = false,
  className = '' 
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      
      const startTime = Date.now();
      const startValue = 0;
      
      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        
        // Ease out
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (end - startValue) * easeOut;
        
        setCount(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  const formatNumber = (num) => {
    const fixed = num.toFixed(decimals);
    
    if (formatIndian) {
      return formatIndianNumber(parseFloat(fixed));
    }
    
    return parseFloat(fixed).toLocaleString('en-IN');
  };

  return (
    <span ref={ref} className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
}

/**
 * Format number in Indian system (lakhs, crores)
 */
export function formatIndianNumber(num) {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(1) + ' Cr';
  }
  if (num >= 100000) {
    return (num / 100000).toFixed(1) + ' L';
  }
  return num.toLocaleString('en-IN');
}

/**
 * Format currency in Indian system
 */
export function formatIndianCurrency(num) {
  const absNum = Math.abs(num);
  
  if (absNum >= 10000000) {
    return '₹' + (absNum / 10000000).toFixed(2) + ' Cr';
  }
  if (absNum >= 100000) {
    return '₹' + (absNum / 100000).toFixed(2) + ' L';
  }
  
  return '₹' + absNum.toLocaleString('en-IN');
}
