"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import type { Report } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ExportReportButtonProps {
  report: Report
}

export function ExportReportButton({ report }: ExportReportButtonProps) {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      })

      if (!response.ok) {
        throw new Error("Gagal membuat PDF di server")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "laporan-monitoring.pdf"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      showToast({
        title: "Berhasil!",
        message: "Laporan PDF berhasil diekspor.",
        type: "success",
      })
    } catch (error) {
      console.error("Error saat mengekspor PDF:", error)
      // Anda bisa menambahkan notifikasi error di sini, misalnya dengan toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isLoading} variant="outline" className="border-slate-300 bg-transparent">
      {isLoading ? (
        "Membuat..."
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  )
}
