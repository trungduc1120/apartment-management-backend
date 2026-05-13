"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FeeAssignmentItem } from "@/lib/api/fee/feeAssignmentsApi"
import { useFeeContext } from "@/lib/context/fee-context"
import { Loader2, UploadCloud, X } from "lucide-react"
import Image from "next/image"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: FeeAssignmentItem | null
  onSuccess?: () => void
}

export function PaymentDialog({ open, onOpenChange, item, onSuccess }: PaymentDialogProps) {
  const { submitPayment } = useFeeContext()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hàm format tiền
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  // Xử lý chọn file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  // Xử lý submit
  const handleSubmit = async () => {
    if (!item || !file) return

    setLoading(true)
    try {
      await submitPayment(item.id, item.amountDue, file)
      
      // Reset form
      setFile(null)
      setPreview(null)
      onSuccess?.() // Callback để reload data ở trang cha
      onOpenChange(false) // Đóng modal
    } catch (error) {
      // Lỗi đã được catch ở context, ở đây chỉ cần tắt loading
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    onOpenChange(false)
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán phí dịch vụ</DialogTitle>
          <DialogDescription>
            Vui lòng chuyển khoản và tải lên ảnh chụp màn hình giao dịch (bill).
          </DialogDescription>
        </DialogHeader>
        
        {/* Thông tin chuyển khoản (Mockup - bạn có thể thay bằng dữ liệu thật) */}
        <div className="rounded-lg bg-muted p-4 text-sm">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Khoản phí:</span>
            <span className="font-medium">{item.fee?.name}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Số tiền cần đóng:</span>
            <span className="font-bold text-primary text-lg">{formatCurrency(item.amountDue)}</span>
          </div>
          <div className="mt-4 border-t pt-3">
            <p className="font-semibold mb-1">Thông tin ngân hàng:</p>
            <p>Ngân hàng: <span className="font-medium">MB Bank</span></p>
            <p>STK: <span className="font-medium">0987654321</span></p>
            <p>Chủ TK: <span className="font-medium">BAN QUAN LY CHUNG CU</span></p>
            <p>Nội dung: <span className="font-medium text-blue-600">{item.household?.houseHoldCode} - {item.fee?.name}</span></p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="grid gap-2">
          <Label htmlFor="picture">Ảnh minh chứng thanh toán</Label>
          
          {!preview ? (
            <div 
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Nhấn để tải ảnh lên <br/> (JPEG, PNG, JPG)
              </p>
              <Input 
                ref={fileInputRef} 
                id="picture" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border h-48 w-full">
              <Image 
                src={preview} 
                alt="Payment proof" 
                fill 
                className="object-contain bg-black/5" 
              />
              <button 
                onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!file || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận thanh toán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}