"use client"

import React, { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { HouseholdProvider } from "@/lib/context/household-context"
import { ResidentSidebar } from "@/components/resident/resident-sidebar"
import { useAuth } from "@/lib/context/auth-context"
import { FeeProvider } from "@/lib/context/fee-context"

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  return (
    <FeeProvider>
      <HouseholdProvider>
        <ProtectedRoute allowedRoles={["USER"]}>
          <div className="min-h-screen bg-background">
            <ResidentSidebar userName={user?.username ?? ""} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

            <main className={`transition-all duration-300 px-4 py-8 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
              {children}
            </main>
          </div>
        </ProtectedRoute>
      </HouseholdProvider>
    </FeeProvider>
    
  )
}
