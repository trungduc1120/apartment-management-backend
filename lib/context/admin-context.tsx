"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { adminGetAllHouseholds } from "@/lib/api/api"
import { useAuth } from "./auth-context" // Giả sử path này đúng
import { io, Socket } from "socket.io-client"

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface AdminContextType {
  households: any[]
  loading: boolean
  refresh: () => void
  meta: PaginationMeta
  setPage: (page: number) => void
  setSearch: (search: string) => void
  searchQuery: string
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [households, setHouseholds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // State mới cho phân trang và tìm kiếm
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10) // Mặc định 10 dòng
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  })

  const { token } = useAuth()

  // Dùng useCallback để tránh render loop khi đưa vào dependency array
  const fetchHouseholds = useCallback(async () => {
    if (!token) return 
    try {
      setLoading(true)
      // Gọi API với tham số
      const result = await adminGetAllHouseholds(token, { page, limit, search: searchQuery })
      
      if (result.success && result.data) {
        // UPDATE QUAN TRỌNG: Dữ liệu nằm trong result.data.data
        setHouseholds(result.data.data || [])
        
        // Cập nhật thông tin phân trang từ result.data.meta
        if (result.data.meta) {
          setMeta(result.data.meta)
        }
      }
    } catch (err) {
      console.error("Lỗi tải danh sách hộ:", err)
    } finally {
      setLoading(false)
    }
  }, [token, page, limit, searchQuery])

  // Effect khi token, page hoặc search thay đổi
  useEffect(() => {
    fetchHouseholds()
  }, [fetchHouseholds])

  // WebSocket logic
  useEffect(() => {
    if (!token) return

    const socket: Socket = io("http://localhost:3000/admin", {
      auth: { token }, 
      transports: ["websocket"], 
    })

    socket.on("connect", () => {
      console.log("Connected to Admin WebSocket", socket.id)
    })

    socket.on("household_updated", (data) => {
      console.log("household_updated:", data)
      fetchHouseholds() // Refresh lại list khi có update
    })

    return () => {
      socket.disconnect()
    }
  }, [token, fetchHouseholds])

  return (
    <AdminContext.Provider value={{ 
      households, 
      loading, 
      refresh: fetchHouseholds,
      meta,
      setPage,
      setSearch: setSearchQuery,
      searchQuery
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider")
  return ctx
}