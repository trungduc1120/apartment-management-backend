"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminGetTempAbsentDetail, adminApproveTempAbsent, adminRejectTempAbsent } from "@/lib/api/registration/registrationApi"
import { useAuth } from "@/lib/context/auth-context"
import { format } from "date-fns"

interface Props {
  open: boolean
  registrationId?: number | string | null
  onClose: () => void
  onUpdated?: () => void
  readOnly?: boolean
}

export function ReviewTempAbsentDialog({ open, registrationId, onClose, onUpdated, readOnly }: Props) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!open || !registrationId) {
      setDetail(null)
      setError(null)
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await adminGetTempAbsentDetail(registrationId!, token ?? undefined)
        const data = res?.data ?? res
        setDetail(data)
      } catch (err: any) {
        setError(err?.message ?? "Không thể tải chi tiết")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [open, registrationId, token])

  const handleApprove = async () => {
    if (!registrationId) return
    setActionLoading(true)
    setError(null)
    try {
      await adminApproveTempAbsent(registrationId, token ?? undefined)
      onUpdated?.()
      onClose()
    } catch (err: any) {
      setError(err?.message ?? "Phê duyệt thất bại")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!registrationId) return
    if (!rejectReason.trim()) {
      setError("Lý do từ chối là bắt buộc")
      return
    }
    setActionLoading(true)
    setError(null)
    try {
      await adminRejectTempAbsent(registrationId, rejectReason, token ?? undefined)
      onUpdated?.()
      onClose()
    } catch (err: any) {
      setError(err?.message ?? "Từ chối thất bại")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Chi tiết & Duyệt đơn</DialogTitle>
          <DialogDescription>Xem thông tin cư dân và khai báo trước khi phê duyệt hoặc từ chối.</DialogDescription>
        </DialogHeader>

        {loading && <div>Đang tải...</div>}
        {error && <div className="text-destructive mb-2">{error}</div>}

        {detail && (
          <div className="text">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Mã đơn</div>
                <div className="font-medium">{detail?.id ?? "-"}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Mã hộ</div>
                <div className="font-medium">{detail?.resident?.houseHoldId ?? "-"}</div>
              </div>
            </div>

            <div className="my-2 border-t border-slate-100" />

            <div>
              <div className="text-xs text-muted-foreground">Cư dân</div>
              <div className="font-medium">{detail?.resident?.fullname ?? detail?.fullname ?? "-"}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div>
                <div className="text-xs text-muted-foreground">CCCD</div>
                <div className="font-medium">{detail?.resident?.nationalId ?? detail?.nationalId ?? "-"}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">SĐT</div>
                <div className="font-medium">{detail?.resident?.phoneNumber ?? detail?.phone ?? "-"}</div>
              </div>
            </div>

            <div className="my-2 border-t border-slate-100" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Ngày bắt đầu</div>
                <div className="font-medium">{detail?.startDate ? format(new Date(detail.startDate), "dd/MM/yyyy") : "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ngày kết thúc</div>
                <div className="font-medium">{detail?.endDate ? format(new Date(detail.endDate), "dd/MM/yyyy") : "-"}</div>
              </div>
            </div>

            <div className="my-2 border-t border-slate-100" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Ngày bắt đầu</div>
                <div className="font-medium">{detail?.startDate ? format(new Date(detail.startDate), "dd/MM/yyyy") : "-"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ngày kết thúc</div>
                <div className="font-medium">{detail?.endDate ? format(new Date(detail.endDate), "dd/MM/yyyy") : "-"}</div>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xs text-muted-foreground">Lý do</div>
              <div className="font-medium">{detail?.reason ?? "-"}</div>
            </div>

            <div className="mt-3">
              <div className="text-xs text-muted-foreground">Địa chỉ đến</div>
              <div className="font-medium">{detail?.destination ?? "-"}</div>
            </div>

            {detail?.reviewedAdmin && (
              <>
                <div className="my-2 border-t border-slate-100" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Admin duyệt</div>
                    <div className="font-medium">{detail?.reviewedAdmin?.username ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Ngày duyệt</div>
                    <div className="font-medium">{detail?.reviewedAt ? format(new Date(detail.reviewedAt), "dd/MM/yyyy HH:mm") : "-"}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          <div className="w-full">
            {!readOnly && (
              <>
                <div className="mb-2">
                  <Input placeholder="Lý do từ chối (bắt buộc khi từ chối)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>{actionLoading ? "Đang xử lý..." : "Từ chối"}</Button>
                  <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleApprove} disabled={actionLoading}>{actionLoading ? "Đang xử lý..." : "Phê duyệt"}</Button>
                </div>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
