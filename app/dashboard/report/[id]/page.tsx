import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Briefcase, Calendar } from "lucide-react"
import Link from "next/link"
import type { Report } from "@/lib/types"
import { Progress } from "@/components/ui/progress"
import { ExportReportButton } from "@/components/export-report-button"

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: report } = await supabase.from("reports").select("*").eq("id", id).single<Report>()

  if (!report) {
    redirect("/dashboard")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader userName={profile?.full_name || user.email || "User"} />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Report #{report.no}</CardTitle>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created: {formatDate(report.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Updated: {formatDate(report.updated_at)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ExportReportButton report={report} />
                  <Button asChild className="bg-slate-900 hover:bg-slate-800">
                    <Link href={`/dashboard/edit/${report.id}`}>Edit Report</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">No Notif</p>
                    <p className="text-lg text-slate-900">{report.no_notif}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Judul Notifikasi</p>
                    <p className="text-lg text-slate-900">{report.judul_notifikasi}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-1">
                      <MapPin className="h-4 w-4" />
                      Lokasi
                    </div>
                    <p className="text-lg text-slate-900">{report.lokasi}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">No. SPK</p>
                    <p className="text-lg text-slate-900">{report.no_spk}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-1">
                      <Briefcase className="h-4 w-4" />
                      Judul SPK
                    </div>
                    <p className="text-lg text-slate-900">{report.judul_spk}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Durasi SPK</p>
                    <p className="text-lg text-slate-900">{report.durasi_spk}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Progress & Budget</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-600 mb-1">Nilai Rekapitulasi Estimasi Biaya</p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatCurrency(report.nilai_rekapitulasi_estimasi_biaya)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-600 mb-1">Progress</p>
                    <p className="text-xl font-bold text-blue-900">{report.progress_percentage}%</p>
                    <Progress value={report.progress_percentage} className="h-3 mt-2" />
                  </div>
                </div>
              </div>

              {report.keterangan && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Keterangan</h3>
                  <p className="text-slate-700 leading-relaxed">{report.keterangan}</p>
                </div>
              )}

              {report.image_url && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Documentation</h3>
                  <img
                    src={report.image_url || "/placeholder.svg"}
                    alt="Report documentation"
                    className="w-full max-w-2xl rounded-lg border border-slate-200 shadow-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
