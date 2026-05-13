"use client"

import { useState, useEffect } from "react" // Thêm useEffect
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input" // Import Input
import { CreateFeeModal } from "./create-fee-modal"
import { useFeeContext } from "@/lib/context/fee-context"
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react" 
import { Fee } from "@/lib/api/fee/feesApi"
import { toast } from "sonner"

export function FeeList() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFee, setEditingFee] = useState<Fee | null>(null)
  
  // State nội bộ cho search và page
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  const { fees, deleteFee, loadFees, pagination, feesLoading } = useFeeContext()

  // 1. Xử lý Debounce cho Search (để không gọi API liên tục khi gõ)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500) // Đợi 500ms sau khi ngừng gõ mới search
    return () => clearTimeout(timer)
  }, [searchTerm])

  // 2. Gọi API khi page hoặc từ khóa tìm kiếm thay đổi
  useEffect(() => {
    // Mặc định limit là 5 đã set ở backend, hoặc truyền { limit: 5 } ở đây
    loadFees({ page: pagination.page, search: debouncedSearch, limit: 5 })
  }, [debouncedSearch, pagination.page, loadFees]) 
  // Lưu ý: pagination.page ở dependency array có thể gây loop nếu không cẩn thận. 
  // Cách tốt hơn là quản lý page state tại component này:
  
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
      loadFees({ page: currentPage, search: debouncedSearch, limit: 5 })
  }, [currentPage, debouncedSearch, loadFees])


  const handleEdit = (fee: Fee) => {
    setEditingFee(fee)
    setShowCreateModal(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa?")) {
      try {
        await deleteFee(id)
        toast.success("Đã xóa khoản phí thành công")
      } catch (error) {
        toast.error("Xóa thất bại")
      }
    }
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingFee(null)
  }

  // Handle Search Input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value)
      setCurrentPage(1) // Reset về trang 1 khi tìm kiếm mới
  }

  return (
    <Card className="w-full">
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          
          <div className="flex items-center gap-2 w-full md:w-auto">
             {/* Ô Tìm Kiếm */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm theo tên phí..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-8"
                />
            </div>

            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2"/>
              Tạo phí mới
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên khoản phí</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Tần suất</TableHead>
                <TableHead>Tỉ lệ/người</TableHead>
                <TableHead>Tối thiểu</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feesLoading ? (
                  <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">Đang tải...</TableCell>
                  </TableRow>
              ) : fees.length > 0 ? (
                  fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">{fee.name}</TableCell>
                      <TableCell>{fee.type === 'MANDATORY' ? 'Bắt buộc' : 'Tự nguyện'}</TableCell>
                      <TableCell>{fee.frequency}</TableCell>
                      <TableCell>{fee.ratePerPerson ? fee.ratePerPerson.toLocaleString() : "-"}</TableCell>
                      <TableCell>{fee.minium?.toLocaleString() || "-"}</TableCell>
                      <TableCell>{fee.startDate ? new Date(fee.startDate).toLocaleDateString("vi-VN") : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(fee)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(fee.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">Không tìm thấy dữ liệu.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- Phần Nút Phân Trang --- */}
        <div className="flex items-center justify-end space-x-2 py-4">
            <div className="text-sm text-muted-foreground mr-4">
                Trang {pagination.page} / {pagination.totalPages || 1}
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || feesLoading}
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trước
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= pagination.totalPages || feesLoading}
            >
                Sau
                <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
        </div>
      </div>

      {showCreateModal && (
        <CreateFeeModal
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal()
            // Refresh lại trang hiện tại sau khi tạo/sửa
            loadFees({ page: currentPage, search: debouncedSearch, limit: 5 })
          }}
          feeToEdit={editingFee}
        />
      )}
    </Card>
  )
}