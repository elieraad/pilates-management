"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from "react";
import { X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
};

type ToastContextType = {
  toast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({ title, description, type }: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        dismissToast(id);
      }, 5000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-md flex justify-between items-start min-w-[300px] max-w-md ${
              toast.type === "success"
                ? "bg-green-50 border-l-4 border-green-500"
                : toast.type === "error"
                ? "bg-red-50 border-l-4 border-red-500"
                : toast.type === "warning"
                ? "bg-amber-50 border-l-4 border-amber-500"
                : "bg-blue-50 border-l-4 border-blue-500"
            }`}
          >
            <div>
              <h4
                className={`font-medium ${
                  toast.type === "success"
                    ? "text-green-800"
                    : toast.type === "error"
                    ? "text-red-800"
                    : toast.type === "warning"
                    ? "text-amber-800"
                    : "text-blue-800"
                }`}
              >
                {toast.title}
              </h4>
              {toast.description && (
                <p
                  className={`text-sm mt-1 ${
                    toast.type === "success"
                      ? "text-green-600"
                      : toast.type === "error"
                      ? "text-red-600"
                      : toast.type === "warning"
                      ? "text-amber-600"
                      : "text-blue-600"
                  }`}
                >
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
