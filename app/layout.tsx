import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "@/components/ui/toaster"
import './globals.css'

export const metadata: Metadata = {
  title:'Monitoring RAM Civil PEP Field Subang',
  description: 'Sistem Monitoring RAM Civil untuk PEP Field Subang - Manajemen Kontrak, SPK, dan Notifikasi',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
