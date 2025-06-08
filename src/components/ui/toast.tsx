"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

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
  const [isMounted, setIsMounted] = useState(false);

  // Only run on client
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = ({ title, description, type }: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      dismissToast(id);
    }, 5000);
  };

  const toastContainer = (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:left-auto z-100 flex flex-col gap-2 p-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={(e) => e.stopPropagation()}
          className={`p-3 md:p-4 rounded-lg shadow-md flex justify-between items-start w-full md:min-w-[300px] md:max-w-md mx-auto md:mx-0 pointer-events-auto transition-all duration-300 ease-in-out ${
            toast.type === "success"
              ? "bg-green-50 border-l-4 border-green-500"
              : toast.type === "error"
              ? "bg-red-50 border-l-4 border-red-500"
              : toast.type === "warning"
              ? "bg-amber-50 border-l-4 border-amber-500"
              : "bg-blue-50 border-l-4 border-blue-500"
          }`}
          style={{
            animation: "slide-up 0.3s ease-out forwards",
          }}
        >
          <div className="flex-1 pr-2">
            <h4
              className={`font-medium text-sm md:text-base ${
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
                className={`text-xs md:text-sm mt-1 ${
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
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(toast.id);
            }}
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      {isMounted && createPortal(toastContainer, document.body)}
      {isMounted && (
        <style>
          {`
            @keyframes slide-up {
              0% {
                transform: translateY(100%);
                opacity: 0;
              }
              100% {
                transform: translateY(0);
                opacity: 1;
              }
            }
            
            @media (max-width: 768px) {
              :root {
                --toast-width: 100%;
              }
            }
          `}
        </style>
      )}
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
