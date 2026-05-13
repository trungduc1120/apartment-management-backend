"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDeleteTempResidentProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
  error?: string
  allowDelete?: boolean
}

export function ConfirmDeleteTempResident({ open, onCancel, onConfirm, loading, error, allowDelete = true }: ConfirmDeleteTempResidentProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa đăng kí tạm trú</DialogTitle>
          <DialogDescription className="text-sm">Hành động này sẽ xóa đăng kí tạm trú. Bạn có muốn tiếp tục?</DialogDescription>
        </DialogHeader>

        {error && <p className="text-destructive text-sm mt-2">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading || !allowDelete}>
            {loading ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
