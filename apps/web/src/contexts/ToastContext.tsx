import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig: Record<
  ToastType,
  {
    background: string;
    border: string;
    icon: React.ReactNode;
    color: string;
  }
> = {
  success: {
    background: 'rgba(240, 253, 244, 0.95)',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#22c55e' }} />,
    color: '#15803d',
  },
  error: {
    background: 'rgba(254, 242, 242, 0.95)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />,
    color: '#b91c1c',
  },
  info: {
    background: 'rgba(239, 246, 255, 0.95)',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: <Info className="w-5 h-5 flex-shrink-0" style={{ color: '#3b82f6' }} />,
    color: '#1d4ed8',
  },
  warning: {
    background: 'rgba(255, 251, 235, 0.95)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} />,
    color: '#b45309',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Render Container */}
      <div
        className="fixed z-[9999] pointer-events-none flex flex-col gap-2 max-w-sm w-full px-4"
        style={{
          bottom: '5.5rem', // Elevated above bottom navigation bar
          right: '1rem',
        }}
        role="region"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const cfg = toastConfig[toast.type];
          return (
            <div
              key={toast.id}
              role="alert"
              className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
              style={{
                background: cfg.background,
                borderColor: cfg.border,
                color: cfg.color,
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {cfg.icon}
                <span className="text-sm font-medium leading-snug break-words">
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: cfg.color }}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
