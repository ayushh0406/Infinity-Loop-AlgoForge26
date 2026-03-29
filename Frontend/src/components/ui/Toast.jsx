import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Toast Context and Provider
 */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/**
 * Toast Container
 */
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual Toast
 */
function Toast({ type = 'info', title, message, onClose }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[#10B981]" />,
    error: <AlertCircle className="w-5 h-5 text-[#EF4444]" />,
    info: <Info className="w-5 h-5 text-[#4F8EF7]" />,
  };

  const borderColors = {
    success: 'border-l-[#10B981]',
    error: 'border-l-[#EF4444]',
    info: 'border-l-[#4F8EF7]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        relative min-w-[320px] max-w-[400px]
        bg-[rgba(255,255,255,0.04)] backdrop-blur-xl
        border border-[rgba(255,255,255,0.08)]
        border-l-[3px] ${borderColors[type]}
        rounded-2xl p-4
        shadow-[0_20px_60px_rgba(0,0,0,0.4)]
      `}
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-medium text-white text-sm">{title}</p>
          )}
          {message && (
            <p className="text-white/60 text-sm mt-0.5">{message}</p>
          )}
        </div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 text-white/40 hover:text-white/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
