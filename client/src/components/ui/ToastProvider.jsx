import { useCallback, useEffect, useRef, useState } from "react";
import { Toast } from "./Toast.jsx";
import { ToastContext } from "./toastContext.js";

/**
 * Render once near the app root; toasts display as auto-dismissing post-it notes.
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message, { type = "info", duration = 4000 } = {}) => {
      window.clearTimeout(timerRef.current);
      setToast({ id: Date.now(), message, type });
      timerRef.current = window.setTimeout(() => setToast(null), duration);
    },
    [],
  );

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return (
    <ToastContext.Provider value={{ toast: showToast, dismiss }}>
      {children}
      {toast && <Toast key={toast.id} {...toast} onDismiss={dismiss} />}
    </ToastContext.Provider>
  );
}
