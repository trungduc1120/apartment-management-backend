"use client"

import { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useFeeContext } from "@/lib/context/fee-context"
import { FeeAssignmentItem } from "@/lib/api/fee/feeAssignmentsApi"
import { useAdmin } from "@/lib/context/admin-context"
import { adminGetAllHouseholds } from "@/lib/api/api" // Import thêm để fetch fallback
import { useAuth } from "@/lib/context/auth-context"
import { Eye, CheckCircle, XCircle, Loader2 } from "lucide-react"

// Cập nhật Props: Cho phép truyền cả household object nếu có
export function FeeDetailByHouseholdModal({ 
  householdId, 
  householdData, // Optional: Nếu cha có sẵn data thì truyền vào
  onClose 
}: { 
  householdId: number
  householdData?: any
  onClose: () => void 
}) {
  const { getHouseholdFees, approvePayment, rejectPayment } = useFeeContext()
  const { households } = useAdmin() // households này chỉ là current page
  const { token } = useAuth()

  const [assignments, setAssignments] = useState<FeeAssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // State quản lý thông tin hộ (nếu không có sẵn)
  const [currentHousehold, setCurrentHousehold] = useState<any>(householdData || null)
  
  const [selectedPayment, setSelectedPayment] = useState<FeeAssignmentItem | null>(null)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectNote, setRejectNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  // Effect 1: Load thông tin Hộ (nếu chưa có)
  useEffect(() => {
    // Nếu đã có data từ props thì dùng luôn
    if (householdData) {
      setCurrentHousehold(householdData)
      return
    }

    // Nếu không, thử tìm trong context (trang hiện tại)
    const foundInContext = households?.find((h: any) => h.id === householdId)
    if (foundInContext) {
      setCurrentHousehold(foundInContext)
    } else if (token) {
      // Nếu không tìm thấy (do khác trang), gọi API để lấy thông tin hiển thị
      // Search chính xác theo ID (cần backend hỗ trợ search chính xác hoặc ta search chuỗi rồi lọc)
      // Ở đây dùng tạm search API, hy vọng backend trả về đúng
      adminGetAllHouseholds(token, { search: householdId.toString() })
        .then(res => {
           if(res.success && res.data?.data) {
             const found = res.data.data.find((h:any) => h.id === householdId)
             if(found) setCurrentHousehold(found)
           }
        })
        .catch(console.error)
    }
  }, [householdId, householdData, households, token])

  // Effect 2: Load danh sách phí
  const fetchData = useCallback(() => {
    setLoading(true)
    getHouseholdFees(householdId)
      .then(setAssignments)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [householdId, getHouseholdFees])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Helper hiển thị tên
  const getDisplayInfo = () => {
    if (!currentHousehold) return `Hộ ID: ${householdId}`
    const head = currentHousehold.resident?.find((r: any) => r.relationshipToHead === "HEAD")
    return `${currentHousehold.apartmentNumber} - ${currentHousehold.buildingNumber} (${head?.fullname || "Chưa có chủ hộ"})`
  }

  const handleCloseDetail = () => {
    setSelectedPayment(null)
    setRejectMode(false)
    setRejectNote("")
  }

  const handleApprove = async () => {
    if (!selectedPayment?.Payment?.id) return
    try {
      setActionLoading(true)
      await approvePayment(selectedPayment.Payment.id)
      handleCloseDetail()
      fetchData()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedPayment?.Payment?.id) return
    if (!rejectNote.trim()) return

    try {
      setActionLoading(true)
      await rejectPayment(selectedPayment.Payment.id, rejectNote)
      handleCloseDetail()
      fetchData()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chi tiết thu phí</DialogTitle>
            <DialogDescription className="text-base font-medium text-foreground">
               {getDisplayInfo()}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên khoản phí</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Hạn nộp</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày nộp</TableHead>
                    <TableHead className="text-right">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Hộ này chưa có khoản phí nào</TableCell></TableRow>
                  ) : assignments.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.fee?.name}</TableCell>
                      <TableCell>{item.amountDue.toLocaleString()} đ</TableCell>
                      <TableCell>{new Date(item.dueDate).toLocaleDateString("vi-VN")}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.isPaid ? "default" : "secondary"} 
                          className={
                             item.isPaid ? "bg-green-600 hover:bg-green-700" :
                             (item.Payment?.status === "REJECTED" ? "bg-red-500 hover:bg-red-600" : 
                              item.Payment?.status === "PENDING" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-400")
                          }
                        >
                          {item.isPaid ? "Đã duyệt" : 
                           item.Payment?.status === "REJECTED" ? "Bị từ chối" :
                           item.Payment?.status === "PENDING" ? "Chờ duyệt" : "Chưa nộp"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.paidDate ? new Date(item.paidDate).toLocaleDateString("vi-VN") : "-"}</TableCell>
                      <TableCell className="text-right">
                        {item.Payment && (
                          <Button variant="ghost" size="icon" onClick={() => setSelectedPayment(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết thanh toán con (Giữ nguyên logic cũ) */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && handleCloseDetail()}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Duyệt thanh toán: {selectedPayment.fee?.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* ... Giữ nguyên phần hiển thị ảnh và thông tin thanh toán như cũ ... */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Số tiền khách đóng</p>
                  <p className="text-xl font-bold">{selectedPayment.Payment?.amountPaid.toLocaleString()} đ</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Trạng thái hiện tại</p>
                   <Badge variant="outline">{selectedPayment.Payment?.status}</Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Ảnh chuyển khoản</p>
                <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                  {selectedPayment.Payment?.imageUrl ? (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img 
                       src={selectedPayment.Payment.imageUrl} 
                       alt="Payment proof" 
                       className="object-contain w-full h-full"
                     />
                  ) : (
                    <span className="text-muted-foreground">Không có ảnh</span>
                  )}
                </div>
              </div>

               {/* Hiển thị Note nếu đã reject */}
               {selectedPayment.Payment?.status === "REJECTED" && selectedPayment.Payment.note && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200">
                   <p className="text-sm font-bold text-red-600 mb-1">Lý do từ chối:</p>
                   <p className="text-sm">{selectedPayment.Payment.note}</p>
                </div>
              )}

              {/* ACTION BUTTONS */}
              {selectedPayment.Payment?.status === "PENDING" && (
                <div className="mt-4 border-t pt-4">
                  {!rejectMode ? (
                    <div className="flex gap-3 justify-end">
                      <Button variant="destructive" onClick={() => setRejectMode(true)} disabled={actionLoading}>
                        <XCircle className="w-4 h-4 mr-2" /> Từ chối
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={actionLoading}>
                         {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <CheckCircle className="w-4 h-4 mr-2" />} 
                         Duyệt
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                      <Label htmlFor="reject-reason" className="text-destructive font-semibold">Nhập lý do từ chối:</Label>
                      <Textarea 
                        id="reject-reason"
                        placeholder="VD: Sai nội dung, thiếu tiền..." 
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        className="resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setRejectMode(false)} disabled={actionLoading}>Quay lại</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectNote.trim() || actionLoading}>
                          Xác nhận từ chối
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}