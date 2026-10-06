'use client';

import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

// ─── Toast types ────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void;
  toastSuccess: (title: string, description?: string) => void;
  toastError: (title: string, description?: string) => void;
  toastWarning: (title: string, description?: string) => void;
  toastInfo: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ─── Variant styling ────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✓', text: 'text-emerald-800' },
  error:   { bg: 'bg-red-50',     border: 'border-red-200',     icon: '✕', text: 'text-red-800' },
  warning: { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: '⚠', text: 'text-amber-800' },
  info:    { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'ℹ', text: 'text-blue-800' },
};

// ─── Provider ───────────────────────────────────────────────────────────────

const TOAST_DURATION = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (opts: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { ...opts, id }]);
      setTimeout(() => removeToast(id), TOAST_DURATION);
    },
    [removeToast],
  );

  const value: ToastContextValue = {
    toast: addToast,
    toastSuccess: (title, description) => addToast({ title, description, variant: 'success' }),
    toastError: (title, description) => addToast({ title, description, variant: 'error' }),
    toastWarning: (title, description) => addToast({ title, description, variant: 'warning' }),
    toastInfo: (title, description) => addToast({ title, description, variant: 'info' }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — fixed bottom-right */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => {
          const s = VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex min-w-[320px] max-w-[420px] items-start gap-3 rounded-xl border ${s.border} ${s.bg} p-4 shadow-lg animate-in slide-in-from-right-5 fade-in duration-300`}
            >
              <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${s.text}`}>
                {s.icon}
              </span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${s.text}`}>{t.title}</p>
                {t.description && (
                  <p className={`mt-0.5 text-xs ${s.text} opacity-80`}>{t.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className={`mt-0.5 flex-shrink-0 text-sm ${s.text} opacity-60 hover:opacity-100`}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
