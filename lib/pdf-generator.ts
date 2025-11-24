import "server-only"
import PDFDocument from "pdfkit"
import type { PDFData } from "./types"

export async function generatePDF(data: PDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" })
    const chunks: Buffer[] = []

    doc.on("data", (chunk: Buffer<ArrayBufferLike>) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const { kontrak, spkList } = data

    // Helper function to format currency
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(value)
    }

    // Title Page
    doc.fontSize(24).font("Helvetica-Bold").text("LAPORAN MONITORING", { align: "center" })
    doc.moveDown(0.5)
    doc.fontSize(20).text("RAM CIVIL", { align: "center" })
    doc.moveDown(0.5)
    doc.fontSize(16).font("Helvetica").text("PEP Field Subang", { align: "center" })
    doc.moveDown(2)

    // Summary Statistics
    const totalSPK = spkList.length
    const totalNotifikasi = spkList.reduce((sum, spk) => sum + spk.notifikasi.length, 0)
    const totalNilaiSPK = spkList.reduce((sum, spk) => sum + spk.nilai_rekapitulasi_estimasi_biaya, 0)
    const totalRealisasiSPK = spkList.reduce((sum, spk) => sum + (spk.realisasi_spk || 0), 0)

    // Kontrak Payung Information
    doc.fontSize(16).font("Helvetica-Bold").text("INFORMASI KONTRAK PAYUNG", { underline: true })
    doc.moveDown(1)

    doc.fontSize(11).font("Helvetica-Bold").text("Nama Kontrak:", { continued: true })
    doc.font("Helvetica").text(` ${kontrak.nama_kontrak_payung}`)
    doc.moveDown(0.5)

    doc.font("Helvetica-Bold").text("Nomor OAS:", { continued: true })
    doc.font("Helvetica").text(` ${kontrak.nomor_oas}`)
    doc.moveDown(0.5)

    doc.font("Helvetica-Bold").text("Waktu Perjanjian:", { continued: true })
    doc.font("Helvetica").text(` ${kontrak.waktu_perjanjian}`)
    doc.moveDown(0.5)

    doc.font("Helvetica-Bold").text("Periode Kontrak:", { continued: true })
    doc.font("Helvetica").text(` ${kontrak.periode_kontrak}`)
    doc.moveDown(0.5)

    doc.font("Helvetica-Bold").text("Nilai Kontrak:", { continued: true })
    doc.font("Helvetica").text(` ${formatCurrency(kontrak.nilai_kontrak)}`)
    doc.moveDown(0.5)

    doc.font("Helvetica-Bold").text("Sisa Nilai Kontrak:", { continued: true })
    doc.font("Helvetica").text(` ${formatCurrency(kontrak.nilai_kontrak - totalRealisasiSPK)}`)
    doc.moveDown(2)
    const avgProgress =
      spkList.length > 0 ? spkList.reduce((sum, spk) => sum + spk.progress_percentage, 0) / spkList.length : 0

    doc.fontSize(14).font("Helvetica-Bold").text("RINGKASAN", { underline: true })
    doc.moveDown(0.5)

    doc.fontSize(11).font("Helvetica").text(`Total SPK: ${totalSPK}`)
    doc.text(`Total Notifikasi: ${totalNotifikasi}`)
    doc.text(`Total Nilai SPK: ${formatCurrency(totalNilaiSPK)}`)
    doc.text(`Total Realisasi SPK: ${formatCurrency(totalRealisasiSPK)}`)
    doc.text(`Rata-rata Progress: ${avgProgress.toFixed(1)}%`)
    doc.moveDown(2)

    // SPK Details
    spkList.forEach((spk, spkIndex) => {
      // Add new page for each SPK (except first)
      if (spkIndex > 0) {
        doc.addPage()
      }

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(`SPK ${spkIndex + 1}: ${spk.judul_spk}`, { underline: true })
      doc.moveDown(1)

      doc.fontSize(11).font("Helvetica-Bold").text("No. SPK:", { continued: true })
      doc.font("Helvetica").text(` ${spk.no_spk}`)
      doc.moveDown(0.5)

      doc.font("Helvetica-Bold").text("Durasi SPK:", { continued: true })
      doc.font("Helvetica").text(` ${spk.durasi_spk}`)
      doc.moveDown(0.5)

      doc.font("Helvetica-Bold").text("Nilai Estimasi:", { continued: true })
      doc.font("Helvetica").text(` ${formatCurrency(spk.nilai_rekapitulasi_estimasi_biaya)}`)
      doc.moveDown(0.5)

      doc.font("Helvetica-Bold").text("Realisasi SPK:", { continued: true })
      doc.font("Helvetica").text(` ${formatCurrency(spk.realisasi_spk || 0)}`)
      doc.moveDown(0.5)

      doc.font("Helvetica-Bold").text("Progress:", { continued: true })
      doc.font("Helvetica").text(` ${spk.progress_percentage}%`)
      doc.moveDown(0.5)

      if (spk.keterangan) {
        doc.font("Helvetica-Bold").text("Keterangan:", { continued: true })
        doc.font("Helvetica").text(` ${spk.keterangan}`)
        doc.moveDown(0.5)
      }

      doc.moveDown(1)

      // Notifikasi Table
      if (spk.notifikasi.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").text("Daftar Notifikasi:")
        doc.moveDown(0.5)

        // Table headers
        const tableTop = doc.y
        const col1X = 50
        const col2X = 150
        const col3X = 350

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("No. Notif", col1X, tableTop)
          .text("Judul Notifikasi", col2X, tableTop)
          .text("Lokasi", col3X, tableTop)

        doc.moveDown(0.5)
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
        doc.moveDown(0.3)

        // Table rows
        spk.notifikasi.forEach((notif) => {
          const rowY = doc.y

          doc
            .fontSize(9)
            .font("Helvetica")
            .text(notif.no_notif, col1X, rowY, { width: 90 })
            .text(notif.judul_notifikasi, col2X, rowY, { width: 190 })
            .text(notif.lokasi, col3X, rowY, { width: 190 })

          doc.moveDown(0.8)
        })

        doc.moveDown(1)
      } else {
        doc.fontSize(10).font("Helvetica-Oblique").text("Belum ada notifikasi untuk SPK ini.")
        doc.moveDown(1)
      }
    })

    // Footer on last page
    doc.moveDown(2)
    doc
      .fontSize(9)
      .font("Helvetica-Oblique")
      .text(`Laporan dibuat pada: ${new Date().toLocaleString("id-ID")}`, { align: "center" })

    doc.end()
  })
}
