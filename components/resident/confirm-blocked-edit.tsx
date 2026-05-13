"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmBlockedEditProps {
  open: boolean
  onClose: () => void
  message?: string
}

export function ConfirmBlockedEdit({ open, onClose, message }: ConfirmBlockedEditProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Không thể sửa khai báo</DialogTitle>
          <DialogDescription className="text-sm">{message ?? "Hành động này không được phép vì trạng thái đăng ký."}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
