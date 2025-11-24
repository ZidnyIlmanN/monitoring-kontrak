"use client"

import { create } from "zustand"
import type { ToastProps } from "@/components/ui/toast"

type ToastOptions = Omit<ToastProps, "id" | "onDismiss">

interface ToastState {
  toasts: Array<Omit<ToastProps, "onDismiss">>
  showToast: (options: ToastOptions) => void
  dismissToast: (id: string) => void
}

let toastCount = 0

interface ShowToast {
  (options: ToastOptions): void
}

interface DismissToast {
  (id: string): void
}

interface UseToastStore {
  toasts: Array<Omit<ToastProps, "onDismiss">>
  showToast: ShowToast
  dismissToast: DismissToast
}

interface UseToastStoreState {
  toasts: Array<Omit<ToastProps, "onDismiss">>
}

interface UseToastStoreActions {
  showToast: ShowToast
  dismissToast: DismissToast
}

type UseToastStoreType = UseToastStoreState & UseToastStoreActions

export const useToastStore = create<UseToastStoreType>((set: (fn: (state: UseToastStoreType) => UseToastStoreType) => void) => ({
  toasts: [],
  showToast: (options: ToastOptions): void => {
    const id = `toast-${toastCount++}`
    set((state: UseToastStoreType): UseToastStoreType => ({
      toasts: [...state.toasts, { id, ...options }],
      showToast: state.showToast,
      dismissToast: state.dismissToast,
    }))
  },
  dismissToast: (id: string): void => {
    set((state: UseToastStoreType): UseToastStoreType => ({
      toasts: state.toasts.filter((t: Omit<ToastProps, "onDismiss">) => t.id !== id),
      showToast: state.showToast,
      dismissToast: state.dismissToast,
    }))
  },
}))

/**
 * Hook untuk menampilkan notifikasi toast.
 * @example
 * const { showToast } = useToast();
 * showToast({ title: 'Success', message: 'Data berhasil disimpan.' });
 */
export const useToast = () => useToastStore()