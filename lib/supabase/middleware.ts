import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const method = request.method.toUpperCase()

  // Allow auth and public pages
  const isAuthRoute = pathname.startsWith("/auth")
  const isPublicAsset = /^\/(favicon\.ico|robots\.txt)$/.test(pathname)

  if (!user && !isAuthRoute && !isPublicAsset) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (user) {
    // Fetch role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    const role = profile?.role ?? "guest"
    const isAdmin = role === "admin"

    // Determine if admin is required
    const isWriteMethod = method !== "GET"
    const adminPathPatterns = [
      /\/dashboard\/.*\/(new|edit|delete)/i,
      /\/dashboard\/.*\/spk\/.*\/(edit|notifikasi\/new)/i,
      /^\/api\/(?!public)/i,
    ]
    const requiresAdmin = isWriteMethod || adminPathPatterns.some((rx) => rx.test(pathname))

    if (requiresAdmin && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = "/forbidden"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
