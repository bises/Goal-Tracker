import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type ToastLevel = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  level?: ToastLevel;
  onClose?: () => void;
  autoClose?: number; // milliseconds before auto closing
}

const toastConfig: Record<
  ToastLevel,
  {
    background: string;
    border: string;
    icon: React.ReactNode;
    color: string;
  }
> = {
  success: {
    background: 'rgba(0, 200, 120, 0.2)',
    border: 'rgba(0, 200, 120, 0.6)',
    icon: <CheckCircle size={20} />,
    color: 'rgba(0, 200, 120, 1)',
  },
  error: {
    background: 'rgba(200, 0, 80, 0.2)',
    border: 'rgba(200, 0, 80, 0.6)',
    icon: <AlertCircle size={20} />,
    color: 'rgba(200, 0, 80, 1)',
  },
  info: {
    background: 'rgba(100, 150, 255, 0.2)',
    border: 'rgba(100, 150, 255, 0.6)',
    icon: <Info size={20} />,
    color: 'rgba(100, 150, 255, 1)',
  },
  warning: {
    background: 'rgba(255, 180, 0, 0.2)',
    border: 'rgba(255, 180, 0, 0.6)',
    icon: <AlertTriangle size={20} />,
    color: 'rgba(255, 180, 0, 1)',
  },
};

export function Toast({ message, level = 'info', onClose, autoClose = 3000 }: ToastProps) {
  const config = toastConfig[level];

  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '12px 16px',
        borderRadius: '8px',
        background: config.background,
        border: `1px solid ${config.border}`,
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: config.color,
        zIndex: 2000,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      {config.icon}
      <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: config.color,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            marginLeft: '8px',
          }}
        >
          ✕
        </button>
      )}
      <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
    </div>
  );
}
