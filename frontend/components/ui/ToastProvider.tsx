"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ToastVariant = "success" | "error";

type ToastState = { message: string; variant: ToastVariant } | null;

const ToastContext = createContext<
  ((message: string, variant?: ToastVariant) => void) | null
>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      setToast({ message, variant });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 z-[100] max-w-md -translate-x-1/2 rounded-2xl border px-5 py-3 text-sm font-medium shadow-lg ${
            toast.variant === "success"
              ? "border-emerald-500/30 bg-[#030712]/95 text-emerald-100"
              : "border-red-500/30 bg-[#030712]/95 text-red-100"
          }`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
