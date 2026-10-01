'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export type ToastHelperFn = ((item: Omit<ToastItem, 'id'>) => void) & {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

interface ToastContextType {
  toasts: ToastItem[];
  toast: ToastHelperFn;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone toast dispatcher for non-react or outside context calls
let globalToastHandler: ((item: Omit<ToastItem, 'id'>) => void) | null = null;

export const toast = {
  success: (title: string, description?: string) => {
    if (globalToastHandler) globalToastHandler({ type: 'success', title, description });
  },
  error: (title: string, description?: string) => {
    if (globalToastHandler) globalToastHandler({ type: 'error', title, description });
  },
  warning: (title: string, description?: string) => {
    if (globalToastHandler) globalToastHandler({ type: 'warning', title, description });
  },
  info: (title: string, description?: string) => {
    if (globalToastHandler) globalToastHandler({ type: 'info', title, description });
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { ...item, id };
      setToasts((prev) => [...prev.slice(-4), newToast]);

      const duration = item.duration ?? 4500;
      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  globalToastHandler = addToast;

  const success = useCallback(
    (title: string, description?: string) => addToast({ type: 'success', title, description }),
    [addToast]
  );
  const error = useCallback(
    (title: string, description?: string) => addToast({ type: 'error', title, description }),
    [addToast]
  );
  const warning = useCallback(
    (title: string, description?: string) => addToast({ type: 'warning', title, description }),
    [addToast]
  );
  const info = useCallback(
    (title: string, description?: string) => addToast({ type: 'info', title, description }),
    [addToast]
  );

  const toastCallable: ToastHelperFn = Object.assign(
    (item: Omit<ToastItem, 'id'>) => addToast(item),
    { success, error, warning, info }
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast: toastCallable,
        success,
        error,
        warning,
        info,
        dismiss,
      }}
    >
      {children}
      <ToasterContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    const fallbackCallable: ToastHelperFn = Object.assign(
      (item: Omit<ToastItem, 'id'>) => {
        if (globalToastHandler) globalToastHandler(item);
      },
      toast
    );
    return {
      toasts: [],
      toast: fallbackCallable,
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
      dismiss: () => {},
    };
  }
  return context;
}

function ToasterContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        let borderClass = 'border-slate-800 bg-slate-900/95 text-slate-100';
        let icon = <Info className="h-5 w-5 text-sky-400 flex-shrink-0" />;

        if (t.type === 'success') {
          borderClass = 'border-emerald-500/30 bg-slate-900/95 text-slate-100 shadow-emerald-500/10';
          icon = <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />;
        } else if (t.type === 'error') {
          borderClass = 'border-rose-500/30 bg-slate-900/95 text-slate-100 shadow-rose-500/10';
          icon = <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />;
        } else if (t.type === 'warning') {
          borderClass = 'border-amber-500/30 bg-slate-900/95 text-slate-100 shadow-amber-500/10';
          icon = <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />;
        }

        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${borderClass}`}
          >
            <div className="pt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-tight">{t.title}</h4>
              {t.description && (
                <p className="mt-0.5 text-xs text-slate-400 leading-relaxed break-words">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 -mr-1 -mt-1 rounded-lg"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
