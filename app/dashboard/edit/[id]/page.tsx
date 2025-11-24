import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { ReportForm } from "@/components/report-form"
import type { Report } from "@/lib/types"

export default async function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader userName={profile?.full_name || user.email || "User"} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Edit Report</h2>
          <p className="text-slate-600">Update the details of your monitoring report</p>
        </div>

        <ReportForm mode="edit" report={report} />
      </main>
    </div>
  )
}
