"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { FormField } from "./temp-resident-search-step"

interface RegistrationStepProps {
  form: {
    startDate: string
    endDate: string
    reason: string
  }
  onFormChange: (updates: any) => void
  dateError: string
  isLoading: boolean
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function TempResidentRegistrationStep({
  form,
  onFormChange,
  dateError,
  isLoading,
  onBack,
  onSubmit,
}: RegistrationStepProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField
          label="Ngày bắt đầu"
          type="text"
          placeholder="dd/mm/yyyy"
          value={form.startDate}
          onChange={(v) => onFormChange({ startDate: v })}
        />
        <FormField
          label="Ngày kết thúc"
          type="text"
          placeholder="dd/mm/yyyy"
          value={form.endDate}
          onChange={(v) => onFormChange({ endDate: v })}
        />
      </div>
      {dateError && <p className="text-sm text-destructive mt-1">{dateError}</p>}

      <div className="space-y-4 mt-4">
        <FormField
          label="Lý do"
          value={form.reason}
          onChange={(v) => onFormChange({ reason: v })}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          Quay lại
        </Button>
        <Button type="submit" disabled={isLoading} onClick={onSubmit}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Gửi khai báo
        </Button>
      </div>
    </>
  )
}
