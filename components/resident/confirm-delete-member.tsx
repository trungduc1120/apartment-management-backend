import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDeleteMemberDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
  error?: string
}

export function ConfirmDeleteMemberDialog({
  open,
  onCancel,
  onConfirm,
  loading,
  error,
}: ConfirmDeleteMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={open => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <span className="font-semibold text-lg">Xác nhận đuổi thành viên</span>
        </DialogHeader>
        <p>Bạn có chắc chắn muốn đuổi thành viên này ra khỏi nhà không?</p>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}