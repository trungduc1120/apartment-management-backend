"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Household } from "@/lib/context/household-context"
import { useHousehold } from "@/lib/context/household-context"

interface EditHouseholdDialogProps {
  household: Household
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditHouseholdDialog({ household, open, onOpenChange }: EditHouseholdDialogProps) {
  const { members, updateHousehold } = useHousehold()
  const [formData, setFormData] = useState({
    apartmentNumber: household.apartmentNumber,
    buildingNumber: household.buildingNumber,
    street: household.street,
    ward: household.ward,
    province: household.province,
    headID: household.headID?.toString() || "",
    updateReason: "",
    numCars: household.numCars?.toString() || "0",
    numMotorbike: household.numMotorbike?.toString() || "0",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const newHeadId = formData.headID ? Number.parseInt(formData.headID) : undefined
    const hasAddressChanges =
      formData.apartmentNumber !== household.apartmentNumber ||
      formData.buildingNumber !== household.buildingNumber ||
      formData.street !== household.street ||
      formData.ward !== household.ward ||
      formData.province !== household.province
    const headChanged = newHeadId !== undefined && newHeadId !== household.headID
    const vehicleChanged = 
      Number(formData.numCars) !== (household.numCars || 0) ||
      Number(formData.numMotorbike) !== (household.numMotorbike || 0)
    const hasChanges = hasAddressChanges || headChanged || vehicleChanged

    if (!hasChanges) {
      onOpenChange(false)
      return
    }

    setIsLoading(true)

    try {
      const updateData: any = {
        apartmentNumber: formData.apartmentNumber,
        buildingNumber: formData.buildingNumber,
        street: formData.street,
        ward: formData.ward,
        province: formData.province,
        numCars: Number(formData.numCars) || 0,
        numMotorbike: Number(formData.numMotorbike) || 0,
      }

      if (headChanged && newHeadId !== undefined) {
        updateData.headID = newHeadId
      }

      if (formData.updateReason) {
        updateData.updateReason = formData.updateReason
      }

      console.log("[EditHouseholdDialog] Payload gửi:", updateData)
      await updateHousehold(updateData)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi cập nhật thông tin")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sửa thông tin hộ khẩu</DialogTitle>
          <DialogDescription>Cập nhật thông tin địa chỉ hộ khẩu và chủ hộ của bạn</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headID">Chủ hộ</Label>
            <Select value={formData.headID} onValueChange={(value) => setFormData({ ...formData, headID: value })}>
              <SelectTrigger id="headID">
                <SelectValue placeholder="Chọn chủ hộ" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.fullname} ({member.relationshipToHead})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apartmentNumber">Số căn hộ</Label>
              <Input
                id="apartmentNumber"
                value={formData.apartmentNumber}
                onChange={(e) => setFormData({ ...formData, apartmentNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buildingNumber">Tòa nhà</Label>
              <Input
                id="buildingNumber"
                value={formData.buildingNumber}
                onChange={(e) => setFormData({ ...formData, buildingNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Đường</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ward">Phường</Label>
              <Input
                id="ward"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Tỉnh/Thành phố</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numMotorbike">Số xe máy</Label>
              <Input
                id="numMotorbike"
                type="number"
                min="0"
                value={formData.numMotorbike}
                onChange={(e) => setFormData({ ...formData, numMotorbike: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numCars">Số xe ô tô</Label>
              <Input
                id="numCars"
                type="number"
                min="0"
                value={formData.numCars}
                onChange={(e) => setFormData({ ...formData, numCars: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="updateReason">Lý do thay đổi</Label>
            <Input
              id="updateReason"
              value={formData.updateReason}
              onChange={(e) => setFormData({ ...formData, updateReason: e.target.value })}
              placeholder="Mô tả ngắn gọn lý do chỉnh sửa"
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
