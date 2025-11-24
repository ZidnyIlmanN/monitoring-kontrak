"use client"

import { Toast, ToastProps } from "@/components/ui/toast"
import { useToastStore } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts, dismissToast } = useToastStore()

  return (
    <div
      id="toast-container"
      className="fixed top-5 right-5 z-[100] flex flex-col gap-3"
    >
      {toasts.map((toast: Omit<ToastProps, "onDismiss">) => (
        <Toast key={toast.id} {...toast} onDismiss={dismissToast} />
      ))}
    </div>
  )
}