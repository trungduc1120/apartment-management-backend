import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/lib/context/auth-context"
import { HouseholdProvider } from "@/lib/context/household-context"
import { Suspense } from "react"
import { AdminProvider } from "@/lib/context/admin-context"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Hệ thống quản lý hộ khẩu",
  description: "Ứng dụng quản lý hộ khẩu hỗ trợ tiếng Việt đầy đủ",
}

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-background text-foreground`}>
        <Suspense fallback={<div>Đang tải...</div>}>
          <AuthProvider>
            <HouseholdProvider>
              <AdminProvider>{children}</AdminProvider>
            </HouseholdProvider>
          </AuthProvider>
        </Suspense>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
