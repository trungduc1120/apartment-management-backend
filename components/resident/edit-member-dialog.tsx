"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useHousehold } from "@/lib/context/household-context"
import type { ResidentMember } from "@/lib/context/household-context"
import { Member } from "@/components/resident/member-card"

interface EditMemberDialogProps {
  member: Member
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateMember: (id: string, data: any) => Promise<void>
}

export function EditMemberDialog({ member, open, onOpenChange, onUpdateMember }: EditMemberDialogProps) {
  const [formData, setFormData] = useState({
    fullname: member.fullname,
    nationalId: member.nationalId,
    // show date in dd/mm/yyyy if possible
    dateOfBirth: formatToDDMMYYYY(member.dateOfBirth),
    gender: member.gender,
    relationshipToHead: member.relationshipToHead,
    phoneNumber: member.phoneNumber,
    email: member.email,
    placeOfOrigin: member.placeOfOrigin,
    occupation: member.occupation,
    workingAdress: member.workingAdress,
    updateReason: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // ...existing code...

  // When submitting, convert id to number for updateMember
  const handleUpdate = async () => {
    setIsLoading(true)
    setError("")
    try {
      await onUpdateMember(String(member.id), formData)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi cập nhật thành viên")
    } finally {
      setIsLoading(false)
    }
  }
  // ...existing code...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      // convert dateOfBirth from dd/mm/yyyy to ISO before submit
      const payload = { ...formData }
      if (formData.dateOfBirth) {
        const parsed = parseDDMMYYYY(formData.dateOfBirth)
        if (!parsed) throw new Error("Ngày sinh không hợp lệ. Vui lòng dùng dd/mm/yyyy")
        payload.dateOfBirth = parsed
      }
      if (formData.updateReason) {
        payload.updateReason = formData.updateReason
      }
      await onUpdateMember(String(member.id), payload)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi cập nhật thành viên")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa thông tin thành viên</DialogTitle>
          <DialogDescription>Cập nhật thông tin của {member.fullname}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullname">Họ và tên *</Label>
              <Input
                id="fullname"
                required
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalId">CMND/CCCD *</Label>
              <Input
                id="nationalId"
                required
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Ngày sinh *</Label>
                <Input
                  id="dateOfBirth"
                  type="text"
                  placeholder="dd/mm/yyyy"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Giới tính *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Nam</SelectItem>
                  <SelectItem value="FEMALE">Nữ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationshipToHead">Quan hệ với chủ hộ *</Label>
            <Select
              value={formData.relationshipToHead}
              onValueChange={(value) => setFormData({ ...formData, relationshipToHead: value })}
            >
              <SelectTrigger id="relationshipToHead">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WIFE">Vợ</SelectItem>
                <SelectItem value="HEAD">Chủ hộ</SelectItem>
                <SelectItem value="HUSBAND">Chồng</SelectItem>
                <SelectItem value="FATHER">Bố</SelectItem>
                <SelectItem value="MOTHER">Mẹ</SelectItem>
                <SelectItem value="SON">Con trai</SelectItem>
                <SelectItem value="DAUGHTER">Con gái</SelectItem>
                <SelectItem value="OTHER">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Số điện thoại</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeOfOrigin">Quê quán</Label>
            <Input
              id="placeOfOrigin"
              value={formData.placeOfOrigin}
              onChange={(e) => setFormData({ ...formData, placeOfOrigin: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupation">Nghề nghiệp</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingAdress">Nơi làm việc</Label>
              <Input
                id="workingAdress"
                value={formData.workingAdress}
                onChange={(e) => setFormData({ ...formData, workingAdress: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="updateReason">Lý do sửa</Label>
            <Input
              id="updateReason"
              value={formData.updateReason}
              onChange={(e) => setFormData({ ...formData, updateReason: e.target.value })}
              placeholder="Mô tả lý do chỉnh sửa thông tin"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function formatToDDMMYYYY(dateStr: string) {
  if (!dateStr) return ""
  // try ISO first
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }
  // fallback if already in dd/mm/yyyy
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return m ? dateStr : ""
}

function parseDDMMYYYY(str: string) {
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return d.toISOString().split("T")[0]
}
