"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"
import { updateTempResidentRegistration } from "@/lib/api/api"
import { ResidentFormFields } from "./temp-resident-search-step"
import { TempResidentRegistrationStep } from "./temp-resident-registration-step"
import type { TempResident } from "./temp-resident-card"

interface EditTempResidentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  temp?: TempResident | null
  onUpdated?: () => void
}

export function EditTempResidentDialog({ open, onOpenChange, temp, onUpdated }: EditTempResidentDialogProps) {
  const { token, user } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [dateError, setDateError] = useState("")

  useEffect(() => {
    if (open && temp) {
      // initialize form from temp resident
      const r = temp.resident
      const formatDateToDisplay = (iso?: string) => {
        if (!iso) return ""
        const d = new Date(iso)
        if (isNaN(d.getTime())) return iso
        const dd = String(d.getUTCDate()).padStart(2, "0")
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
        const yyyy = d.getUTCFullYear()
        return `${dd}/${mm}/${yyyy}`
      }

      setForm({
        fullname: r.fullname || "",
        nationalId: (r as any).nationalId || "",
        // show dateOfBirth only in dd/mm/yyyy format
        dateOfBirth: formatDateToDisplay(r.dateOfBirth) || "",
        gender: r.gender || "MALE",
        relationshipToHead: r.relationshipToHead || "OTHER",
        phoneNumber: r.phoneNumber || "",
        email: r.email || "",
        placeOfOrigin: r.placeOfOrigin || "",
        occupation: r.occupation || "",
        workingAdress: r.workingAdress || "",
        // show start/end dates in dd/mm/yyyy format as well
        startDate: formatDateToDisplay(temp.startDate) || "",
        endDate: formatDateToDisplay(temp.endDate) || "",
        reason: temp.reason || "",
      })
      setStep(1)
      setError("")
      setDateError("")
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

  const getValidatedDates = () => {
    const startDateObj = parseDisplayToDate(form.startDate)
    const endDateObj = parseDisplayToDate(form.endDate)
    if (startDateObj && endDateObj && startDateObj > endDateObj) {
      setDateError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc")
      return null
    }
    return { startDateObj, endDateObj }
  }

  const removeUndefinedFields = (obj: any) => {
    Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k])
    return obj
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    setDateError("")

    if (!temp) return

    const dates = getValidatedDates()
    if (!dates) return

    const { startDateObj, endDateObj } = dates

    if (!token) {
      setError("Chưa đăng nhập")
      return
    }

    setIsLoading(true)

    try {
      const residentObj = removeUndefinedFields({
        fullname: form.fullname,
        nationalId: form.nationalId,
        gender: form.gender,
        relationshipToHead: form.relationshipToHead,
        phoneNumber: form.phoneNumber,
        email: form.email,
        dateOfBirth: parseDisplayToDate(form.dateOfBirth)?.toISOString(),
        placeOfOrigin: form.placeOfOrigin,
        occupation: form.occupation,
        workingAdress: form.workingAdress,
      })

      const payload = removeUndefinedFields({
        resident: residentObj,
        startDate: startDateObj?.toISOString(),
        endDate: endDateObj?.toISOString(),
        reason: form.reason || undefined,
        submittedUserId: user?.id ? Number(user.id) : undefined,
      })

      console.log("[DEBUG] PATCH payload:", payload)
      await updateTempResidentRegistration(temp.id, payload, token)
      onUpdated?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi cập nhật")
    } finally {
      setIsLoading(false)
    }
  }

  if (!temp) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa khai báo tạm trú</DialogTitle>
          <DialogDescription>Chỉnh sửa thông tin cư dân trước, sau đó thông tin đăng ký tạm trú.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Chỉnh sửa thông tin cư dân</p>
              <ResidentFormFields
                form={{
                  fullname: form.fullname,
                  nationalId: form.nationalId,
                  dateOfBirth: form.dateOfBirth,
                  gender: form.gender,
                  relationshipToHead: form.relationshipToHead,
                  phoneNumber: form.phoneNumber,
                  email: form.email,
                  placeOfOrigin: form.placeOfOrigin,
                  occupation: form.occupation,
                  workingAdress: form.workingAdress,
                }}
                onFormChange={(updates) => setForm((s: any) => ({ ...s, ...updates }))}
              />

              <div className="flex gap-3 justify-end mt-4">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Tiếp
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Chỉnh sửa thông tin đăng ký tạm trú</p>
              <TempResidentRegistrationStep
                form={{ startDate: form.startDate, endDate: form.endDate, reason: form.reason }}
                onFormChange={(updates) => setForm((s: any) => ({ ...s, ...updates }))}
                dateError={dateError}
                isLoading={isLoading}
                onBack={() => setStep(1)}
                onSubmit={handleSubmit}
              />
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
