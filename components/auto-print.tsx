"use client"
import { useEffect } from "react"

export function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.print()
      } catch (e) {
        console.log("[v0] print error:", e)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [])
  return null
}
