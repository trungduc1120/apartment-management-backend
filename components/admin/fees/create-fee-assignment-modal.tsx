"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFeeContext } from "@/lib/context/fee-context"
import { adminGetAllHouseholds } from "@/lib/api/api" // Import API trực tiếp
import { useAuth } from "@/lib/context/auth-context"
import { Loader2, Search } from "lucide-react"

interface CreateFeeAssignmentModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateFeeAssignmentModal({ onClose, onSuccess }: CreateFeeAssignmentModalProps) {
  const { token } = useAuth()
  const { fees, createAssignment } = useFeeContext()
  
  // State Form
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [selectedFeeId, setSelectedFeeId] = useState("")
  const [dueDate, setDueDate] = useState("")
  
  // State tìm kiếm hộ dân
  const [searchQuery, setSearchQuery] = useState("")
  const [householdsList, setHouseholdsList] = useState<any[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [selectedHouseholds, setSelectedHouseholds] = useState(new Set<number>())

 
  const fetchHouseholdsForSelect = useCallback(async (query: string) => {
    if (!token) return
    setLoadingSearch(true)
    try {
      
      const result = await adminGetAllHouseholds(token, { page: 1, limit: 50, search: query })
      if (result.success && result.data && result.data.data) {
        setHouseholdsList(result.data.data)
      } else {
        setHouseholdsList([])
      }
    } catch (error) {
      console.error("Error fetching households:", error)
    } finally {
      setLoadingSearch(false)
    }
  }, [token])

  // Debounce search hoặc load lần đầu
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchHouseholdsForSelect(searchQuery)
    }, 500) // Delay 500ms để tránh spam API khi gõ
    return () => clearTimeout(timeoutId)
  }, [searchQuery, fetchHouseholdsForSelect])

  // Logic chọn Checkbox
  const handleHouseholdToggle = (id: number) => {
    const next = new Set(selectedHouseholds)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedHouseholds(next)
  }

  // Logic Select All (chỉ select những hộ đang hiển thị trong list tìm kiếm)
  const isAllVisibleSelected = householdsList.length > 0 && householdsList.every((h: any) => selectedHouseholds.has(h.id))
  
  const handleSelectAllVisible = () => {
    const next = new Set(selectedHouseholds)
    if (isAllVisibleSelected) {
      // Bỏ chọn những thằng đang hiển thị
      householdsList.forEach((h: any) => next.delete(h.id))
    } else {
      // Chọn tất cả những thằng đang hiển thị
      householdsList.forEach((h: any) => next.add(h.id))
    }
    setSelectedHouseholds(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFeeId) return toast.error("Vui lòng chọn khoản phí")
    if (!dueDate) return toast.error("Vui lòng chọn hạn nộp")
    if (selectedHouseholds.size === 0) return toast.error("Vui lòng chọn ít nhất một hộ")

    setLoadingSubmit(true)
    try {
      await createAssignment({
        feeId: Number(selectedFeeId),
        householdIds: Array.from(selectedHouseholds),
        dueDate: new Date(dueDate).toISOString(),
      })
      toast.success("Thành công", { description: `Đã gán phí cho ${selectedHouseholds.size} hộ` })
      onSuccess()
    } catch (error) {
      toast.error("Lỗi", { description: error instanceof Error ? error.message : "Lỗi không xác định" })
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gán phí cho hộ</DialogTitle>
          <DialogDescription>Tìm kiếm và chọn các hộ dân cần đóng phí</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chọn khoản phí *</Label>
              <Select value={selectedFeeId} onValueChange={setSelectedFeeId}>
                <SelectTrigger><SelectValue placeholder="-- Loại phí --" /></SelectTrigger>
                <SelectContent>
                  {fees.map((fee) => (
                    <SelectItem key={fee.id} value={fee.id.toString()}>{fee.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hạn nộp *</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
          </div>

          {/* Khu vực tìm kiếm và chọn hộ */}
          <div className="flex-1 flex flex-col min-h-0 space-y-2 border-t pt-2">
            <div className="flex justify-between items-center">
               <Label>Danh sách hộ ({selectedHouseholds.size} đã chọn)</Label>
            </div>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Nhập mã hộ, số phòng hoặc tên chủ hộ..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="border rounded-lg flex-1 flex flex-col min-h-0 mt-2">
              <div className="flex items-center space-x-2 p-3 border-b bg-muted/40">
                <Checkbox 
                  id="select-all" 
                  checked={isAllVisibleSelected} 
                  onCheckedChange={handleSelectAllVisible} 
                  disabled={householdsList.length === 0}
                />
                <Label htmlFor="select-all" className="cursor-pointer font-medium text-sm">
                  {isAllVisibleSelected ? "Bỏ chọn trang này" : "Chọn tất cả trang này"}
                </Label>
              </div>

              <ScrollArea className="flex-1 p-0 h-64">
                {loadingSearch ? (
                   <div className="flex items-center justify-center py-8">
                     <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                   </div>
                ) : householdsList.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground text-sm">Không tìm thấy hộ nào</div>
                ) : (
                  <div className="divide-y">
                    {householdsList.map((h: any) => {
                       const headName = h.resident?.find((r: any) => r.relationshipToHead === "HEAD")?.fullname || "Chưa có chủ hộ"
                       return (
                          <div key={h.id} className="flex items-center space-x-3 p-3 hover:bg-accent/50 transition-colors">
                            <Checkbox
                              id={`h-${h.id}`}
                              checked={selectedHouseholds.has(h.id)}
                              onCheckedChange={() => handleHouseholdToggle(h.id)}
                            />
                            <Label htmlFor={`h-${h.id}`} className="flex-1 cursor-pointer grid grid-cols-2 gap-2">
                              <span className="font-medium">P.{h.apartmentNumber} - {h.buildingNumber}</span>
                              <span className="text-muted-foreground text-sm truncate">{headName}</span>
                            </Label>
                          </div>
                       )
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={loadingSubmit}>
              {loadingSubmit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gán phí
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}