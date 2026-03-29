/**
 * Formatting Utilities
 */

/**
 * Format number in Indian system (lakhs, crores)
 */
export function formatIndianNumber(num) {
  const absNum = Math.abs(num);
  
  if (absNum >= 10000000) {
    return (absNum / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
  }
  if (absNum >= 100000) {
    return (absNum / 100000).toFixed(2).replace(/\.?0+$/, '') + ' L';
  }
  
  return absNum.toLocaleString('en-IN');
}

/**
 * Format currency with ₹ symbol
 */
export function formatCurrency(num, compact = false) {
  const absNum = Math.abs(num);
  
  if (compact) {
    if (absNum >= 10000000) {
      return '₹' + (absNum / 10000000).toFixed(1) + ' Cr';
    }
    if (absNum >= 100000) {
      return '₹' + (absNum / 100000).toFixed(1) + ' L';
    }
  }
  
  return '₹' + absNum.toLocaleString('en-IN');
}

/**
 * Format large numbers with proper Indian commas
 */
export function formatWithIndianCommas(num) {
  const numStr = num.toString();
  let result = '';
  
  // Last 3 digits
  result = numStr.slice(-3);
  let remaining = numStr.slice(0, -3);
  
  // Then groups of 2
  while (remaining.length > 0) {
    result = remaining.slice(-2) + ',' + result;
    remaining = remaining.slice(0, -2);
  }
  
  return result;
}

/**
 * Truncate hash for display
 */
export function truncateHash(hash, chars = 8) {
  if (!hash || hash.length <= chars * 2) return hash;
  return hash.slice(0, chars) + '...' + hash.slice(-chars);
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-IN', options).replace(',', '');
}

/**
 * Format relative time
 */
export function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Format percentage
 */
export function formatPercentage(num, decimals = 1) {
  return num.toFixed(decimals) + '%';
}
