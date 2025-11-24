"use client"

import { Button } from "@/components/ui/button"
import { Building2, LogOut, Plus, Menu, X, Home } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  userName: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [role, setRole] = useState<"admin" | "guest">("guest")

  useEffect(() => {
    const supabase = createClient()

    let channel: ReturnType<typeof supabase.channel> | null = null

    const loadRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (!error && data?.role) {
        setRole(data.role === "admin" ? "admin" : "guest")
      }

      channel = supabase
        .channel("user-role")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            const nextRole = (payload.new as any)?.role ?? (payload.old as any)?.role
            if (nextRole) {
              setRole(nextRole === "admin" ? "admin" : "guest")
            }
          },
        )
        .subscribe()
    }

    loadRole()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/kontrak/new", label: "Kontrak Baru", icon: Plus },
  ]

  const roleLabel = role === "admin" ? "Administrator" : "Tamu"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-md">
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex h-16 items-center justify-between">
          {/* Left: Brand */}
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#9fe400]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                RAM Civil Monitoring
              </h1>
              <p className="text-xs text-gray-600">PEP Field Subang</p>
            </div>
          </Link>

          {/* Center: Navigation Items */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    isActive
                      ? "bg-[#0073fe] text-white hover:bg-[#0062d9]"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                  )}
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </nav>

          {/* Right: User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-600">{roleLabel}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push("/auth/login")
                router.refresh()
              }}
              className="border-[#fd0017] text-[#fd0017] hover:bg-[#fd0017] hover:text-white bg-transparent transition-all"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden h-16 items-center justify-between">
          {/* Left: Brand */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9fe400]">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">
                RAM Civil Monitoring
              </h1>
              <p className="text-xs text-gray-600">PEP Field Subang</p>
            </div>
          </Link>

          {/* Right: User Name & Hamburger */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-900">{userName.split(" ")[0]}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9 p-0 text-gray-700 hover:text-[#0073fe]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#0073fe] text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}

              {/* Logout in Mobile Menu */}
              <button
                onClick={async () => {
                  setMobileMenuOpen(false)
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push("/auth/login")
                  router.refresh()
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-[#fd0017] hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Keluar
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* New Report Button - Fixed at Bottom (Mobile Only) */}
      <Link
        href="/dashboard/kontrak/new"
        className="md:hidden fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#9fe400] text-gray-900 shadow-lg hover:bg-[#8cd100] transition-colors"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </header>
  )
}