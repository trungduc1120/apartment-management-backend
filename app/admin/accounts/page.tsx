"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"
import { apiRequest } from "@/lib/api/api"
import {
  StateMap,
  RoleMap,
  HouseHoldStatusMap,
  InformationStatusMap,
  GenderMap,
  RelationshipToHeadMap,
  ResidenceStatusMap,
  getDisplayValue,
} from "@/lib/enums"

interface UserAccount {
  id: number
  username: string
  email: string
  role: string
  state: "INACTIVE" | "ACTIVE" | "DELETED"
  HouseHolds?: {
    apartmentNumber: string
    head?: {
      fullname: string
    }
  }
}

interface ApiResponseData {
  items: UserAccount[]
  total: number
  page: number
  limit: number
  totalPages: number
}
interface ApiResponse {
  data: ApiResponseData
}

interface ResidentInfo {
  id?: number
  residentId?: number
  fullname: string
  nationalId: string
  phoneNumber?: string
  email?: string
  dateOfBirth?: string
  gender?: string
  relationshipToHead?: string
  residentStatus?: string
  informationStatus?: string
}

interface HeadInfo {
  id: number
  fullname: string
  nationalId: string
}

interface HouseHoldDetails {
  id: number
  houseHoldCode?: number | string
  apartmentNumber?: string
  buildingNumber?: string
  street?: string
  ward?: string
  province?: string
  status?: string
  informationStatus?: string
  createtime?: string
  head?: HeadInfo
  resident?: ResidentInfo[]
}

interface UserDetails {
  id: number
  username: string
  email: string
  role: string
  state: "INACTIVE" | "ACTIVE" | "DELETED"
  createtime?: string
  HouseHolds?: HouseHoldDetails
}

