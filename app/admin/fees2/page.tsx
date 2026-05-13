"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { apiRequest } from "@/lib/api/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Eye, Upload } from "lucide-react"

interface Fee {
  id: number
  name: string
  description?: string
  isMandatory?: boolean
  frequency: "ONE_TIME" | "MONTHLY" | "YEARLY"
  rate?: number
  calculationBase: "PER_PERSON" | "PER_HOUSEHOLD" | "PER_MOTORBIKE" | "PER_CAR"
  anchorDay?: number
  anchorMonth?: number
  status?: "ACTIVE" | "PAUSED"
  createdAt?: string
}

interface FeeAssignment {
  id: number
  feeId: number
  householdId: number
  amountDue: number
  startDate: string
  dueDate: string
  isPaid: boolean
  household: {
    id: number
    houseHoldCode: number
    apartmentNumber: string
    head: {
      fullname: string
    }
  }
  Payment?: {
    status: "PENDING" | "APPROVED" | "REJECTED" | string
  } | null
}

interface FeeDetail extends Fee {
  statistics?: {
    totalAmount: number
    collectedAmount: number
    totalHouseholds: number
    paidHouseholds: number
  }
  assignments?: {
    data: FeeAssignment[]
    meta?: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

interface PaymentDetail {
  feeId: number
  Payment: {
    id: number
    feeAssignmentId: number
    amountPaid: number
    imageUrl: string
    imagePath: string
    status: "PENDING" | "APPROVED" | "REJECTED" | string
    paidDate: string
    note?: string | null
  } | null
}

interface FeeResponse {
  data: Fee[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface RepeatFee {
  id: number
  name: string
  description?: string
  isMandatory?: boolean
  frequency: "MONTHLY" | "YEARLY"
  rate?: number
  calculationBase: "PER_PERSON" | "PER_HOUSEHOLD" | "PER_MOTORBIKE" | "PER_CAR"
  anchorDay?: number
  anchorMonth?: number
  status?: "ACTIVE" | "PAUSED"
  createdAt?: string
}

export default function Fees2Page() {
  const { token } = useAuth()
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Tabs
  const [activeTab, setActiveTab] = useState<"list" | "repeat" | "detail">("list")
  
  // Repeat fees
  const [repeatFees, setRepeatFees] = useState<RepeatFee[]>([])
  const [repeatFeesLoading, setRepeatFeesLoading] = useState(false)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // Search
  const [searchTerm, setSearchTerm] = useState("")
  const [currentSearchTerm, setCurrentSearchTerm] = useState("")

  // Detail/Edit form
  const [selectedFee, setSelectedFee] = useState<FeeDetail | null>(null)
  const [assignments, setAssignments] = useState<FeeAssignment[]>([])
  const [assignmentPage, setAssignmentPage] = useState(1)
  const [assignmentLimit, setAssignmentLimit] = useState(10)
  const [assignmentTotal, setAssignmentTotal] = useState(0)
  const [assignmentTotalPages, setAssignmentTotalPages] = useState(1)
  const [assignmentFilter, setAssignmentFilter] = useState<"ALL" | "true" | "false">("ALL")
  const [detailLoading, setDetailLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isMandatory: true,
    frequency: "MONTHLY" as "ONE_TIME" | "MONTHLY" | "YEARLY",
    rate: "",
    calculationBase: "PER_HOUSEHOLD" as "PER_PERSON" | "PER_HOUSEHOLD" | "PER_MOTORBIKE" | "PER_CAR",
    anchorDay: "",
    anchorMonth: "",
    dueDate: ""
  })
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false)

  // Import Excel
  const [importLoading, setImportLoading] = useState(false)
  const [fileImported, setFileImported] = useState(false)
  const [importedFile, setImportedFile] = useState<File | null>(null)

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentDetail, setPaymentDetail] = useState<PaymentDetail | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [rejectNote, setRejectNote] = useState("")
  const [paymentActionLoading, setPaymentActionLoading] = useState(false)
  const [approveAmount, setApproveAmount] = useState<string>("")

  const loadFees = async (search?: string) => {
    setLoading(true)
    setError(null)
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ""
      setCurrentSearchTerm(search || "")
      const res = await apiRequest(`/fee/all?page=${page}&limit=${limit}${searchParam}`, "GET", undefined, token ?? undefined)
      
      // Backend returns: { data: { data: [...], meta: {...} } }
      const apiResponse = (res as any)?.data || res
      
      setFees(apiResponse.data || [])
      setTotal(apiResponse.meta?.total || 0)
      setTotalPages(apiResponse.meta?.totalPages || 1)
    } catch (err: any) {
      setError(err?.message || "Không thể tải danh sách phí")
    } finally {
      setLoading(false)
    }
  }

