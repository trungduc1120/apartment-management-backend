"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user has allowed role
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on user's actual role
        if (user.role === "ADMIN") {
          router.push("/admin")
        } else if (user.role === "USER") {
          router.push("/resident")
        } else if (user.role === "ACCOUNTANT") {
          router.push("/accountant")
        } else {
          router.push("/")
        }
      }
    }
  }, [user, isLoading, allowedRoles, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show nothing (will redirect)
  if (!user) {
    return null
  }

  // Wrong role - show nothing (will redirect)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  // Authenticated and has correct role - show content
  return <>{children}</>
}
