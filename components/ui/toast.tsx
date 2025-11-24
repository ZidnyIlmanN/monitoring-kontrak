"use client"

import { useEffect, useState, useRef } from "react"
import { X, CheckCircle } from "lucide-react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastProps {
  id: string
  title: string
  message: string
  type?: ToastType
  duration?: number
  onDismiss: (id: string) => void
}

const icons = {
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  // Anda bisa menambahkan ikon lain untuk error, warning, dll.
  error: <X className="h-6 w-6 text-red-500" />,
  warning: <X className="h-6 w-6 text-yellow-500" />,
  info: <X className="h-6 w-6 text-blue-500" />,
}

const borderColors = {
  success: "border-green-500",
  error: "border-red-500",
  warning: "border-yellow-500",
  info: "border-blue-500",
}

const progressColors = {
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
}

export function Toast({
  id,
  title,
  message,
  type = "success",
  duration = 5000,
  onDismiss,
}: ToastProps) {
  const [isHiding, setIsHiding] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const handleDismiss = () => {
    setIsHiding(true)
  }

  useEffect(() => {
    if (!isHiding) {
      timerRef.current = setTimeout(handleDismiss, duration)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isHiding, duration])

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (progressRef.current) {
      progressRef.current.style.animationPlayState = "paused"
    }
  }

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(handleDismiss, duration / 2) // Sisa waktu
    if (progressRef.current) {
      progressRef.current.style.animationPlayState = "running"
    }
  }

  const handleAnimationEnd = () => {
    if (isHiding) {
      onDismiss(id)
    }
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onAnimationEnd={handleAnimationEnd}
      className={`toast ${isHiding ? "hiding" : ""} toast--${type} flex w-full max-w-sm items-start overflow-hidden rounded-lg bg-white shadow-lg border-l-4 ${borderColors[type]}`}
    >
      <div className="flex-shrink-0 p-4">{icons[type]}</div>
      <div className="flex-grow p-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
      <div className="flex-shrink-0 p-2">
        <button
          onClick={handleDismiss}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div
        ref={progressRef}
        className={`toast__progress absolute bottom-0 left-0 h-1 ${progressColors[type]}`}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  )
}