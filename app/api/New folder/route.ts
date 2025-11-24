import { NextResponse, type NextRequest } from "next/server"
import { generatePDF } from "@/lib/pdf-generator"
import type { Report } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const reportData = (await request.json()) as Report

    if (!reportData) {
      return new NextResponse("Data laporan tidak ditemukan", { status: 400 })
    }

    // Generate the PDF buffer on the server
    const pdfBuffer = await generatePDF(reportData)

    // Convert Buffer to Uint8Array for NextResponse
    const pdfUint8Array = new Uint8Array(pdfBuffer)

    // Return the PDF as a response
    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laporan-monitoring.pdf"`,
      },
    })
  } catch (error) {
    console.error("Gagal membuat PDF:", error)
    return new NextResponse("Gagal membuat PDF", { status: 500 })
  }
}