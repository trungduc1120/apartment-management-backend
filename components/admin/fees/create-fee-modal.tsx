"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useFeeContext } from "@/lib/context/fee-context"
import { Fee } from "@/lib/api/fee/feesApi"

interface CreateFeeModalProps {
  onClose: () => void
  onSuccess: () => void
  feeToEdit?: Fee | null
}

export function CreateFeeModal({
  onClose,
  onSuccess,
  feeToEdit
}: CreateFeeModalProps) {
  const [loading, setLoading] = useState(false)
  const { createFee, updateFee } = useFeeContext()
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "", // Mặc định rỗng để user phải chọn
    frequency: "",
    ratePerPerson: "",
    minium: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    if (feeToEdit) {
      setFormData({
        name: feeToEdit.name,
        description: feeToEdit.description || "",
        type: feeToEdit.type,
        frequency: feeToEdit.frequency,
        ratePerPerson: feeToEdit.ratePerPerson ? feeToEdit.ratePerPerson.toString() : "",
        minium: feeToEdit.minium ? feeToEdit.minium.toString() : "",
        startDate: feeToEdit.startDate ? new Date(feeToEdit.startDate).toISOString().split('T')[0] : "",
        endDate: feeToEdit.endDate ? new Date(feeToEdit.endDate).toISOString().split('T')[0] : "",
      })
    }
  }, [feeToEdit])

  // Hàm xử lý logic khi thay đổi Loại phí
  const handleTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value,
      // Nếu chọn MANDATORY (Bắt buộc) -> Xóa minium
      // Nếu chọn VOLUNTARY (Tự nguyện) -> Xóa ratePerPerson
      minium: value === 'MANDATORY' ? "" : prev.minium,
      ratePerPerson: value === 'VOLUNTARY' ? "" : prev.ratePerPerson
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        frequency: formData.frequency,
        ratePerPerson: formData.ratePerPerson ? Number.parseFloat(formData.ratePerPerson) : 0,
        minium: formData.minium ? Number.parseFloat(formData.minium) : 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
      }

      if (feeToEdit) {
        await updateFee(feeToEdit.id, payload)
        toast.success("Thành công", { description: "Đã cập nhật khoản phí" })
      } else {
        await createFee(payload)
        toast.success("Thành công", { description: "Khoản phí đã được tạo" })
      }
      
      onSuccess()
    } catch (error) {
      toast.error("Lỗi", {
        description: error instanceof Error ? error.message : "Lỗi không xác định",
      })
    } finally {
      setLoading(false)
    }
  }

  // Biến kiểm tra để disable input
  const isMandatory = formData.type === 'MANDATORY';
  const isVoluntary = formData.type === 'VOLUNTARY';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{feeToEdit ? "Cập nhật khoản phí" : "Tạo khoản phí mới"}</DialogTitle>
          <DialogDescription>
            {feeToEdit ? "Chỉnh sửa thông tin khoản phí hiện có" : "Điền thông tin để tạo một khoản phí mới cho hệ thống"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên khoản phí *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Phí vệ sinh"
            />
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả khoản phí"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Loại *</Label>
              <Select 
                value={formData.type} 
                onValueChange={handleTypeChange} // Sử dụng hàm handle riêng
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANDATORY">Bắt buộc</SelectItem>
                  <SelectItem value="VOLUNTARY">Tự nguyện</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="frequency">Tần suất *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Chọn tần suất" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Hàng tháng</SelectItem>
                  <SelectItem value="YEARLY">Năm</SelectItem>
                  <SelectItem value="ONE_TIME">Một lần</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ratePerPerson" className={isVoluntary ? "text-gray-400" : ""}>
                Tỉ lệ/người {isMandatory && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="ratePerPerson"
                type="number"
                value={formData.ratePerPerson}
                onChange={(e) => setFormData({ ...formData, ratePerPerson: e.target.value })}
                placeholder="0"
                disabled={isVoluntary} // Disable nếu là Tự nguyện
                className={isVoluntary ? "bg-gray-100" : ""}
                required={isMandatory} // Bắt buộc nhập nếu là loại Bắt buộc
              />
            </div>

            <div>
              <Label htmlFor="minium" className={isMandatory ? "text-gray-400" : ""}>
                Tối thiểu {isVoluntary && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="minium"
                type="number"
                value={formData.minium}
                onChange={(e) => setFormData({ ...formData, minium: e.target.value })}
                placeholder="0"
                disabled={isMandatory} // Disable nếu là Bắt buộc
                className={isMandatory ? "bg-gray-100" : ""}
                required={isVoluntary} // Bắt buộc nhập nếu là loại Tự nguyện
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Ngày bắt đầu</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Ngày kết thúc</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : (feeToEdit ? "Cập nhật" : "Tạo phí")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}