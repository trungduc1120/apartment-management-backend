"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useHousehold } from "@/lib/context/household-context"
import { useAuth } from "@/lib/context/auth-context"
import { getResidentByNationalId, createTempResidentFirstTime as apiCreateTempResidentFirstTime, createTempResidentForExistingResident as apiCreateTempResidentForExistingResident } from "@/lib/api/api"
import type { Member } from "./member-card"
import { useEffect, useRef } from "react"
import { TempResidentSearchStep } from "./temp-resident-search-step"
import { TempResidentRegistrationStep } from "./temp-resident-registration-step"

interface AddTempResidentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Member[]
  initialNationalId?: string
  autoSearch?: boolean
}

export function AddTempResidentDialog({ open, onOpenChange, members, initialNationalId, autoSearch }: AddTempResidentDialogProps) {
  const { createTempResident, refreshTempResidents } = useHousehold()
  const { token, user } = useAuth()

  const [step, setStep] = useState<1 | 2>(1)
  const [nationalId, setNationalId] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [foundResident, setFoundResident] = useState<Member | null>(null)
  const [creatingResident, setCreatingResident] = useState(false)

  const [form, setForm] = useState({
    memberId: "",
    fullname: "",
    nationalId: "",
    dateOfBirth: "",
    gender: "MALE",
    relationshipToHead: "OTHER",
    phoneNumber: "",
    email: "",
    placeOfOrigin: "",
    occupation: "",
    workingAdress: "",
    startDate: "",
    endDate: "",
    reason: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dateError, setDateError] = useState("")
  const nationalIdRef = useRef<HTMLInputElement | null>(null)

  // Reset dialog when it opens
  useEffect(() => {
    if (open) {
      resetDialog()
    }
  }, [open])

  // When members change, keep memberId valid
  if (members.length > 0 && !form.memberId) {
    setForm((s) => ({ ...s, memberId: members[0].id }))
  }

  const resetDialog = () => {
    setStep(1)
    setNationalId("")
    setSearchError("")
    setFoundResident(null)
    setCreatingResident(false)
    setError("")
    setSuccess("")
    setDateError("")
    setForm({
      memberId: "",
      fullname: "",
      nationalId: "",
      dateOfBirth: "",
      gender: "MALE",
      relationshipToHead: "OTHER",
      phoneNumber: "",
      email: "",
      placeOfOrigin: "",
      occupation: "",
      workingAdress: "",
      startDate: "",
      endDate: "",
      reason: "",
    })
  }

  // Date utility functions
  const parseDisplayToDate = (s?: string) => {
    if (!s) return null
    // accept dd/mm/yyyy or dd-mm-yyyy or dd mm yyyy
    const m = s.trim().match(/^(\d{2})[\/\-\s](\d{2})[\/\-\s](\d{4})$/)
    if (!m) return null
    const dd = Number(m[1])
    const mm = Number(m[2])
    const yyyy = Number(m[3])
    const d = new Date(Date.UTC(yyyy, mm - 1, dd))
    return isNaN(d.getTime()) ? null : d
  }

  const formatIsoToDisplay = (iso?: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ""
    const dd = String(d.getUTCDate()).padStart(2, "0")
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
    const yyyy = d.getUTCFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  // Helper to parse dates and validate
  const getValidatedDates = () => {
    const startDateObj = parseDisplayToDate(form.startDate)
    const endDateObj = parseDisplayToDate(form.endDate)
      if (startDateObj && endDateObj && startDateObj > endDateObj) {
        setDateError("End date must be after start date")
      return null
    }
    return { startDateObj, endDateObj }
  }

  // Helper to clean undefined fields from object
  const removeUndefinedFields = (obj: any) => {
    Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k])
    return obj
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setDateError("")
    setIsLoading(true)

    const dates = getValidatedDates()
    if (!dates) {
      setIsLoading(false)
      return
    }

    const { startDateObj, endDateObj } = dates

    if (!token) {
      setError("Chưa đăng nhập hoặc token chưa sẵn sàng. Vui lòng đăng nhập lại.")
      setIsLoading(false)
      return
    }

    if (!user || typeof user.id !== "number") {
      setError("Không xác định người gửi. Vui lòng đăng nhập lại.")
      setIsLoading(false)
      return
    }

    try {
      if (foundResident) {
        // Existing resident: send registration fields + updated resident fields
        const residentObj = removeUndefinedFields({
          fullname: form.fullname,
          gender: form.gender,
          relationshipToHead: form.relationshipToHead,
          phoneNumber: form.phoneNumber,
          email: form.email,
          dateOfBirth: parseDisplayToDate(form.dateOfBirth)?.toISOString(),
          placeOfOrigin: form.placeOfOrigin,
          occupation: form.occupation,
          workingAdress: form.workingAdress,
        })

        const regPayload = removeUndefinedFields({
          resident: residentObj,
          startDate: startDateObj?.toISOString(),
          endDate: endDateObj?.toISOString(),
          reason: form.reason || undefined,
          submittedUserId: Number(user.id),
        })

        console.log("[DEBUG] Sending regPayload to createTempResidentForExistingResident:", JSON.stringify(regPayload, null, 2))
        await apiCreateTempResidentForExistingResident(Number(foundResident.id), regPayload, token)
      } else {
        // New resident: send resident + registration fields
        const residentObj = removeUndefinedFields({
          fullname: form.fullname,
          nationalId: form.nationalId || nationalId,
          gender: form.gender,
          relationshipToHead: form.relationshipToHead,
          phoneNumber: form.phoneNumber,
          email: form.email,
          dateOfBirth: parseDisplayToDate(form.dateOfBirth)?.toISOString(),
          placeOfOrigin: form.placeOfOrigin,
          occupation: form.occupation,
          workingAdress: form.workingAdress,
        })

        const fullPayload = removeUndefinedFields({
          resident: residentObj,
          startDate: startDateObj?.toISOString(),
          endDate: endDateObj?.toISOString(),
          reason: form.reason || undefined,
          submittedUserId: Number(user.id),
        })

        console.log("[DEBUG] Sending fullPayload to createTempResidentFirstTime:", JSON.stringify(fullPayload, null, 2))
        await apiCreateTempResidentFirstTime(fullPayload, token)
      }

      await refreshTempResidents()
      setSuccess("Khai báo tạm trú đã được gửi.")

      setTimeout(() => {
        resetDialog()
        onOpenChange(false)
      }, 800)
    } catch (err) {
      // Map backend 409 / conflict errors to a friendly, localized message.
      let friendly = "Lỗi khi gửi khai báo tạm trú"
      try {
        const e = err as any
        const status = e?.status ?? e?.response?.status ?? e?.statusCode
        const msg = (e?.message ?? String(e ?? "")).toString()

        if (status === 409 || /409/.test(msg) || /conflict/i.test(msg) || (/khai\s*b[aả]o/i.test(msg) && /trước/i.test(msg))) {
          friendly = "Cư dân đã có khai báo trước đó"
        } else if (msg) {
          friendly = msg
        }
      } catch (e) {
        // ignore parsing errors
      }

      setError(friendly)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    setSearchError("")
    setSearchLoading(true)
    setFoundResident(null)
    setCreatingResident(false)
    try {
      const res = await getResidentByNationalId(nationalId, token ?? undefined)
      // Backend should return { data: { resident: {...} } } or { data: {...} }
      const resData = res?.data
      if (resData) {
        // Extract resident object (may be nested under 'resident' field)
        const resident = resData.resident || resData
        console.log("Search result resident:", resident) // Debug log
        
        // Validate that returned resident matches the searched nationalId
        if (resident.nationalId !== nationalId) {
          setSearchError(`Không tìm thấy cư dân với mã số: ${nationalId}`)
          setCreatingResident(true)
          setForm((s) => ({ ...s, nationalId }))
          setSearchLoading(false)
          return
        }
        
        // normalize into Member shape expected by UI
        const ui: Member = {
          id: String(resident.id),
          nationalId: resident.nationalId || "",
          fullname: resident.fullname || "",
          relationshipToHead: resident.relationshipToHead || "",
          dateOfBirth: resident.dateOfBirth || "",
          gender: resident.gender || "",
          occupation: resident.occupation || "",
          email: resident.email || "",
          phoneNumber: resident.phoneNumber || "",
          workingAdress: resident.workingAdress || resident.workingAddress || "",
          placeOfOrigin: resident.placeOfOrigin || "",
          informationStatus: (resident.informationStatus || resident.residentStatus) as any,
        }
        setFoundResident(ui)
        // fill form with resident data (allow edits); format dateOfBirth to dd/mm/yyyy for display
        setForm((s) => ({
          ...s,
          memberId: ui.id,
          fullname: ui.fullname,
          nationalId: resident.nationalId || "",
          dateOfBirth: formatIsoToDisplay(ui.dateOfBirth),
          gender: ui.gender,
          relationshipToHead: ui.relationshipToHead,
          phoneNumber: ui.phoneNumber,
          email: ui.email,
          placeOfOrigin: ui.placeOfOrigin,
          occupation: ui.occupation,
          workingAdress: ui.workingAdress,
        }))
      } else {
        // not found -> allow creating resident info
        setCreatingResident(true)
        // pre-fill nationalId in the form so user can continue
        setForm((s) => ({ ...s, nationalId }))
      }
    } catch (err) {
      // Handle 404 and other errors - show form to create new resident
      const errorMessage = err instanceof Error ? err.message : "Lỗi khi tìm cư dân"
      console.log("[DEBUG] Search error:", errorMessage)
      
      // If 404 or resident not found, allow creating new resident
      setSearchError(`Không tìm thấy cư dân với mã số: ${nationalId}. Vui lòng nhập thông tin để tạo cư dân mới.`)
      setCreatingResident(true)
      setForm((s) => ({ ...s, nationalId }))
    } finally {
      setSearchLoading(false)
    }
  }

  // focus nationalId input when dialog opens; optionally auto-search if initialNationalId provided
  useEffect(() => {
    if (!open) return
    // focus
    setTimeout(() => {
      nationalIdRef.current?.focus()
    }, 50)

    // auto-search if requested
    if (initialNationalId) {
      setNationalId(initialNationalId)
      if (autoSearch) {
        // call search after a small delay so state updates
        setTimeout(() => {
          void handleSearch()
        }, 120)
      }
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo khai báo tạm trú</DialogTitle>
          <DialogDescription>Chọn thành viên và nhập thông tin khai báo tạm trú</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: search by nationalId */}
          {step === 1 && (
            <TempResidentSearchStep
              nationalId={nationalId}
              onNationalIdChange={setNationalId}
              searchLoading={searchLoading}
              searchError={searchError}
              foundResident={foundResident}
              creatingResident={creatingResident}
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
              onFormChange={(updates) => {
                setForm((s) => ({ ...s, ...updates }))
                if (Object.keys(updates).includes("startDate") || Object.keys(updates).includes("endDate")) {
                  setDateError("")
                }
              }}
              onSearch={handleSearch}
              onNext={() => setStep(2)}
              onReset={() => {
                setFoundResident(null)
                setCreatingResident(false)
                setNationalId("")
                setForm((s) => ({
                  ...s,
                  fullname: "",
                  nationalId: "",
                  dateOfBirth: "",
                  gender: "MALE",
                  relationshipToHead: "OTHER",
                  phoneNumber: "",
                  email: "",
                  placeOfOrigin: "",
                  occupation: "",
                  workingAdress: "",
                }))
              }}
              searchInputRef={nationalIdRef}
            />
          )}

          {/* Step 2: registration details */}
          {step === 2 && (
            <TempResidentRegistrationStep
              form={{
                startDate: form.startDate,
                endDate: form.endDate,
                reason: form.reason,
              }}
              onFormChange={(updates) => setForm((s) => ({ ...s, ...updates }))}
              dateError={dateError}
              isLoading={isLoading}
              onBack={() => setStep(1)}
              onSubmit={handleSubmit}
            />
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
