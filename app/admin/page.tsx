"use client"

import { useState, useEffect } from "react"
import { HouseholdTable } from "@/components/admin/household-table"
import { HouseholdDetailModal } from "@/components/admin/household-detail-modal"
import { useAdmin } from "@/lib/context/admin-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, ChevronRight, Search, 
  Building2, Users, FileClock, Home, // Import các icon mới
} from "lucide-react"
import { getAdminDashboardStats } from "@/lib/api/api"
import { useAuth } from "@/lib/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Component hiển thị thẻ thống kê (đã chỉnh màu dịu)
function StatCard({ title, value, subtext, icon: Icon, colorClass, bgClass }: any) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {/* Icon được bọc trong nền nhạt, màu icon đậm */}
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {subtext}
        </p>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  const { households, loading, meta, setPage, setSearch, searchQuery } = useAdmin()
  const { token } = useAuth()
  const [selectedHousehold, setSelectedHousehold] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tempSearch, setTempSearch] = useState(searchQuery)
  
  const [stats, setStats] = useState({
    totalHouseholds: 0,
    occupiedHouseholds: 0,
    totalResidents: 0,
    pendingRequests: 0,
  })

  useEffect(() => {
    if (token) {
      getAdminDashboardStats(token).then((res: any) => {
        if (res.data) setStats(res.data) 
      }).catch(err => console.error("Lỗi tải thống kê:", err))
    }
  }, [token])

  const handleDetailClick = (household: any) => {
    setSelectedHousehold(household)
    setIsDialogOpen(true)
  }

  const handleSearch = () => {
    setPage(1)
    setSearch(tempSearch)
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* PHẦN 1: HEADER & DASHBOARD STATS */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tổng quan Quản trị</h1>
            <p className="text-muted-foreground">Hệ thống quản lý cư dân và hộ gia đình</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Tổng căn hộ" 
              value={stats.totalHouseholds} 
              subtext="Tổng số căn trong hệ thống"
              icon={Building2} // Icon tòa nhà
              bgClass="bg-blue-100" // Nền xanh nhạt
              colorClass="text-blue-600" // Icon xanh đậm
            />
            <StatCard 
              title="Căn hộ đang ở" 
              value={stats.occupiedHouseholds} 
              subtext={`${stats.totalHouseholds ? ((stats.occupiedHouseholds/stats.totalHouseholds)*100).toFixed(1) : 0}% công suất`}
              icon={Home} // Icon ngôi nhà
              bgClass="bg-orange-100"
              colorClass="text-orange-600"
            />
            <StatCard 
              title="Tổng cư dân" 
              value={stats.totalResidents} 
              subtext="Đang sinh sống"
              icon={Users} // Icon nhóm người
              bgClass="bg-green-100"
              colorClass="text-green-600"
            />
            <StatCard 
              title="Khai báo chờ duyệt" 
              value={stats.pendingRequests} 
              subtext="Cần xử lý ngay"
              icon={FileClock} // Icon file có đồng hồ
              bgClass="bg-red-100"
              colorClass="text-red-600"
            />
          </div>
        </div>

        {/* PHẦN 2: DANH SÁCH HỘ GIA ĐÌNH (BỌC TRONG CARD) */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Danh sách Hộ gia đình</CardTitle>
                <CardDescription>Quản lý thông tin chi tiết các hộ dân</CardDescription>
              </div>
              
              {/* Khu vực Tìm kiếm nằm ngay trong Header của Card */}
              <div className="flex w-full md:w-auto items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Tìm theo tên, số căn..."
                    className="pl-8 w-[250px] lg:w-[300px]"
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch}>Tìm kiếm</Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64 border rounded-md bg-background">
                <div className="text-muted-foreground flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Đang tải dữ liệu...
                </div>
              </div>
            ) : (
              <>
                <HouseholdTable households={households} onDetailClick={handleDetailClick} />
                
                {/* Phân trang */}
                <div className="flex items-center justify-end space-x-2 py-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Trang {meta.page} / {meta.totalPages} (Tổng {meta.total} hộ)
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(meta.page - 1)}
                      disabled={meta.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(meta.page + 1)}
                      disabled={meta.page >= meta.totalPages}
                    >
                      Sau <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <HouseholdDetailModal 
        household={selectedHousehold} 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </main>
  )
}