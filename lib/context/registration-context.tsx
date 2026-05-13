"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { getTempAbsents, createTempAbsent, deleteTempAbsent } from "@/lib/api/api"

interface RegistrationContextType {
  tempAbsents: any[]
  isLoading: boolean
  refreshTempAbsents: () => Promise<void>
  createTempAbsent: (data: any) => Promise<void>
  deleteTempAbsent: (id: number | string) => Promise<void>
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined)

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const { token, isLoading: isAuthLoading } = useAuth()
  const [tempAbsents, setTempAbsents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshTempAbsents = async () => {
    if (!token) {
      setTempAbsents([])
      return
    }
    setIsLoading(true)
    try {
      const res = await getTempAbsents(token)
      setTempAbsents(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      console.error("refreshTempAbsents error:", err)
      setTempAbsents([])
    } finally {
      setIsLoading(false)
    }
  }

  const createTempAbsentHandler = async (data: any) => {
    if (!token) throw new Error("Chưa đăng nhập")
    await createTempAbsent(data, token)
    await refreshTempAbsents()
  }

  const deleteTempAbsentHandler = async (id: number | string) => {
    if (!token) throw new Error("Chưa đăng nhập")
    await deleteTempAbsent(id, token)
    await refreshTempAbsents()
  }

  useEffect(() => {
    if (!isAuthLoading && token) {
      refreshTempAbsents()
    }
    if (!token) setTempAbsents([])
  }, [token, isAuthLoading])

  return (
    <RegistrationContext.Provider
      value={{ tempAbsents, isLoading, refreshTempAbsents, createTempAbsent: createTempAbsentHandler, deleteTempAbsent: deleteTempAbsentHandler }}>
      {children}
    </RegistrationContext.Provider>
  )
}

export function useRegistration() {
  const ctx = useContext(RegistrationContext)
  if (!ctx) throw new Error("useRegistration must be used within a RegistrationProvider")
  return ctx
}
