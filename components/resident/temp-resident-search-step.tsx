"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Member } from "./member-card"

interface SearchStepProps {
  nationalId: string
  onNationalIdChange: (value: string) => void
  searchLoading: boolean
  searchError: string
  foundResident: Member | null
  creatingResident: boolean
  form: {
    fullname: string
    nationalId: string
    dateOfBirth: string
    gender: string
    relationshipToHead: string
    phoneNumber: string
    email: string
    placeOfOrigin: string
    occupation: string
    workingAdress: string
  }
  onFormChange: (updates: any) => void
  onSearch: () => void
  onNext: () => void
  onReset: () => void
  searchInputRef?: React.RefObject<HTMLInputElement>
}

export function TempResidentSearchStep({
  nationalId,
  onNationalIdChange,
  searchLoading,
  searchError,
  foundResident,
  creatingResident,
  form,
  onFormChange,
  onSearch,
  onNext,
  onReset,
  searchInputRef,
}: SearchStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>CMND / CCCD</Label>
        <div className="flex gap-2">
          <Input
            ref={searchInputRef}
            value={nationalId}
            onChange={(e) => onNationalIdChange(e.target.value)}
            placeholder="Nhập số CMND/CCCD"
          />
          <Button type="button" onClick={onSearch} disabled={searchLoading || !nationalId}>
            {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tìm"}
          </Button>
        </div>
        {searchError && <p className="text-sm text-destructive">{searchError}</p>}
      </div>

      {(foundResident || creatingResident) && (
        <div className="space-y-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {creatingResident
              ? "Không tìm thấy cư dân. Vui lòng nhập thông tin cư dân rồi nhấn \"Tiếp\" để tiếp tục khai báo."
              : "Tìm thấy cư dân, bạn có thể chỉnh sửa thông tin rồi nhấn \"Tiếp\"."}
          </p>

          <ResidentFormFields form={form} onFormChange={onFormChange} />

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onReset} disabled={searchLoading}>
              Tìm lại
            </Button>
            <Button type="button" onClick={onNext}>
              Tiếp
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface ResidentFormFieldsProps {
  form: {
    fullname: string
    nationalId: string
    dateOfBirth: string
    gender: string
    relationshipToHead: string
    phoneNumber: string
    email: string
    placeOfOrigin: string
    occupation: string
    workingAdress: string
  }
  onFormChange: (updates: any) => void
}

export function ResidentFormFields({ form, onFormChange }: ResidentFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <FormField
        label="Họ và tên"
        value={form.fullname}
        onChange={(v) => onFormChange({ fullname: v })}
      />
      <FormField
        label="CMND/CCCD"
        value={form.nationalId}
        onChange={(v) => onFormChange({ nationalId: v })}
      />
      <FormField
        label="Ngày sinh"
        type="text"
        placeholder="dd/mm/yyyy"
        value={form.dateOfBirth}
        onChange={(v) => onFormChange({ dateOfBirth: v })}
      />
      <SelectField
        label="Giới tính"
        value={form.gender}
        onChange={(v) => onFormChange({ gender: v })}
        options={[
          { value: "MALE", label: "Nam" },
          { value: "FEMALE", label: "Nữ" },
        ]}
      />
      <SelectField
        label="Quan hệ"
        value={form.relationshipToHead}
        onChange={(v) => onFormChange({ relationshipToHead: v })}
        options={[
          { value: "WIFE", label: "Vợ" },
          { value: "HUSBAND", label: "Chồng" },
          { value: "FATHER", label: "Bố" },
          { value: "MOTHER", label: "Mẹ" },
          { value: "SON", label: "Con trai" },
          { value: "DAUGHTER", label: "Con gái" },
          { value: "OTHER", label: "Khác" },
        ]}
      />
      <FormField
        label="Số điện thoại"
        value={form.phoneNumber}
        onChange={(v) => onFormChange({ phoneNumber: v })}
      />
      <FormField
        label="Email"
        type="email"
        value={form.email}
        onChange={(v) => onFormChange({ email: v })}
      />
      <FormField
        label="Quê quán"
        value={form.placeOfOrigin}
        onChange={(v) => onFormChange({ placeOfOrigin: v })}
      />
      <FormField
        label="Nghề nghiệp"
        value={form.occupation}
        onChange={(v) => onFormChange({ occupation: v })}
      />
      <FormField
        label="Nơi làm việc"
        value={form.workingAdress}
        onChange={(v) => onFormChange({ workingAdress: v })}
      />
    </div>
  )
}

interface FormFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}

export function FormField({ label, value, onChange, type = "text", placeholder }: FormFieldProps) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

export function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
