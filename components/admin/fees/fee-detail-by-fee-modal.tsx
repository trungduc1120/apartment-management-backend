"use client"

import { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" 
import { useFeeContext } from "@/lib/context/fee-context"
import { Fee } from "@/lib/api/fee/feesApi"
import { FeeAssignmentItem } from "@/lib/api/fee/feeAssignmentsApi"
import { Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight, Filter } from "lucide-react"

// Định nghĩa lại kiểu dữ liệu trả về từ API mới
interface FeeDetailResponse extends Fee {
  assignments: {
    data: FeeAssignmentItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}

export function FeeDetailByFeeModal({ feeId, onClose }: { feeId: number; onClose: () => void }) {
  const { getFeeDetail, approvePayment, rejectPayment } = useFeeContext()
  
  // State data theo cấu trúc mới
  const [data, setData] = useState<FeeDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // State quản lý Phân trang & Lọc
  const [currentPage, setCurrentPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>("all") // "all" | "true" | "false"

  // State xử lý modal con (chi tiết thanh toán)
  const [selectedPayment, setSelectedPayment] = useState<FeeAssignmentItem | null>(null)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectNote, setRejectNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  // Hàm load dữ liệu
  const fetchData = useCallback(() => {
    setLoading(true)
    // Gọi context với params phân trang & lọc
    getFeeDetail(feeId, { 
      page: currentPage, 
      limit: 10, 
      isPaid: filterStatus === "all" ? "" : filterStatus 
    })
      .then((res) => {
          setData(res)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [feeId, getFeeDetail, currentPage, filterStatus])

  // Gọi API mỗi khi page hoặc filter thay đổi
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Khi đổi filter thì reset về trang 1
  const handleFilterChange = (value: string) => {
    setFilterStatus(value)
    setCurrentPage(1)
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
      fetchData() // Load lại dữ liệu để cập nhật trạng thái
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
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chi tiết thu phí: {data?.name || "..."}</DialogTitle>
            <DialogDescription>
                Danh sách các hộ và trạng thái đóng tiền
            </DialogDescription>
          </DialogHeader>

          {/* --- THANH CÔNG CỤ: FILTER --- */}
          <div className="flex items-center justify-between py-2 gap-4">
             <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Lọc trạng thái:</span>
                <Select value={filterStatus} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="true">Đã thanh toán</SelectItem>
                    <SelectItem value="false">Chưa thanh toán</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             
             {data?.assignments?.meta && (
               <div className="text-sm text-muted-foreground">
                 Tổng cộng: <b>{data.assignments.meta.total}</b> hộ
               </div>
             )}
          </div>

          {/* --- BẢNG DỮ LIỆU --- */}
          <div className="flex-1 overflow-hidden border rounded-md relative min-h-[300px]">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 backdrop-blur-sm">
                    Đang tải dữ liệu...
                </div>
            )}

            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã hộ</TableHead>
                    <TableHead>Chủ hộ</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Hạn nộp</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.assignments?.data?.length ? (
                    data.assignments.data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.household?.houseHoldCode}</TableCell>
                        <TableCell>{item.household?.head?.fullname || "N/A"}</TableCell>
                        <TableCell>{String(item.household && 'apartmentNumber' in item.household ? item.household.apartmentNumber : "-")}</TableCell>
                        <TableCell>{item.amountDue.toLocaleString()} đ</TableCell>
                        <TableCell>{new Date(item.dueDate).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell>
                           {/* Logic hiển thị Badge trạng thái */}
                           <Badge 
                            variant={item.isPaid ? "default" : "secondary"}
                            className={
                              item.isPaid ? "bg-green-600 hover:bg-green-700" :
                              (item.Payment?.status === "REJECTED" ? "bg-red-500 hover:bg-red-600" : 
                               item.Payment?.status === "PENDING" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-400")
                           }
                          >
                            {item.isPaid ? "Đã nộp" : 
                             item.Payment?.status === "REJECTED" ? "Bị từ chối" :
                             item.Payment?.status === "PENDING" ? "Chờ duyệt" : "Chưa nộp"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.Payment && (
                            <Button variant="ghost" size="icon" onClick={() => setSelectedPayment(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    !loading && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                Không tìm thấy dữ liệu nào.
                            </TableCell>
                        </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* --- THANH PHÂN TRANG --- */}
          {data?.assignments?.meta && (
            <div className="flex items-center justify-end space-x-2 pt-4">
                <div className="text-sm text-muted-foreground mr-4">
                    Trang {data.assignments.meta.page} / {data.assignments.meta.totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loading}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage >= data.assignments.meta.totalPages || loading}
                >
                    Sau
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
          )}

        </DialogContent>
      </Dialog>

      {/* --- MODAL CHI TIẾT THANH TOÁN (Giữ nguyên logic cũ) --- */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && handleCloseDetail()}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Thông tin thanh toán - Hộ {selectedPayment.household?.houseHoldCode}</DialogTitle>
              <DialogDescription>
                Chủ hộ: {selectedPayment.household?.head?.fullname}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
               {/* Thông tin tiền & trạng thái */}
               <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Số tiền</p>
                  <p className="text-lg font-bold">{selectedPayment.Payment?.amountPaid.toLocaleString()} đ</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Trạng thái</p>
                  <Badge variant={selectedPayment.Payment?.status === "REJECTED" ? "destructive" : selectedPayment.Payment?.status === "APPROVED" ? "default" : "secondary"}>
                    {selectedPayment.Payment?.status}
                  </Badge>
                </div>
              </div>

               {/* Ảnh minh chứng */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Ảnh minh chứng</p>
                <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                  {selectedPayment.Payment?.imageUrl ? (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img 
                       src={selectedPayment.Payment.imageUrl} 
                       alt="Payment proof" 
                       className="object-contain w-full h-full"
                     />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Không có ảnh</div>
                  )}
                </div>
              </div>

               {/* Lý do từ chối (Nếu có) */}
               {selectedPayment.Payment?.status === "REJECTED" && selectedPayment.Payment.note && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200">
                   <p className="text-sm font-bold text-red-600 mb-1">Lý do từ chối:</p>
                   <p className="text-sm">{selectedPayment.Payment.note}</p>
                </div>
              )}

              {/* Action Buttons (Chỉ hiện khi PENDING) */}
              {selectedPayment.Payment?.status === "PENDING" && (
                <div className="mt-4 border-t pt-4">
                  {!rejectMode ? (
                    <div className="flex gap-3 justify-end">
                      <Button variant="destructive" onClick={() => setRejectMode(true)}>
                        <XCircle className="w-4 h-4 mr-2" /> Từ chối
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={actionLoading}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Duyệt thanh toán
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="reject-reason" className="text-red-600">Lý do từ chối (bắt buộc)</Label>
                      <Textarea 
                        id="reject-reason"
                        placeholder="Nhập lý do từ chối..." 
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setRejectMode(false)} disabled={actionLoading}>Hủy</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectNote.trim() || actionLoading}>
                          Xác nhận
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