export default function AccountsAndApartmentsPage() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<"accounts" | "details">("accounts")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentSearchTerm, setCurrentSearchTerm] = useState("")
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [createCount, setCreateCount] = useState<number>(1)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detail, setDetail] = useState<UserDetails | null>(null)
  const [detailTab, setDetailTab] = useState<"info" | "residents">("info")
  const [householdDetailsOpen, setHouseholdDetailsOpen] = useState(false)
  const [householdChangeData, setHouseholdChangeData] = useState<any>(null)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  
  // Role assignment
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"USER" | "ADMIN" | "ACCOUNTANT">("USER")
  const [roleLoading, setRoleLoading] = useState(false)
  const [roleMessage, setRoleMessage] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  // Resident approval states
  const [residentDetailsOpen, setResidentDetailsOpen] = useState(false)
  const [residentChangeData, setResidentChangeData] = useState<any>(null)
  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(null)
  const [residentApprovalLoading, setResidentApprovalLoading] = useState(false)
  const [residentApprovalMessage, setResidentApprovalMessage] = useState<string | null>(null)
  const [residentRejectionReason, setResidentRejectionReason] = useState("")
  const [stateFilter, setStateFilter] = useState<string>("ALL")

  const loadAccounts = useCallback(async (search?: string, state?: string) => {
    setLoading(true)
    setError(null)
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ""
      const stateParam = state && state !== "ALL" ? `&state=${state}` : ""
      setCurrentSearchTerm(search || "")
      const res = await apiRequest(`/user/all?page=${page}&limit=${limit}${searchParam}${stateParam}`, "GET", undefined, token ?? undefined)
      const data = res as ApiResponse
      const inner = data.data
      setAccounts(inner.items || [])
      setTotal(Number(inner.total || 0))
      setTotalPages(Number(inner.totalPages || 1))
      if (page > Number(inner.totalPages || 1)) {
        setPage(Number(inner.totalPages || 1))
      }
    } catch (err: any) {
      setError(err?.message || "System error")
    } finally {
      setLoading(false)
    }
  }, [token, page, limit])

  

  useEffect(() => {
    if (token) {
      void loadAccounts(currentSearchTerm, stateFilter)
    }
  }, [token, page, limit, stateFilter])

  // Search is now done server-side via API
  const filteredAccounts = accounts

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAccounts.map(acc => acc.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectId = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    
    setLoading(true)
    setError(null)
    try {
      await apiRequest("/user/delete", "DELETE", { ids: Array.from(selectedIds) }, token ?? undefined)
      setSelectedIds(new Set())
      setConfirmDeleteOpen(false)
      await loadAccounts()
    } catch (err: any) {
      setError(err?.message || "System error")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = () => {
    setConfirmDeleteOpen(true)
  }

  const openDetails = async (id: number) => {
    setDetailLoading(true)
    setDetailError(null)
    setDetail(null)
    setResetMessage(null)
    try {
      const res = await apiRequest(`/user/${id}`, "GET", undefined, token ?? undefined)
      console.log("[Accounts] Details API response:", res)
      // Handle both { data: {...} } and direct {...} response
      const userData = (res as any)?.data || res
      console.log("[Accounts] Parsed user data:", userData)
      setDetail(userData as UserDetails)
      setActiveTab("details")
    } catch (err: any) {
      setDetailError(err?.message || "System error")
    } finally {
      setDetailLoading(false)
    }
  }

  const handleResetPassword = async (id: number) => {
    setResetLoading(true)
    setResetMessage(null)
    try {
      const res = await apiRequest(`/user/reset-password/${id}`, "POST", undefined, token ?? undefined)
      const msg = (res && (res.message || res.data?.message)) || "Reset mật khẩu thành công"
      setResetMessage(msg)
    } catch (err: any) {
      const msg = err?.message || "System error"
      setResetMessage(msg)
    } finally {
      setResetLoading(false)
    }
  }

  const handleOpenRoleDialog = () => {
    if (detail) {
      setSelectedRole(detail.role as "USER" | "ADMIN" | "ACCOUNTANT")
      setRoleMessage(null)
      setRoleDialogOpen(true)
    }
  }

  const handleAssignRole = async () => {
    if (!detail?.id) return
    
    setRoleLoading(true)
    setRoleMessage(null)
    try {
      await apiRequest("/user/role-update", "PATCH", { userId: detail.id, role: selectedRole }, token ?? undefined)
      setRoleMessage("Đổi quyền thành công")
      // Update detail
      setDetail({ ...detail, role: selectedRole })
      // Reload accounts list
      await loadAccounts()
      setTimeout(() => {
        setRoleDialogOpen(false)
      }, 1500)
    } catch (err: any) {
      setRoleMessage(err?.message || "System error")
    } finally {
      setRoleLoading(false)
    }
  }

  const handleCheckHouseholdChanges = async () => {
    if (!detail?.HouseHolds?.id) {
      setApprovalMessage("Không có hộ gia đình để kiểm tra")
      return
    }
    setApprovalLoading(true)
    setApprovalMessage(null)
    setHouseholdChangeData(null)
    try {
      const res = await apiRequest(`/user/details-household-change/${detail.HouseHolds.id}`, "GET", undefined, token ?? undefined)
      setHouseholdChangeData(res?.data || res)
      setHouseholdDetailsOpen(true)
    } catch (err: any) {
      setApprovalMessage(err?.message || "System error")
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleApproveHouseholdChange = async () => {
    if (!householdChangeData?.id) {
      setApprovalMessage("Không có ID thay đổi hộ gia đình")
      return
    }
    setApprovalLoading(true)
    setApprovalMessage(null)
    try {
      const res = await apiRequest(`/user/approve-household-change/${householdChangeData.id}`, "POST", { state: "APPROVED" }, token ?? undefined)
      setApprovalMessage("Duyệt thông tin thành công")
      setHouseholdDetailsOpen(false)
      setRejectionReason("")
      await openDetails(detail?.id!)
    } catch (err: any) {
      setApprovalMessage(err?.message || "System error")
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleRejectHouseholdChange = async () => {
    if (!rejectionReason.trim()) {
      setApprovalMessage("Vui lòng nhập lý do từ chối")
      return
    }
    if (!householdChangeData?.id) {
      setApprovalMessage("Không có ID thay đổi hộ gia đình")
      return
    }
    setApprovalLoading(true)
    setApprovalMessage(null)
    try {
      const res = await apiRequest(`/user/approve-household-change/${householdChangeData.id}`, "POST", { state: "REJECTED", reason: rejectionReason }, token ?? undefined)
      setApprovalMessage("Từ chối thông tin thành công")
      setRejectionReason("")
      setHouseholdDetailsOpen(false)
      await openDetails(detail?.id!)
    } catch (err: any) {
      setApprovalMessage(err?.message || "System error")
    } finally {
      setApprovalLoading(false)
    }
  }

  // Resident approval handlers
  const handleCheckResidentChanges = async (residentId: number) => {
    setSelectedResidentId(residentId)
    setResidentApprovalLoading(true)
    setResidentApprovalMessage(null)
    setResidentChangeData(null)
    try {
      const res = await apiRequest(`/user/details-resident-change/${residentId}`, "GET", undefined, token ?? undefined)
      setResidentChangeData(res?.data || res)
      setResidentDetailsOpen(true)
    } catch (err: any) {
      setResidentApprovalMessage(err?.message || "System error")
    } finally {
      setResidentApprovalLoading(false)
    }
  }

  const handleApproveResidentChange = async () => {
    if (!residentChangeData?.id) {
      setResidentApprovalMessage("Không có ID thay đổi thành viên")
      return
    }
    setResidentApprovalLoading(true)
    setResidentApprovalMessage(null)
    try {
      await apiRequest(`/user/approve-resident-change/${residentChangeData.id}`, "POST", { state: "APPROVED" }, token ?? undefined)
      setResidentApprovalMessage("Duyệt thông tin thành công")
      setResidentDetailsOpen(false)
      setResidentRejectionReason("")
      await openDetails(detail?.id!)
    } catch (err: any) {
      setResidentApprovalMessage(err?.message || "System error")
    } finally {
      setResidentApprovalLoading(false)
    }
  }

  const handleRejectResidentChange = async () => {
    if (!residentRejectionReason.trim()) {
      setResidentApprovalMessage("Vui lòng nhập lý do từ chối")
      return
    }
    if (!residentChangeData?.id) {
      setResidentApprovalMessage("Không có ID thay đổi thành viên")
      return
    }
    setResidentApprovalLoading(true)
    setResidentApprovalMessage(null)
    try {
      await apiRequest(`/user/approve-resident-change/${residentChangeData.id}`, "POST", { state: "REJECTED", reason: residentRejectionReason }, token ?? undefined)
      setResidentApprovalMessage("Từ chối thông tin thành công")
      setResidentRejectionReason("")
      setResidentDetailsOpen(false)
      await openDetails(detail?.id!)
    } catch (err: any) {
      setResidentApprovalMessage(err?.message || "System error")
    } finally {
      setResidentApprovalLoading(false)
    }
  }

  const handleCreateAccounts = async () => {
    setCreateError(null)
    if (!createCount || createCount < 1) {
      setCreateError("Số lượng phải >= 1")
      return
    }
    if (createCount > 50) {
      setCreateError("Chỉ tạo tối đa 50 tài khoản một lần")
      return
    }
    setCreateLoading(true)
    try {
      await apiRequest("/user/create-accounts", "POST", { num: createCount }, token ?? undefined)
      setCreateOpen(false)
      setCreateCount(1)
      await loadAccounts()
    } catch (err: any) {
      setCreateError(err?.message || "System error")
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <main className="container mx-auto py-4 px-8">
      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`py-2 px-1 border-b-2 font-semibold text-2xl ${
              activeTab === "accounts"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            Danh sách tài khoản
          </button>
          {detail && (
            <button
              onClick={() => setActiveTab("details")}
              className={`py-2 px-1 border-b-2 font-semibold text-2xl ${
                activeTab === "details"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              Chi tiết
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "accounts" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>Tài khoản ({total})</CardTitle>
                <Select value={stateFilter} onValueChange={(value) => { setStateFilter(value); setPage(1) }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                    <SelectItem value="INACTIVE">Chưa kích hoạt</SelectItem>
                    <SelectItem value="DELETED">Đã xóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setCreateOpen(true)}>+ Tạo tài khoản mới</Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={selectedIds.size === 0 || loading}
                >
                  {selectedIds.size > 0 ? `Xóa (${selectedIds.size})` : "Xóa"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Input
                placeholder="Tìm kiếm theo email hoặc tên chủ hộ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1)
                    loadAccounts(searchTerm, stateFilter)
                  }
                }}
              />
              <Button
                onClick={() => {
                  setPage(1)
                  loadAccounts(searchTerm, stateFilter)
                }}
                disabled={loading}
              >
                {loading ? "Đang tìm..." : "Tìm kiếm"}
              </Button>
            </div>

            {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

            {!loading && currentSearchTerm && accounts.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                Không tìm thấy kết quả cho từ khóa "{currentSearchTerm}"
              </div>
            )}

            <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Xác nhận xóa tài khoản</DialogTitle>
                  <DialogDescription>
                    Bạn chắc chắn muốn xóa {selectedIds.size} tài khoản? Thao tác này không thể hoàn tác.
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter className="justify-end gap-2">
                  <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} disabled={loading}>
                    Hủy
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteSelected} disabled={loading || selectedIds.size === 0}>
                    {loading ? "Đang xóa..." : "Xóa"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {loading && <div>Đang tải...</div>}
            {!loading && (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.size > 0 && selectedIds.size === filteredAccounts.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Căn hộ</TableHead>
                      <TableHead>Chủ hộ</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account) => {
                      const apartment = account.HouseHolds
                      const apartmentNumber = apartment?.apartmentNumber
                      const ownerName = apartment?.head?.fullname
                      return (
                        <TableRow key={account.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(account.id)}
                              onChange={(e) => handleSelectId(account.id, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell>{account.email}</TableCell>
                          <TableCell>{getDisplayValue(account.role, RoleMap)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-sm ${
                              account.state === "ACTIVE" ? "bg-green-100 text-green-800" :
                              account.state === "INACTIVE" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {getDisplayValue(account.state, StateMap)}
                            </span>
                          </TableCell>
                          <TableCell>{apartmentNumber ? `Căn ${apartmentNumber}` : "-"}</TableCell>
                          <TableCell>{ownerName ?? "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => openDetails(account.id)}>
                              Chi tiết
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {!loading && filteredAccounts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Không tìm thấy tài khoản nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!loading && accounts.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Số hàng:</span>
                  {[10, 15, 20].map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant={n === limit ? undefined : "outline"}
                      onClick={() => {
                        setLimit(n)
                        setPage(1)
                      }}
                    >
                      {n}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const p = i + 1
                      return (
                        <Button
                          key={p}
                          size="sm"
                          variant={p === page ? undefined : "outline"}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Tiếp
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Details Tab */}
      {activeTab === "details" && detail && (
        <Card>
          {/* Detail Tabs */}
          <div className="border-b border-gray-200 flex items-start pl-6">
            <nav className="flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => setDetailTab("info")}
                className={`py-2 px-1 border-b-2 font-medium text-lg ${
                  detailTab === "info"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Thông tin chung
              </button>
              <button
                onClick={() => setDetailTab("residents")}
                className={`py-2 px-1 border-b-2 font-medium text-lg ${
                  detailTab === "residents"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Thành viên ({(detail?.HouseHolds?.resident ?? []).length})
              </button>
            </nav>
          </div>

          <CardContent className="pt-0 pl-6">
            {detailLoading && <div className="py-8 text-center">Đang tải chi tiết...</div>}
            {!detailLoading && detailError && (
              <div className="p-3 bg-red-50 text-red-700 rounded">{detailError}</div>
            )}
            {!detailLoading && !detailError && (
              <div>
                {/* Tab 1: Thông tin chung */}
                {detailTab === "info" && (
                  <div className="space-y-4 pt-4">
                    {/* Tài khoản info */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold text-base">Thông tin tài khoản</div>
                        <div className="flex gap-2">
                          {detail?.id && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenRoleDialog}
                                disabled={detail.state !== "ACTIVE"}
                              >
                                Cấp quyền
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetPassword(detail.id)}
                                disabled={resetLoading || detail.state !== "ACTIVE"}
                              >
                                {resetLoading ? "Đang reset..." : "Reset mật khẩu"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    {resetMessage && (
                      <div className="text-base text-muted-foreground mb-2">{resetMessage}</div>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-base">
                      <div>
                        <div className="text-muted-foreground">Username</div>
                        <div className="font-medium">{detail.username}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Email</div>
                        <div className="font-medium">{detail.email}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Vai trò</div>
                        <div className="font-medium">{getDisplayValue(detail.role, RoleMap)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Trạng thái</div>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          detail.state === "ACTIVE" ? "bg-green-100 text-green-800" :
                          detail.state === "INACTIVE" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {getDisplayValue(detail.state, StateMap)}
                        </span>
                      </div>
                      {detail.createtime && (
                        <div className="col-span-2">
                          <div className="text-muted-foreground">Ngày tạo</div>
                          <div className="font-medium">{new Date(detail.createtime).toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chủ hộ */}
                  {detail.HouseHolds?.head && (
                    <div className="border-t pt-4">
                      <div className="font-semibold mb-3 text-base">Chủ hộ</div>
                      <div className="grid grid-cols-2 gap-4 text-base">
                        <div>
                          <div className="text-muted-foreground">Họ tên</div>
                          <div className="font-medium">{detail.HouseHolds.head.fullname ?? "-"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">CMND/CCCD</div>
                          <div className="font-medium">{detail.HouseHolds.head.nationalId ?? "-"}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hộ gia đình */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-base">Hộ gia đình</div>
                      {detail.HouseHolds && (
                        <Button
                          size="sm"
                          onClick={handleCheckHouseholdChanges}
                          disabled={approvalLoading || detail.state !== "ACTIVE"}
                        >
                          {approvalLoading ? "Đang tải..." : "Duyệt thông tin"}
                        </Button>
                      )}
                    </div>
                    {detail.HouseHolds ? (
                      <div className="grid grid-cols-3 gap-4 text-base">
                        <div>
                          <div className="text-muted-foreground">Mã hộ</div>
                          <div className="font-medium">{detail.HouseHolds.houseHoldCode ?? "-"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Căn hộ</div>
                          <div className="font-medium">{detail.HouseHolds.apartmentNumber ? `Căn ${detail.HouseHolds.apartmentNumber}` : "-"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Tòa</div>
                          <div className="font-medium">{detail.HouseHolds.buildingNumber ?? "-"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Trạng thái</div>
                          <div className="font-medium">{getDisplayValue(detail.HouseHolds.status, HouseHoldStatusMap)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">T.T. thông tin</div>
                          <div className="font-medium">{getDisplayValue(detail.HouseHolds.informationStatus, InformationStatusMap)}</div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-muted-foreground">Địa chỉ</div>
                          <div className="font-medium text-base">{[detail.HouseHolds.street, detail.HouseHolds.ward, detail.HouseHolds.province].filter(Boolean).join(", ") || "-"}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-base">Không có thông tin hộ gia đình</div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Thành viên */}
              {detailTab === "residents" && (
                <div className="pt-4">
                  {(detail.HouseHolds?.resident ?? []).length > 0 ? (
                    <div className="border rounded-md overflow-x-auto w-full">
                      <Table className="text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-sm">Họ tên</TableHead>
                            <TableHead className="text-sm">CMND/CCCD</TableHead>
                            <TableHead className="text-sm">Điện thoại</TableHead>
                            <TableHead className="text-sm">Email</TableHead>
                            <TableHead className="text-sm">Ngày sinh</TableHead>
                            <TableHead className="text-sm">Giới tính</TableHead>
                            <TableHead className="text-sm">Quan hệ</TableHead>
                            <TableHead className="text-sm">Cư trú</TableHead>
                            <TableHead className="text-sm">T.T. thông tin</TableHead>
                            <TableHead className="text-sm">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(detail.HouseHolds?.resident ?? []).map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm">{r.fullname ?? "-"}</TableCell>
                            <TableCell className="text-sm">{r.nationalId ?? "-"}</TableCell>
                            <TableCell className="text-sm">{r.phoneNumber ?? "-"}</TableCell>
                            <TableCell className="text-sm">{r.email ?? "-"}</TableCell>
                            <TableCell className="text-sm">{r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString() : "-"}</TableCell>
                            <TableCell className="text-sm">
                              {getDisplayValue(r.gender, GenderMap)}
                            </TableCell>
                            <TableCell className="text-sm">{getDisplayValue(r.relationshipToHead, RelationshipToHeadMap)}</TableCell>
                            <TableCell className="text-sm">
                              {getDisplayValue(r.residentStatus, ResidenceStatusMap)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {getDisplayValue(r.informationStatus, InformationStatusMap)}
                            </TableCell>
                            <TableCell className="text-sm">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCheckResidentChanges(r.id ?? r.residentId!)}
                                disabled={r.informationStatus !== "PENDING" || (residentApprovalLoading && selectedResidentId === (r.id ?? r.residentId)) || detail.state !== "ACTIVE"}
                              >
                                {residentApprovalLoading && selectedResidentId === (r.id ?? r.residentId) ? "Đang tải..." : "Duyệt"}
                              </Button>
                            </TableCell>
                          </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-base py-8 text-center">Không có thành viên</div>
                  )}
                </div>
              )}
            </div>
          )}
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo tài khoản mới</DialogTitle>
            <DialogDescription>Nhập số lượng tài khoản muốn tạo (tối đa 50).</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Lưu ý:</strong> Mật khẩu mặc định của các tài khoản tạo mới sẽ là <code className="bg-background px-1 py-0.5 rounded font-mono">123456</code>
            </div>
            <div className="space-y-1">
              <Label htmlFor="account-count">Số lượng</Label>
              <Input
                id="account-count"
                type="number"
                min={1}
                max={50}
                value={createCount}
                onChange={(e) => setCreateCount(Number(e.target.value))}
              />
              {createError && <div className="text-sm text-destructive">{createError}</div>}
            </div>
          </div>

          <DialogFooter className="justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Hủy</Button>
            <Button onClick={handleCreateAccounts} disabled={createLoading}>
              {createLoading ? "Đang tạo..." : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Household Approval Dialog */}
      <Dialog open={householdDetailsOpen} onOpenChange={setHouseholdDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Duyệt thông tin hộ gia đình</DialogTitle>
            <DialogDescription>Kiểm tra và duyệt/từ chối thay đổi thông tin hộ gia đình</DialogDescription>
          </DialogHeader>

          {approvalMessage && (
            <Alert variant={approvalMessage.includes("thành công") ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{approvalMessage}</AlertDescription>
            </Alert>
          )}

          {householdChangeData && (
            <div className="space-y-4">
              <div className="border rounded p-4 space-y-3">
                <div>
                  <span className="text-muted-foreground">Lý do thay đổi:</span>
                  <p className="font-medium">{householdChangeData.updateReason || "-"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Lý do từ chối (nếu từ chối)</Label>
                <Input
                  id="rejection-reason"
                  placeholder="Nhập lý do từ chối..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="justify-end gap-2">
            <Button variant="outline" onClick={() => setHouseholdDetailsOpen(false)} disabled={approvalLoading}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectHouseholdChange}
              disabled={approvalLoading}
            >
              {approvalLoading ? "Đang xử lý..." : "Từ chối"}
            </Button>
            <Button
              onClick={handleApproveHouseholdChange}
              disabled={approvalLoading}
            >
              {approvalLoading ? "Đang xử lý..." : "Duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resident Approval Dialog */}
      <Dialog open={residentDetailsOpen} onOpenChange={setResidentDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Duyệt thông tin thành viên</DialogTitle>
            <DialogDescription>Kiểm tra và duyệt/từ chối thay đổi thông tin thành viên</DialogDescription>
          </DialogHeader>

          {residentApprovalMessage && (
            <Alert variant={residentApprovalMessage.includes("thành công") ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{residentApprovalMessage}</AlertDescription>
            </Alert>
          )}

          {residentChangeData && (
            <div className="space-y-4">
              <div className="border rounded p-4 space-y-3">
                <div>
                  <span className="text-muted-foreground">Lý do thay đổi:</span>
                  <p className="font-medium">{residentChangeData.updateReason || "-"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resident-rejection-reason">Lý do từ chối (bắt buộc nếu từ chối)</Label>
                <Input
                  id="resident-rejection-reason"
                  placeholder="Nhập lý do từ chối..."
                  value={residentRejectionReason}
                  onChange={(e) => setResidentRejectionReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="justify-end gap-2">
            <Button variant="outline" onClick={() => setResidentDetailsOpen(false)} disabled={residentApprovalLoading}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectResidentChange}
              disabled={residentApprovalLoading}
            >
              {residentApprovalLoading ? "Đang xử lý..." : "Từ chối"}
            </Button>
            <Button
              onClick={handleApproveResidentChange}
              disabled={residentApprovalLoading}
            >
              {residentApprovalLoading ? "Đang xử lý..." : "Duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Assignment Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cấp quyền tài khoản</DialogTitle>
            <DialogDescription>
              Chọn quyền cho tài khoản <span className="font-medium">{detail?.username}</span>
            </DialogDescription>
          </DialogHeader>

          {roleMessage && (
            <Alert variant={roleMessage.includes("thành công") ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{roleMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-select">Quyền hạn</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as "USER" | "ADMIN" | "ACCOUNTANT")}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Chọn quyền" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User - Người dùng</SelectItem>
                  <SelectItem value="ADMIN">Admin - Quản trị viên</SelectItem>
                  <SelectItem value="ACCOUNTANT">Accountant - Kế toán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="justify-end gap-2">
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} disabled={roleLoading}>
              Hủy
            </Button>
            <Button onClick={handleAssignRole} disabled={roleLoading}>
              {roleLoading ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
