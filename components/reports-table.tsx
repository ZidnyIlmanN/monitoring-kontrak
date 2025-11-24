"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Pencil, Trash2, Download, Search } from "lucide-react"
import type { Report } from "@/lib/types"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReportsTableProps {
  reports: Report[]
  onDelete?: (id: string) => void
}

export function ReportsTable({ reports, onDelete }: ReportsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [progressFilter, setProgressFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600"
    if (progress >= 50) return "text-blue-600"
    if (progress >= 30) return "text-yellow-600"
    return "text-red-600"
  }

  const uniqueLocations = useMemo(() => {
    const locations = new Set(reports.map((r) => r.lokasi))
    return Array.from(locations).sort()
  }, [reports])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        report.no_notif.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.judul_notifikasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.no_spk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.judul_spk.toLowerCase().includes(searchQuery.toLowerCase())

      // Progress filter
      let matchesProgress = true
      if (progressFilter === "0-25") {
        matchesProgress = report.progress_percentage >= 0 && report.progress_percentage < 25
      } else if (progressFilter === "25-50") {
        matchesProgress = report.progress_percentage >= 25 && report.progress_percentage < 50
      } else if (progressFilter === "50-75") {
        matchesProgress = report.progress_percentage >= 50 && report.progress_percentage < 75
      } else if (progressFilter === "75-100") {
        matchesProgress = report.progress_percentage >= 75 && report.progress_percentage <= 100
      }

      // Location filter
      const matchesLocation = locationFilter === "all" || report.lokasi === locationFilter

      return matchesSearch && matchesProgress && matchesLocation
    })
  }, [reports, searchQuery, progressFilter, locationFilter])

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Monitoring RAM Civil PEP Field Subang</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #1e293b;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #0f172a;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #0f172a;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              color: #64748b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f1f5f9;
              font-weight: bold;
              color: #0f172a;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .footer {
              margin-top: 30px;
              text-align: right;
              font-size: 12px;
              color: #64748b;
            }
            .summary {
              margin: 20px 0;
              padding: 15px;
              background-color: #f1f5f9;
              border-radius: 8px;
            }
            .summary-item {
              display: inline-block;
              margin-right: 30px;
              margin-bottom: 10px;
            }
            .summary-label {
              font-weight: bold;
              color: #475569;
            }
            @media print {
              body { padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN MONITORING</h1>
            <h2>RAM CIVIL PEP FIELD SUBANG</h2>
            <p>Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <span class="summary-label">Total Laporan:</span> ${filteredReports.length}
            </div>
            <div class="summary-item">
              <span class="summary-label">Total Anggaran:</span> ${formatCurrency(
                filteredReports.reduce((sum, r) => sum + r.nilai_rekapitulasi_estimasi_biaya, 0),
              )}
            </div>
            <div class="summary-item">
              <span class="summary-label">Rata-rata Progress:</span> ${
                filteredReports.length > 0
                  ? (
                      filteredReports.reduce((sum, r) => sum + r.progress_percentage, 0) / filteredReports.length
                    ).toFixed(1)
                  : 0
              }%
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>No Notif</th>
                <th>Judul Notifikasi</th>
                <th>Lokasi</th>
                <th>No. SPK</th>
                <th>Judul SPK</th>
                <th>Durasi SPK</th>
                <th>Nilai Estimasi Biaya</th>
                <th>Progress</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReports
                .map(
                  (report) => `
                <tr>
                  <td>${report.no}</td>
                  <td>${report.no_notif}</td>
                  <td>${report.judul_notifikasi}</td>
                  <td>${report.lokasi}</td>
                  <td>${report.no_spk}</td>
                  <td>${report.judul_spk}</td>
                  <td>${report.durasi_spk}</td>
                  <td>${formatCurrency(report.nilai_rekapitulasi_estimasi_biaya)}</td>
                  <td>${report.progress_percentage}%</td>
                  <td>${report.keterangan || "-"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            <p>Dokumen ini dicetak secara otomatis dari sistem monitoring RAM Civil</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari laporan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-slate-300"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={progressFilter} onValueChange={setProgressFilter}>
            <SelectTrigger className="w-[160px] border-slate-300">
              <SelectValue placeholder="Filter Progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Progress</SelectItem>
              <SelectItem value="0-25">0% - 25%</SelectItem>
              <SelectItem value="25-50">25% - 50%</SelectItem>
              <SelectItem value="50-75">50% - 75%</SelectItem>
              <SelectItem value="75-100">75% - 100%</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[180px] border-slate-300">
              <SelectValue placeholder="Filter Lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              {uniqueLocations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleExportPDF} variant="outline" className="border-slate-300 bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Export ke PDF
          </Button>
        </div>
      </div>

      {(searchQuery || progressFilter !== "all" || locationFilter !== "all") && (
        <div className="text-sm text-slate-600">
          Menampilkan {filteredReports.length} dari {reports.length} laporan
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-16">No</TableHead>
              <TableHead className="min-w-[120px]">No Notif</TableHead>
              <TableHead className="min-w-[200px]">Judul Notifikasi</TableHead>
              <TableHead className="min-w-[150px]">Lokasi</TableHead>
              <TableHead className="min-w-[120px]">No. SPK</TableHead>
              <TableHead className="min-w-[200px]">Judul SPK</TableHead>
              <TableHead className="min-w-[120px]">Durasi SPK</TableHead>
              <TableHead className="text-right min-w-[180px]">Nilai Rekapitulasi Estimasi Biaya</TableHead>
              <TableHead className="w-32">Progress (%)</TableHead>
              <TableHead className="min-w-[150px]">Keterangan</TableHead>
              <TableHead className="w-32">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-slate-500">
                  {searchQuery || progressFilter !== "all" || locationFilter !== "all"
                    ? "Tidak ada laporan yang sesuai dengan filter."
                    : "Belum ada laporan. Buat laporan pertama Anda untuk memulai."}
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{report.no}</TableCell>
                  <TableCell>{report.no_notif}</TableCell>
                  <TableCell className="max-w-xs truncate">{report.judul_notifikasi}</TableCell>
                  <TableCell className="max-w-xs truncate">{report.lokasi}</TableCell>
                  <TableCell>{report.no_spk}</TableCell>
                  <TableCell className="max-w-xs truncate">{report.judul_spk}</TableCell>
                  <TableCell>{report.durasi_spk}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(report.nilai_rekapitulasi_estimasi_biaya)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${getProgressColor(report.progress_percentage)}`}>
                          {report.progress_percentage}%
                        </span>
                      </div>
                      <Progress value={report.progress_percentage} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{report.keterangan || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/dashboard/report/${report.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/dashboard/edit/${report.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDelete(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
