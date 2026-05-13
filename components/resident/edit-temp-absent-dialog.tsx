"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/context/auth-context"
import { updateTempAbsent } from "@/lib/api/api"
import { useRegistration } from "@/lib/context/registration-context"
import type { TempResident } from "./temp-resident-card"

interface EditTempAbsentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  temp?: any | null
  onUpdated?: () => void
}

export function EditTempAbsentDialog({ open, onOpenChange, temp, onUpdated }: EditTempAbsentDialogProps) {
  const { token } = useAuth()
  const { refreshTempAbsents } = useRegistration()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [infoStatus, setInfoStatus] = useState<string | undefined>(undefined)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [destination, setDestination] = useState("")

  useEffect(() => {
    if (open && temp) {
      // Extract TemporaryAbsence entry if present
      const ta = (temp as any).TemporaryAbsence?.[0]
      const status = ta?.informationStatus ?? (temp as any).informationStatus
      setInfoStatus(status)

      const formatDateToDisplay = (iso?: string) => {
        if (!iso) return ""
        const d = new Date(iso)
        if (isNaN(d.getTime())) return iso
        const dd = String(d.getUTCDate()).padStart(2, "0")
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
        const yyyy = d.getUTCFullYear()
        return `${dd}/${mm}/${yyyy}`
      }

      setStartDate(formatDateToDisplay(ta?.startDate || (temp as any).startDate))
      setEndDate(formatDateToDisplay(ta?.endDate || (temp as any).endDate))
      setReason(ta?.reason ?? (temp as any).reason ?? "")
      setDestination(ta?.destination ?? (temp as any).address ?? "")
      setError("")
    } else if (!open) {
      setInfoStatus(undefined)
      setStartDate("")
      setEndDate("")
      setReason("")
      setDestination("")
      setError("")
    }
  }, [open, temp])

  const parseDisplayToDate = (s?: string) => {
    if (!s) return null
    const m = s.trim().match(/^(\d{2})[\/\-\s](\d{2})[\/\-\s](\d{4})$/)
    if (!m) return null
    const dd = Number(m[1])
    const mm = Number(m[2])
    const yyyy = Number(m[3])
    const d = new Date(Date.UTC(yyyy, mm - 1, dd))
    return isNaN(d.getTime()) ? null : d
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    if (!temp) return

    // If approved, don't allow update
    if (infoStatus === "APPROVED") {
      setError("Bạn không thể cập nhật khai báo đã được xác nhận")
      return
    }

    const ta = (temp as any).TemporaryAbsence?.[0]
    const registrationId = ta?.id ?? (temp as any).id

    const s = parseDisplayToDate(startDate)
    const eDate = parseDisplayToDate(endDate)
    if (!s || !eDate) {
      setError("Ngày không hợp lệ (dd/mm/yyyy)")
      return
    }
    if (s > eDate) {
      setError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc")
      return
    }

    const payload = {
      startDate: s.toISOString(),
      endDate: eDate.toISOString(),
      reason: reason || undefined,
      destination: destination || undefined,
    }

    setIsLoading(true)
    try {
      await updateTempAbsent(registrationId, payload, token ?? undefined)
      await refreshTempAbsents()
      onUpdated?.()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/You can't update approved registration/i.test(msg)) {
        setError("Bạn không thể cập nhật khai báo đã được xác nhận")
      } else if (/You are't allow to delete/i.test(msg) || /You aren't allow to delete/i.test(msg) || /not allow to delete/i.test(msg)) {
        setError("Bạn không có quyền cập nhật đăng ký này")
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!temp) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa khai báo tạm vắng</DialogTitle>
          <DialogDescription>Chỉnh sửa thông tin đăng ký tạm vắng cho cư dân.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {infoStatus === "APPROVED" ? (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Không thể cập nhật khai báo tạm vắng vì đăng ký đã được xác nhận (APPROVED).</p>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input placeholder="dd/mm/yyyy" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input placeholder="dd/mm/yyyy" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Địa điểm (đến)</Label>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Lý do</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
