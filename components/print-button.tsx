"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button onClick={handlePrint} className="bg-slate-700 hover:bg-slate-800">
      <Printer className="mr-2 h-4 w-4" />
      Cetak / Simpan PDF
    </Button>
  )
}
