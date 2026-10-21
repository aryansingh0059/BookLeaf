import { useContext } from "react";
import { ToastContext } from "./toastContext.js";

/**
 * Use inside ToastProvider to announce short-lived status messages without moving focus.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
