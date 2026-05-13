"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRegistration } from "@/lib/context/registration-context"
import type { Member } from "./member-card"

interface AddTempAbsentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Member[]
  onAdded?: () => void
}

export function AddTempAbsentDialog({ open, onOpenChange, members, onAdded }: AddTempAbsentDialogProps) {
  const { createTempAbsent } = useRegistration()
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [destination, setDestination] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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

    if (!selected) {
      setError("Vui lòng chọn thành viên")
      return
    }

    const s = parseDisplayToDate(startDate)
    const eDate = parseDisplayToDate(endDate)
    if (!s || !eDate) {
      setError("Ngày không hợp lệ (dd/mm/yyyy)")
      return
    }
    if (s > eDate) {
      setError("End date must be after start date")
      return
    }

    const payload = {
      residentId: Number(selected),
      startDate: s.toISOString(),
      endDate: eDate.toISOString(),
      reason: reason || undefined,
      destination: destination || undefined,
    }

    setIsLoading(true)
    try {
      await createTempAbsent(payload)
      onAdded?.()
      onOpenChange(false)
      // reset
      setSelected(undefined)
      setStartDate("")
      setEndDate("")
      setDestination("")
      setReason("")
    } catch (err) {
      // Map backend 409 / conflict errors to a friendly, localized message.
      let friendly = "Lỗi khi tạo khai báo tạm vắng"
      try {
        const e = err as any
        const status = e?.status ?? e?.response?.status ?? e?.statusCode
        const msg = (e?.message ?? String(e ?? "")).toString()

        if (status === 409 || /409/.test(msg) || /conflict/i.test(msg) || /khai\s*b[aả]o/i.test(msg) && /trước/i.test(msg)) {
          friendly = "Cư dân đã có khai báo trước đó"
        } else if (msg) {
          // Prefer server-provided message when available
          friendly = msg
        }
      } catch (e) {
        // ignore parsing errors and fall back to generic message
      }

      setError(friendly)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm khai báo tạm vắng</DialogTitle>
          <DialogDescription>Chọn thành viên và điền thông tin đăng ký tạm vắng.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Thành viên</Label>
            <Select onValueChange={(v) => setSelected(v)} value={selected}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn thành viên" />
              </SelectTrigger>
              <SelectContent>
                {members
                  .map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.fullname} — {m.nationalId || ""}
                    </SelectItem>
                  ))}

              </SelectContent>
            </Select>
          </div>

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
            <Label>Địa chỉ (đến)</Label>
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
              {isLoading ? "Đang gửi..." : "Gửi khai báo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
