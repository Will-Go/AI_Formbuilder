import { toast, ExternalToast } from "sonner";

interface ToastOptions extends ExternalToast {
  title?: string;
}

const notifyError = (message: string, options?: ToastOptions) =>
  toast.error(options?.title || "Error", {
    description: message,
    closeButton: true,
    ...options,
  });

const notifySuccess = (message: string, options?: ToastOptions) =>
  toast.success(options?.title || "Éxito", {
    description: message,
    closeButton: true,
    ...options,
  });

const notifyInformation = (message: string, options?: ToastOptions) =>
  toast.info(options?.title || "Información", {
    description: message,
    closeButton: true,
    ...options,
  });

const notifyWarning = (message: string, options?: ToastOptions) =>
  toast.warning(options?.title || "Alerta", {
    description: message,
    closeButton: true,
    ...options,
  });

// Simple variants without titles (for backward compatibility)
const notifyErrorSimple = (message: string, options?: ExternalToast) =>
  toast.error(message, {
    closeButton: true,
    ...options,
  });

const notifySuccessSimple = (message: string, options?: ExternalToast) =>
  toast.success(message, {
    closeButton: true,
    ...options,
  });

export {
  notifyError,
  notifySuccess,
  notifyInformation,
  notifyWarning,
  notifyErrorSimple,
  notifySuccessSimple,
};