  const loadRepeatFees = async () => {
    setRepeatFeesLoading(true)
    try {
      const res = await apiRequest("/fee/repeat-fee", "GET", undefined, token ?? undefined)
      const data = (res as any)?.data || res
      setRepeatFees(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err?.message || "Không thể tải danh sách phí lặp lại")
    } finally {
      setRepeatFeesLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadFees(currentSearchTerm)
    }
  }, [token, page, limit])

  useEffect(() => {
    if (token && activeTab === "repeat") {
      loadRepeatFees()
    }
  }, [token, activeTab])

  const handleOpenCreateDialog = () => {
    setFormData({
      name: "",
      description: "",
      isMandatory: true,
      frequency: "MONTHLY",
      rate: "",
      calculationBase: "PER_HOUSEHOLD",
      anchorDay: "",
      anchorMonth: "",
      dueDate: ""
    })
    setFileImported(false)
    setImportedFile(null)
    setDialogOpen(true)
  }

  const handleOpenDetail = async (fee: Fee) => {
    setActiveTab("detail")
    setDetailLoading(true)
    setUpdateMessage(null)
    setAssignmentPage(1)
    setAssignmentFilter("ALL")
    
    try {
      const res = await apiRequest(`/fee/${fee.id}/detail?page=1&limit=${assignmentLimit}`, "GET", undefined, token ?? undefined)
      const feeDetail = (res as any)?.data || res
      
      setSelectedFee(feeDetail)
      setFormData({
        name: feeDetail.name,
        description: feeDetail.description || "",
        isMandatory: feeDetail.isMandatory ?? true,
        frequency: feeDetail.frequency,
        rate: feeDetail.rate?.toString() || "",
        calculationBase: feeDetail.calculationBase,
        anchorDay: feeDetail.anchorDay?.toString() || "",
        anchorMonth: feeDetail.anchorMonth?.toString() || "",
        dueDate: ""
      })
      
      // Set assignments data
      const assignmentsData = feeDetail.assignments?.data || []
      const assignmentsMeta = feeDetail.assignments?.meta
      setAssignments(assignmentsData)
      setAssignmentTotal(assignmentsMeta?.total || assignmentsData.length)
      setAssignmentTotalPages(assignmentsMeta?.totalPages || 1)
    } catch (err: any) {
      setUpdateMessage({ type: "error", text: err?.message || "Không thể tải chi tiết phí" })
    } finally {
      setDetailLoading(false)
    }
  }

  const loadAssignments = async (feeId: number, pageNum: number, isPaidFilter?: string) => {
    setDetailLoading(true)
    try {
      const isPaidParam = isPaidFilter && isPaidFilter !== "ALL" ? `&isPaid=${isPaidFilter}` : ""
      const res = await apiRequest(`/fee/${feeId}/detail?page=${pageNum}&limit=${assignmentLimit}${isPaidParam}`, "GET", undefined, token ?? undefined)
      const feeDetail = (res as any)?.data || res
      
      const assignmentsData = feeDetail.assignments?.data || []
      const assignmentsMeta = feeDetail.assignments?.meta
      setAssignments(assignmentsData)
      setAssignmentTotal(assignmentsMeta?.total || assignmentsData.length)
      setAssignmentTotalPages(assignmentsMeta?.totalPages || 1)

      setSelectedFee(prev => {
        if (!prev) return feeDetail;
        return {
          ...prev,
          statistics: feeDetail.statistics
        };
      });
    } catch (err: any) {
      setUpdateMessage({ type: "error", text: err?.message || "Không thể tải danh sách gán phí" })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleBackToList = () => {
    setActiveTab("list")
    setSelectedFee(null)
    setUpdateMessage(null)
  }

  const handleTabChange = (tab: "list" | "repeat" | "detail") => {
    if (tab !== "detail") {
      setSelectedFee(null)
      setUpdateMessage(null)
    }
    setActiveTab(tab)
  }

  const handleDeleteRepeatFee = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn tạm dừng phí lặp lại này?")) return

    setRepeatFeesLoading(true)
    try {
      await apiRequest(`/fee/repeat-fee/${id}`, "DELETE", undefined, token ?? undefined)
      await loadRepeatFees()
    } catch (err: any) {
      setError(err?.message || "Tạm dừng phí lặp lại thất bại")
    } finally {
      setRepeatFeesLoading(false)
    }
  }

  const handleRestartRepeatFee = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn tiếp tục phí lặp lại này?")) return

    setRepeatFeesLoading(true)
    try {
      await apiRequest(`/fee/${id}/restart`, "POST", undefined, token ?? undefined)
      await loadRepeatFees()
    } catch (err: any) {
      setError(err?.message || "Tiếp tục phí lặp lại thất bại")
    } finally {
      setRepeatFeesLoading(false)
    }
  }

  const handleUpdateFee = async () => {
    if (!selectedFee) return
    if (!formData.name.trim()) {
      setUpdateMessage({ type: "error", text: "Vui lòng nhập tên phí" })
      return
    }

    setUpdateLoading(true)
    setUpdateMessage(null)
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description || undefined,
        isMandatory: formData.isMandatory,
        frequency: formData.frequency,
        calculationBase: formData.calculationBase
      }

      if (formData.rate) {
        payload.rate = Number(formData.rate)
      }
      if (formData.anchorDay) {
        payload.anchorDay = Number(formData.anchorDay)
      }
      if (formData.anchorMonth) {
        payload.anchorMonth = Number(formData.anchorMonth)
      }

      await apiRequest(`/fee/${selectedFee.id}`, "PATCH", payload, token ?? undefined)
      setUpdateMessage({ type: "success", text: "Cập nhật phí thành công!" })
      await loadFees(currentSearchTerm)
      // Update selectedFee with new data
      setSelectedFee({ ...selectedFee, ...payload })
    } catch (err: any) {
      setUpdateMessage({ type: "error", text: err?.message || "Cập nhật thất bại" })
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleDeleteFee = async () => {
    if (!selectedFee) return
    if (!confirm("Bạn có chắc chắn muốn xóa phí này?")) return

    setUpdateLoading(true)
    try {
      await apiRequest(`/fee/${selectedFee.id}`, "DELETE", undefined, token ?? undefined)
      await loadFees(currentSearchTerm)
      handleBackToList()
    } catch (err: any) {
      setUpdateMessage({ type: "error", text: err?.message || "Xóa phí thất bại" })
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleAssignFee = () => {
    // TODO: Implement fee assignment
    alert("Chức năng gán phí sẽ được triển khai sau")
  }

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportedFile(file)
    setFileImported(true)
    // Set default values when file is imported
    setFormData(prev => ({
      ...prev,
      frequency: "ONE_TIME",
      rate: "0",
      calculationBase: "PER_HOUSEHOLD"
    }))
    // Reset input
    e.target.value = ""
  }

  const handleViewPayment = async (feeId: number, householdId: number) => {
    setPaymentLoading(true)
    setPaymentDialogOpen(true)
    setPaymentDetail(null)
    setRejectNote("")
    setApproveAmount("")
    
    try {
      const res = await apiRequest(`/fee/${feeId}/${householdId}/payment`, "GET", undefined, token ?? undefined)
      const data = (res as any)?.data || res
      setPaymentDetail(data)

      if (data?.Payment?.amountPaid) {
        setApproveAmount(data.Payment.amountPaid.toString())
      } else {
        setApproveAmount("0")
      }
    } catch (err: any) {
      setPaymentDialogOpen(false)
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleApprovePayment = async () => {
    if (!paymentDetail?.Payment?.id) return
    
    setPaymentActionLoading(true)
    try {
      await apiRequest(
        `/payments/${paymentDetail.Payment.id}/approve`, 
        "PATCH", 
        { amount: Number(approveAmount) },
        token ?? undefined
      )
      
      setPaymentDialogOpen(false)
      if (selectedFee) {
        loadAssignments(selectedFee.id, assignmentPage, assignmentFilter)
      }
    } catch (err: any) {
      alert(err.message || "Lỗi khi duyệt")
    } finally {
      setPaymentActionLoading(false)
    }
  }

  const handleRejectPayment = async () => {
    if (!paymentDetail?.Payment?.id) return
    
    if (!rejectNote.trim()) {
      return
    }
    
    setPaymentActionLoading(true)
    try {
      await apiRequest(`/payments/${paymentDetail.Payment.id}/reject`, "PATCH", { note: rejectNote }, token ?? undefined)
      setPaymentDialogOpen(false)
      // Reload assignments
      if (selectedFee) {
        loadAssignments(selectedFee.id, assignmentPage, assignmentFilter)
      }
    } catch (err: any) {
      // Silent fail
    } finally {
      setPaymentActionLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return
    }

    // Validate dueDate for ONE_TIME frequency or when importing file
    if ((fileImported || formData.frequency === "ONE_TIME") && !formData.dueDate) {
      return
    }

    // Validate file when importing
    if (fileImported && !importedFile) {
      return
    }

    setLoading(true)
    try {
      if (fileImported && importedFile) {
        // Import with file
        const formDataToSend = new FormData()
        formDataToSend.append("file", importedFile)
        formDataToSend.append("name", formData.name)
        if (formData.description) {
          formDataToSend.append("description", formData.description)
        }
        formDataToSend.append("isMandatory", "true")
        formDataToSend.append("frequency", "ONE_TIME")
        formDataToSend.append("calculationBase", "PER_HOUSEHOLD")
        formDataToSend.append("rate", "0")
        formDataToSend.append("dueDate", formData.dueDate)
        
        await apiRequest("/fee/import", "POST", formDataToSend, token ?? undefined)
      } else {
        const payload: any = {
          name: formData.name,
          description: formData.description || undefined,
          isMandatory: formData.isMandatory,
          frequency: formData.frequency
        }

        // Only include rate and calculationBase when isMandatory is true
        if (formData.isMandatory) {
          payload.calculationBase = formData.calculationBase
          if (formData.rate) {
            payload.rate = Number(formData.rate)
          }
        }

        if (formData.anchorDay) {
          payload.anchorDay = Number(formData.anchorDay)
        }
        if (formData.anchorMonth) {
          payload.anchorMonth = Number(formData.anchorMonth)
        }

        // Log để kiểm tra
        console.log("=== DEBUG CREATE FEE ===")
        console.log("formData.isMandatory:", formData.isMandatory)
        console.log("typeof formData.isMandatory:", typeof formData.isMandatory)
        console.log("payload:", JSON.stringify(payload, null, 2))
        console.log("========================")

        // Use different API based on frequency
        if (formData.frequency === "ONE_TIME") {
          payload.dueDate = formData.dueDate
          await apiRequest("/fee/onetime-fee", "POST", payload, token ?? undefined)
        } else {
          // MONTHLY or YEARLY - use repeat fee API
          await apiRequest("/fee/repeat", "POST", payload, token ?? undefined)
        }
      }

      setDialogOpen(false)
      await loadFees()
    } catch (err: any) {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        {/* Tabs Navigation */}
        <div className="border-b mb-4 flex gap-2">
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "list"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => handleTabChange("list")}
          >
            Danh sách phí
          </button>
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "repeat"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => handleTabChange("repeat")}
          >
            Phí lặp lại
          </button>
          {selectedFee && (
            <button
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "detail"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("detail")}
            >
              Chi tiết: {selectedFee.name}
            </button>
          )}
        </div>

        {/* Tab Content: List */}
        {activeTab === "list" && (
          <Card>
            <CardHeader>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Tìm kiếm theo tên phí..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPage(1)
                      loadFees(searchTerm)
                    }
                  }}
                  className="max-w-xs"
                />
                <Button
                  onClick={() => {
                    setPage(1)
                    loadFees(searchTerm)
                  }}
                  disabled={loading}
                >
                  {loading ? "Đang tìm..." : "Tìm kiếm"}
                </Button>
                <div className="flex-1" />
                <Button onClick={handleOpenCreateDialog}>Tạo phí mới</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && <div className="text-center py-8">Đang tải...</div>}
              
              {!loading && currentSearchTerm && fees.length === 0 && (
                <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                  Không tìm thấy kết quả cho từ khóa "{currentSearchTerm}"
                </div>
              )}
              
              {!loading && !currentSearchTerm && fees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có phí nào. Nhấn "Tạo phí mới" để bắt đầu.
                </div>
              )}

              {!loading && fees.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên phí</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Bắt buộc</TableHead>
                      <TableHead>Đơn giá</TableHead>
                      <TableHead>Cơ sở tính</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">{fee.name}</TableCell>
                        <TableCell>{fee.description || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-sm ${
                            fee.isMandatory 
                              ? "bg-red-100 text-red-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {fee.isMandatory ? "Bắt buộc" : "Tùy chọn"}
                          </span>
                        </TableCell>
                        <TableCell>{fee.rate ? `${fee.rate.toLocaleString()} VND` : "-"}</TableCell>
                        <TableCell>
                          {fee.calculationBase === "PER_PERSON" ? "Theo người" :
                           fee.calculationBase === "PER_HOUSEHOLD" ? "Theo hộ" :
                           fee.calculationBase === "PER_MOTORBIKE" ? "Theo xe máy" :
                           fee.calculationBase === "PER_CAR" ? "Theo ô tô" : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenDetail(fee)}
                          >
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {!loading && fees.length > 0 && (
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

                    <div className="text-sm">
                      Trang {page} / {totalPages}
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

        {/* Tab Content: Repeat Fees */}
        {activeTab === "repeat" && (
          <Card>
            <CardHeader>
              <CardTitle>Danh sách phí lặp lại theo chu kỳ</CardTitle>
            </CardHeader>
            <CardContent>
              {repeatFeesLoading && <div className="text-center py-8">Đang tải...</div>}
              
              {!repeatFeesLoading && repeatFees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có phí lặp lại nào.
                </div>
              )}

              {!repeatFeesLoading && repeatFees.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên phí</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Bắt buộc</TableHead>
                      <TableHead>Tần suất</TableHead>
                      <TableHead>Đơn giá</TableHead>
                      <TableHead>Cơ sở tính</TableHead>
                      <TableHead>Ngày neo</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repeatFees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">{fee.name}</TableCell>
                        <TableCell>{fee.description || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-sm ${
                            fee.isMandatory 
                              ? "bg-red-100 text-red-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {fee.isMandatory ? "Bắt buộc" : "Tùy chọn"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-sm ${
                            fee.frequency === "MONTHLY" 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-green-100 text-green-800"
                          }`}>
                            {fee.frequency === "MONTHLY" ? "Hàng tháng" : "Hàng năm"}
                          </span>
                        </TableCell>
                        <TableCell>{fee.rate ? `${fee.rate.toLocaleString()} VND` : "-"}</TableCell>
                        <TableCell>
                          {fee.calculationBase === "PER_PERSON" ? "Theo người" :
                           fee.calculationBase === "PER_HOUSEHOLD" ? "Theo hộ" :
                           fee.calculationBase === "PER_MOTORBIKE" ? "Theo xe máy" :
                           fee.calculationBase === "PER_CAR" ? "Theo ô tô" : "-"}
                        </TableCell>
                        <TableCell>
                          {fee.anchorDay || "-"}
                          {fee.frequency === "YEARLY" && fee.anchorMonth && ` / Tháng ${fee.anchorMonth}`}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-sm ${
                            fee.status === "ACTIVE" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {fee.status === "ACTIVE" ? "Hoạt động" : "Tạm dừng"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {fee.status === "ACTIVE" ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteRepeatFee(fee.id)}
                                disabled={repeatFeesLoading}
                              >
                                Tạm dừng
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleRestartRepeatFee(fee.id)}
                                disabled={repeatFeesLoading}
                              >
                                Tiếp tục
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab Content: Detail */}
        {activeTab === "detail" && selectedFee && (
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết phí: {selectedFee.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {updateMessage && (
                <div className={`p-4 rounded-lg ${
                  updateMessage.type === "success" 
                    ? "bg-green-50 text-green-700" 
                    : "bg-red-50 text-red-600"
                }`}>
                  {updateMessage.text}
                </div>
              )}

              {detailLoading && <div className="text-center py-4">Đang tải...</div>}

              {!detailLoading && (
                <>
                  {/* Fee Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Tên phí</Label>
                      <p className="font-medium">{selectedFee.name}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Trạng thái</Label>
                      <p>
                        <span className={`px-2 py-1 rounded text-sm ${
                          selectedFee.status === "ACTIVE" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {selectedFee.status === "ACTIVE" ? "Hoạt động" : "Tạm dừng"}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Mô tả</Label>
                      <p className="font-medium">{selectedFee.description || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Loại phí</Label>
                      <p>
                        <span className={`px-2 py-1 rounded text-sm ${
                          selectedFee.isMandatory 
                            ? "bg-red-100 text-red-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {selectedFee.isMandatory ? "Bắt buộc" : "Tùy chọn"}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Tần suất</Label>
                      <p>
                        <span className={`px-2 py-1 rounded text-sm ${
                          selectedFee.frequency === "MONTHLY" 
                            ? "bg-blue-100 text-blue-800" 
                            : selectedFee.frequency === "YEARLY"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {selectedFee.frequency === "MONTHLY" ? "Hàng tháng" : selectedFee.frequency === "YEARLY" ? "Hàng năm" : "Một lần"}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Đơn giá</Label>
                      <p className="font-medium">{selectedFee.rate ? `${selectedFee.rate.toLocaleString()} VND` : "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Cơ sở tính phí</Label>
                      <p className="font-medium">
                        {selectedFee.calculationBase === "PER_PERSON" ? "Theo người" :
                         selectedFee.calculationBase === "PER_HOUSEHOLD" ? "Theo hộ" :
                         selectedFee.calculationBase === "PER_MOTORBIKE" ? "Theo xe máy" :
                         selectedFee.calculationBase === "PER_CAR" ? "Theo ô tô" : "-"}
                      </p>
                    </div>
                    {(selectedFee.frequency === "MONTHLY" || selectedFee.frequency === "YEARLY") && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Ngày neo</Label>
                        <p className="font-medium">
                          {selectedFee.anchorDay || "-"}
                          {selectedFee.frequency === "YEARLY" && selectedFee.anchorMonth && ` / Tháng ${selectedFee.anchorMonth}`}
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Ngày tạo</Label>
                      <p className="font-medium">
                        {selectedFee.createdAt 
                          ? new Date(selectedFee.createdAt).toLocaleDateString("vi-VN")
                          : "-"}
                      </p>
                    </div>
                  </div>

                    {/*Thống kê thu phí*/}
                    <div className="bg-muted/30 p-4 rounded-lg border my-4">
                      <h3 className="font-semibold mb-3">Thống kê thu phí</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Thống kê tiền */}
                        <div className="bg-background p-4 rounded shadow-sm border">
                          <div className="text-sm text-muted-foreground mb-1">Tiến độ thu tiền</div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-2xl font-bold text-green-600">
                              {selectedFee.statistics?.collectedAmount.toLocaleString()} đ
                            </span>
                            <span className="text-sm text-muted-foreground pb-1">
                              / {selectedFee.statistics?.totalAmount.toLocaleString()} đ
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-green-600 h-2.5 rounded-full" 
                              style={{ 
                                width: `${selectedFee.statistics?.totalAmount ? (selectedFee.statistics.collectedAmount / selectedFee.statistics.totalAmount * 100) : 0}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-right mt-1 text-muted-foreground">
                            {selectedFee.statistics?.totalAmount 
                              ? ((selectedFee.statistics.collectedAmount / selectedFee.statistics.totalAmount) * 100).toFixed(1) 
                              : 0}%
                          </p>
                        </div>

                      {/* Thống kê hộ dân */}
                      <div className="bg-background p-4 rounded shadow-sm border">
                        <div className="text-sm text-muted-foreground mb-1">Số hộ đã nộp</div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-2xl font-bold text-blue-600">
                            {selectedFee.statistics?.paidHouseholds}
                          </span>
                          <span className="text-sm text-muted-foreground pb-1">
                            / {selectedFee.statistics?.totalHouseholds} hộ
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ 
                              width: `${selectedFee.statistics?.totalHouseholds ? (selectedFee.statistics.paidHouseholds / selectedFee.statistics.totalHouseholds * 100) : 0}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-right mt-1 text-muted-foreground">
                          {selectedFee.statistics?.totalHouseholds 
                            ? ((selectedFee.statistics.paidHouseholds / selectedFee.statistics.totalHouseholds) * 100).toFixed(1) 
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>


                  {/* Action Buttons */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteFee}
                      disabled={updateLoading}
                    >
                      Xóa phí
                    </Button>
                  </div>

                  {/* Assignments Table */}
                  <div className="pt-6 border-t mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Danh sách hộ gia đình được gán phí</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Lọc:</span>
                        <Select 
                          value={assignmentFilter} 
                          onValueChange={(value) => {
                            setAssignmentFilter(value as "ALL" | "true" | "false")
                            setAssignmentPage(1)
                            if (selectedFee) loadAssignments(selectedFee.id, 1, value)
                          }}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Tất cả</SelectItem>
                            <SelectItem value="true">Đã thanh toán</SelectItem>
                            <SelectItem value="false">Chưa thanh toán</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {assignments.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        Chưa có hộ gia đình nào được gán phí này.
                      </div>
                    )}

                    {assignments.length > 0 && (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Mã hộ</TableHead>
                              <TableHead>Số căn hộ</TableHead>
                              <TableHead>Chủ hộ</TableHead>
                              <TableHead>Số tiền</TableHead>
                              <TableHead>Ngày đến hạn</TableHead>
                              <TableHead>Trạng thái</TableHead>
                              <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assignments.map((assignment) => {
                              const paymentStatus = assignment.Payment?.status
                              const canViewPayment = paymentStatus === "PENDING" || paymentStatus === "APPROVED" || paymentStatus === "REJECTED"
                              
                              return (
                                <TableRow key={assignment.id}>
                                  <TableCell className="font-medium">{assignment.household.houseHoldCode}</TableCell>
                                  <TableCell>{assignment.household.apartmentNumber}</TableCell>
                                  <TableCell>{assignment.household.head?.fullname || "-"}</TableCell>
                                  <TableCell>{assignment.amountDue?.toLocaleString()} VND</TableCell>
                                  <TableCell>
                                    {assignment.dueDate 
                                      ? new Date(assignment.dueDate).toLocaleDateString("vi-VN")
                                      : "-"}
                                  </TableCell>
                                  <TableCell>
                                    {(() => {
                                      const paymentStatus = assignment.Payment?.status
                                      if (assignment.isPaid) {
                                        return (
                                          <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">
                                            Đã thanh toán
                                          </span>
                                        )
                                      } else if (paymentStatus === "PENDING") {
                                        return (
                                          <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                                            Đang đợi duyệt
                                          </span>
                                        )
                                      } else {
                                        return (
                                          <span className="px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
                                            Chưa thanh toán
                                          </span>
                                        )
                                      }
                                    })()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={!canViewPayment}
                                      onClick={() => handleViewPayment(assignment.feeId, assignment.householdId)}
                                      title={canViewPayment ? "Xem chi tiết thanh toán" : "Không có thanh toán"}
                                    >
                                      <Eye className={`h-4 w-4 ${canViewPayment ? "text-blue-600" : "text-gray-400"}`} />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>

                        {/* Assignment Pagination: Luôn hiển thị */}
                        <div className="flex items-center justify-end gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newPage = Math.max(1, assignmentPage - 1)
                              setAssignmentPage(newPage)
                              if (selectedFee) loadAssignments(selectedFee.id, newPage, assignmentFilter)
                            }}
                            disabled={assignmentPage === 1 || detailLoading}
                          >
                            Trước
                          </Button>
                          <div className="text-sm">
                            Trang {assignmentPage} / {assignmentTotalPages}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newPage = Math.min(assignmentTotalPages, assignmentPage + 1)
                              setAssignmentPage(newPage)
                              if (selectedFee) loadAssignments(selectedFee.id, newPage, assignmentFilter)
                            }}
                            disabled={assignmentPage >= assignmentTotalPages || detailLoading}
                          >
                            Tiếp
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo phí mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin phí mới
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên phí *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Phí quản lý"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về phí"
                  rows={3}
                />
              </div>

              {/* Loại phí và Import Excel - ngang hàng */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isMandatory">Loại phí</Label>
                  <div className="flex items-center space-x-2 p-3 border rounded-md h-10">
                    <input
                      type="checkbox"
                      id="isMandatory"
                      checked={formData.isMandatory}
                      onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isMandatory" className="font-normal cursor-pointer mb-0">
                      Phí bắt buộc
                    </Label>
                  </div>
                </div>

                {/* Import Excel Section */}
                <div className="space-y-2">
                  <Label>Import từ Excel</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" type="button" asChild className="flex-1 h-10">
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        {importedFile ? importedFile.name : "Chọn file Excel"}
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          onChange={handleImportExcel}
                        />
                      </label>
                    </Button>
                    {fileImported && (
                      <Button 
                        variant="ghost" 
                        type="button" 
                        size="sm"
                        onClick={() => {
                          setFileImported(false)
                          setImportedFile(null)
                          setFormData(prev => ({
                            ...prev,
                            frequency: "MONTHLY",
                            rate: "",
                            calculationBase: "PER_HOUSEHOLD"
                          }))
                        }}
                      >
                        Xóa file
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {fileImported && (
                <p className="text-sm text-muted-foreground">
                  File đã chọn sẽ được import với tần suất: Một lần, Đơn giá: 0, Cơ sở tính: Theo hộ
                </p>
              )}

              {/* Due Date - show when importing file or when frequency is ONE_TIME */}
              {(fileImported || formData.frequency === "ONE_TIME") && (
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Ngày đến hạn *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              )}

              {/* Only show these fields when NOT importing file */}
              {!fileImported && (
                <>
                  {/* Tần suất và Đơn giá - ngang hàng */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Tần suất *</Label>
                      <Select 
                        value={formData.frequency} 
                        onValueChange={(value) => setFormData({ ...formData, frequency: value as "ONE_TIME" | "MONTHLY" | "YEARLY" })}
                      >
                        <SelectTrigger id="frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ONE_TIME">Một lần</SelectItem>
                          <SelectItem value="MONTHLY">Hàng tháng</SelectItem>
                          <SelectItem value="YEARLY">Hàng năm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rate - Only show when isMandatory is true */}
                    {formData.isMandatory && (
                      <div className="space-y-2">
                        <Label htmlFor="rate">Đơn giá (VND)</Label>
                        <Input
                          id="rate"
                          type="number"
                          value={formData.rate}
                          onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>

                  {/* Calculation Base - Only show when isMandatory is true */}
                  {formData.isMandatory && (
                    <div className="space-y-2">
                      <Label htmlFor="calculationBase">Cơ sở tính phí *</Label>
                      <Select 
                        value={formData.calculationBase} 
                        onValueChange={(value) => setFormData({ ...formData, calculationBase: value as "PER_PERSON" | "PER_HOUSEHOLD" | "PER_MOTORBIKE" | "PER_CAR" })}
                      >
                      <SelectTrigger id="calculationBase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PER_PERSON">Theo người</SelectItem>
                        <SelectItem value="PER_HOUSEHOLD">Theo hộ</SelectItem>
                        <SelectItem value="PER_MOTORBIKE">Theo xe máy</SelectItem>
                        <SelectItem value="PER_CAR">Theo ô tô</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                  )}

                  {/* Anchor Day and Month */}
                  {(formData.frequency === "MONTHLY" || formData.frequency === "YEARLY") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="anchorDay">Ngày neo (1-28) *</Label>
                        <Input
                          id="anchorDay"
                          type="number"
                          min="1"
                          max="28"
                          value={formData.anchorDay}
                          onChange={(e) => setFormData({ ...formData, anchorDay: e.target.value })}
                          placeholder="Ngày"
                        />
                      </div>

                      {formData.frequency === "YEARLY" && (
                        <div className="space-y-2">
                          <Label htmlFor="anchorMonth">Tháng neo (1-12) *</Label>
                          <Input
                            id="anchorMonth"
                            type="number"
                            min="1"
                            max="12"
                            value={formData.anchorMonth}
                            onChange={(e) => setFormData({ ...formData, anchorMonth: e.target.value })}
                            placeholder="Tháng"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Đang xử lý..." : "Tạo mới"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Detail Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Chi tiết thanh toán</DialogTitle>
              <DialogDescription>
                Thông tin thanh toán của hộ gia đình
              </DialogDescription>
            </DialogHeader>

            {paymentLoading && (
              <div className="text-center py-8">Đang tải...</div>
            )}

            {!paymentLoading && paymentDetail?.Payment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Số tiền thanh toán</Label>
                    <p className="font-medium">{paymentDetail.Payment.amountPaid?.toLocaleString()} VND</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Trạng thái</Label>
                    <p>
                      <span className={`px-2 py-1 rounded text-sm ${
                        paymentDetail.Payment.status === "APPROVED" 
                          ? "bg-green-100 text-green-800" 
                          : paymentDetail.Payment.status === "PENDING"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {paymentDetail.Payment.status === "APPROVED" ? "Đã duyệt" 
                          : paymentDetail.Payment.status === "PENDING" ? "Đang đợi duyệt" 
                          : "Từ chối"}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Ngày thanh toán</Label>
                    <p className="font-medium">
                      {paymentDetail.Payment.paidDate 
                        ? new Date(paymentDetail.Payment.paidDate).toLocaleString("vi-VN")
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Ghi chú</Label>
                    <p className="font-medium">{paymentDetail.Payment.note || "-"}</p>
                  </div>
                </div>

                {/* Payment Image */}
                {paymentDetail.Payment.imageUrl && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Ảnh chứng từ</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={paymentDetail.Payment.imageUrl} 
                        alt="Chứng từ thanh toán"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Reject Note - Only show when status is PENDING */}
                {paymentDetail.Payment.status === "PENDING" && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectNote">Lý do từ chối (bắt buộc nếu từ chối)</Label>
                    <Textarea
                      id="rejectNote"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Nhập lý do từ chối..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            {!paymentLoading && !paymentDetail?.Payment && (
              <div className="text-center py-8 text-muted-foreground">
                Không có thông tin thanh toán
              </div>
            )}

            {/*Xác nhận số tiền thu */}
            {paymentDetail?.Payment?.status === "PENDING" && (
              <div className="space-y-2 pt-4 border-t mt-4">
                <Label htmlFor="approveAmount" className="text-blue-600 font-semibold">
                  Xác nhận số tiền thực thu (VND)
                </Label>
                <div className="flex items-center gap-2">
                   <Input
                    id="approveAmount"
                    type="number"
                    value={approveAmount}
                    onChange={(e) => setApproveAmount(e.target.value)}
                    placeholder="Nhập số tiền duyệt"
                    className="font-bold text-lg"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    (Admin xác nhận)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Số tiền này sẽ được cập nhật vào thống kê tổng doanh thu.
                </p>
              </div>
            )}

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={paymentActionLoading}>
                Đóng
              </Button>
              {paymentDetail?.Payment?.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    onClick={handleRejectPayment}
                    disabled={paymentActionLoading}
                  >
                    {paymentActionLoading ? "Đang xử lý..." : "Từ chối"}
                  </Button>
                  <Button 
                    onClick={handleApprovePayment}
                    disabled={paymentActionLoading}
                  >
                    {paymentActionLoading ? "Đang xử lý..." : "Đồng ý"}
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
