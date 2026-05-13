"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useState } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminSidebar onCollapseChange={(c) => setCollapsed(c)} />
      <div className={`${collapsed ? "lg:pl-16" : "lg:pl-64"} transition-all duration-200 ease-in-out`}>
        {children}
      </div>
    </ProtectedRoute>
  )
}
