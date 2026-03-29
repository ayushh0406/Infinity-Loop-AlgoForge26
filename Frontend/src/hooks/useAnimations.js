import { useState, useEffect, useCallback } from 'react';
import { useSpring } from 'framer-motion';

/**
 * useMouseParallax Hook
 * Creates 3D parallax effect based on mouse position
 */
export function useMouseParallax(maxRotation = 10) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  
  const rotateX = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 150, damping: 20 });

  const handleMouseMove = useCallback((e, element) => {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setMousePosition({ x, y });
    
    // Calculate rotation (centered at 0.5, 0.5)
    const newRotateY = (x - 0.5) * maxRotation * 2;
    const newRotateX = (0.5 - y) * maxRotation * 2;
    
    rotateX.set(newRotateX);
    rotateY.set(newRotateY);
  }, [maxRotation, rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return {
    mousePosition,
    rotateX,
    rotateY,
    handleMouseMove,
    handleMouseLeave
  };
}

/**
 * useScrollReveal Hook
 * Returns animation variants for scroll-triggered elements
 */
export function useScrollReveal() {
  const variants = {
    hidden: { 
      opacity: 0, 
      y: 40 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.10,
        delayChildren: 0.1
      }
    }
  };

  const staggerItem = {
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

  return { variants, staggerContainer, staggerItem };
}

/**
 * useIntersectionObserver Hook
 * Triggers callback when element enters viewport
 */
export function useIntersectionObserver(callback, options = {}) {
  const [ref, setRef] = useState(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          callback?.();
          if (options.once) {
            observer.disconnect();
          }
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '-80px'
      }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, callback, options.once, options.threshold, options.rootMargin]);

  return [setRef, isIntersecting];
}
