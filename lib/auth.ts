import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export type AppRole = "admin" | "guest"

export async function getServerSupabase() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.set(name, "", { ...options, maxAge: 0 })
        },
      },
    },
  )
  return supabase
}

export async function getUserAndRole() {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null as AppRole | null }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  const role = (profile?.role as AppRole | undefined) ?? "guest"
  return { user, role }
}

export async function requireAdmin() {
  const { user, role } = await getUserAndRole()
  return { isAuthenticated: !!user, isAdmin: role === "admin", role }
}
