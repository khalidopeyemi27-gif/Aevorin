import React, { createContext, useContext, useState, useCallback } from "react";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  timestamp: Date;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (message: string, type: ToastMessage["type"], duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastMessage["type"] = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration,
      timestamp: new Date()
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      
      {/* Toast Notification Container Stack */}
      <div 
        className="toast-container" 
        aria-live="polite" 
        aria-atomic="true"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "350px",
          pointerEvents: "none"
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-alert toast-${toast.type}`}
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "8px",
              background: toast.type === "success" 
                ? "var(--success)" 
                : toast.type === "error" 
                  ? "var(--danger)" 
                  : toast.type === "warning"
                    ? "var(--warning)"
                    : "var(--accent-primary)",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              pointerEvents: "auto",
              animation: "slideInLeft 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              border: "1px solid rgba(255,255,255,0.15)"
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
                fontSize: "1.1rem",
                padding: "0",
                lineHeight: "1"
              }}
              title="Close Notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
