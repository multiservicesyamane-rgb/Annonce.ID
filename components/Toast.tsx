"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = { id: number; message: string; type: ToastType };

type ToastContextType = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

/** Hook pour utiliser les toasts depuis n'importe quel composant */
export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

/** Provider global à placer dans le layout ou SiteShell */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 left-1/2 z-[9999] flex -translate-x-1/2 flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto whitespace-nowrap rounded-[10px] border px-5 py-2.5 text-[.88rem] font-medium text-white shadow-lg animate-fadeUp ${
              t.type === "success"
                ? "border-neon-green/50 bg-dark-900"
                : t.type === "error"
                  ? "border-brand-red/50 bg-dark-900"
                  : "border-neon-gold bg-dark-900"
            }`}
          >
            {t.type === "success" && "✓ "}
            {t.type === "error" && "✗ "}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
