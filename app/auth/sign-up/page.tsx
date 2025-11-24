"use client"

import type React from "react"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Building2, Eye, EyeOff } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const emailSchema = z.string().email("Email tidak valid")
  const passwordSchema = z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .regex(/[A-Z]/, "Wajib mengandung 1 huruf besar")
    .regex(/[a-z]/, "Wajib mengandung 1 huruf kecil")
    .regex(/\d/, "Wajib mengandung 1 angka")
    .regex(/[^A-Za-z0-9]/, "Wajib mengandung 1 simbol")

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    // Client-side validation
    const emailCheck = emailSchema.safeParse(email)
    if (!emailCheck.success) {
      setError(emailCheck.error.issues[0]?.message || "Email tidak valid")
      setIsLoading(false)
      return
    }
    const pwdCheck = passwordSchema.safeParse(password)
    if (!pwdCheck.success) {
      setError(pwdCheck.error.issues[0]?.message || "Kata sandi tidak valid")
      setIsLoading(false)
      return
    }
    if (password !== repeatPassword) {
      setError("Konfirmasi kata sandi tidak cocok")
      setIsLoading(false)
      return
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      })
      if (signUpError) throw signUpError

      // Optional best-effort: upsert profile if session exists (RLS will allow)
      const { data: authData } = await supabase.auth.getUser()
      const uid = authData.user?.id
      if (uid) {
        await supabase
          .from("profiles")
          .upsert({ id: uid, email, role: "guest" }, { onConflict: "id", ignoreDuplicates: false })
      }

      router.push("/auth/sign-up-success")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat akun"
      // Map common errors to friendlier messages
      if (/registered|exists|duplicate|already/i.test(msg)) {
        setError("Email sudah terdaftar")
      } else if (/password/i.test(msg)) {
        setError("Kata sandi tidak memenuhi ketentuan keamanan")
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#9fe400] via-[#7bc800] to-[#5aa800] items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 right-32 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center">
          <div className="mb-8">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-2xl">
              <Building2 className="h-12 w-12 text-[#fd0017]" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">RAM Civil Monitoring</h1>
            <p className="text-xl text-white/90">PEP Field Subang Dashboard</p>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 mb-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9fe400]">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">RAM Civil</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Daftar</h1>
          </div>

          {/* Note Alert */}
          <div className="mb-6 rounded-lg border border-[#9fe400] bg-[#9fe400]/10 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Catatan</h3>
            <p className="text-sm text-gray-700">
              Akun baru akan dibuat sebagai Tamu (Guest). Untuk mendapatkan akses Administrator, silakan hubungi admin.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-2 block">
                Nama Lengkap
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder=""
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900 rounded-lg"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder=""
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900 rounded-lg"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900 rounded-lg pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="repeat-password" className="text-sm font-medium text-gray-700 mb-2 block">
                Ulangi Password
              </Label>
              <div className="relative">
                <Input
                  id="repeat-password"
                  type={showRepeatPassword ? "text" : "password"}
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900 rounded-lg pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showRepeatPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full h-12 bg-[#9fe400] hover:bg-[#8cd100] text-gray-900 font-semibold rounded-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Daftar"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-gray-900 hover:underline"
              >
                Masuk
              </Link>
            </p>
          </div>

          {/* Copyright */}
          <p className="mt-8 text-center text-xs text-gray-400">
            © 2025 RAM Civil Monitoring. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}