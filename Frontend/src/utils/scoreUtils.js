/**
 * Score Utility Functions
 */

export function getScoreZone(score) {
  if (score <= 40) {
    return {
      zone: 'low',
      color: '#EF4444',
      glow: 'rgba(239,68,68,0.25)',
      label: 'NEEDS WORK',
      bgClass: 'bg-[rgba(239,68,68,0.15)]',
      textClass: 'text-[#EF4444]'
    };
  }
  if (score <= 70) {
    return {
      zone: 'medium',
      color: '#F59E0B',
      glow: 'rgba(245,158,11,0.25)',
      label: 'BUILDING',
      bgClass: 'bg-[rgba(245,158,11,0.15)]',
      textClass: 'text-[#F59E0B]'
    };
  }
  return {
    zone: 'high',
    color: '#10B981',
    glow: 'rgba(16,185,129,0.25)',
    label: 'CREDITWORTHY',
    bgClass: 'bg-[rgba(16,185,129,0.15)]',
    textClass: 'text-[#10B981]'
  };
}

export function getShapBarColor(direction) {
  if (direction === 'positive') {
    return {
      fill: 'rgba(16,185,129,0.6)',
      text: '#10B981',
      arrow: '↑'
    };
  }
  if (direction === 'negative') {
    return {
      fill: 'rgba(239,68,68,0.6)',
      text: '#EF4444',
      arrow: '↓'
    };
  }
  return {
    fill: 'rgba(255,255,255,0.2)',
    text: 'rgba(255,255,255,0.6)',
    arrow: ''
  };
}

export function getBlockTypeStyles(type) {
  switch (type) {
    case 'LOAN_DISBURSED':
      return {
        bg: 'bg-[rgba(79,142,247,0.12)]',
        text: 'text-[#6BA3FF]',
        border: 'border-[rgba(79,142,247,0.25)]'
      };
    case 'REPAYMENT':
      return {
        bg: 'bg-[rgba(16,185,129,0.12)]',
        text: 'text-[#10B981]',
        border: 'border-[rgba(16,185,129,0.25)]'
      };
    case 'SCORE_UPDATE':
      return {
        bg: 'bg-[rgba(245,158,11,0.12)]',
        text: 'text-[#F59E0B]',
        border: 'border-[rgba(245,158,11,0.25)]'
      };
    case 'DEPOSIT':
      return {
        bg: 'bg-[rgba(255,255,255,0.04)]',
        text: 'text-white/60',
        border: 'border-[rgba(255,255,255,0.08)]'
      };
    default:
      return {
        bg: 'bg-[rgba(255,255,255,0.04)]',
        text: 'text-white/60',
        border: 'border-[rgba(255,255,255,0.08)]'
      };
  }
}

export function calculateScorePosition(score) {
  // Returns percentage for score bar indicator
  return Math.min(Math.max(score, 0), 100);
}
