"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { postJSON, API_URL } from "@/lib/api/api"

interface User {
  id: number
  username: string
  email: string
  role: string
  createtime: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  verifyResetToken: (token: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        })
        if (!res.ok) throw new Error("Phiên đăng nhập hết hạn")

        const data = await res.json()
        setToken(data.data.accessToken)
        setUser(data.data.user)
      } catch (err) {
        console.error("Auth init failed:", err)
        setUser(null)
        setToken(null)
      } finally {
        setIsLoading(false)
      }
    }
    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const data = await postJSON("/auth/signin", { email, password })
      setUser(data.data.user)
      setToken(data.data.accessToken)

      switch (data.data.user.role) {
        case "ADMIN":
          router.push("/admin")
          break
        case "USER":
          router.push("/resident")
          break
        case "ACCOUNTANT":
          router.push("/accountant")
          break
        default:
          router.push("/")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      throw new Error(error.message || "Đăng nhập thất bại")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await postJSON("/auth/signout", {})
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      setUser(null)
      setToken(null)
      router.push("/auth/login")
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true)
      const data = await postJSON("/auth/forgot-password", { email })
      console.log("forgot password:", data.data)
    } catch (error: any) {
      console.error("Forgot password error:", error)
      throw new Error(error.message || "Không thể gửi email khôi phục mật khẩu")
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setIsLoading(true)
      const data = await postJSON("/auth/reset-password", { token, newPassword })
      console.log("Reset password:", data.data)
    } catch (error: any) {
      console.error("Reset password error:", error)
      throw new Error(error.message || "Đặt lại mật khẩu thất bại")
    } finally {
      setIsLoading(false)
    }
  }

  const verifyResetToken = async (token: string) => {
    try {
      setIsLoading(true)
      const data = await postJSON("/auth/verify-reset-token", { token })
      console.log("Verify token success:", data.data)
      return data.data
    } catch (error: any) {
      console.error("Verify token error:", error)
      throw new Error(error.message || "Token không hợp lệ hoặc đã hết hạn")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, forgotPassword, verifyResetToken, resetPassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}


