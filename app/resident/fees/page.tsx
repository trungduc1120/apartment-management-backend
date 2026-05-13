"use client"

import { useEffect, useState, useCallback } from "react"
import { useFeeContext } from "@/lib/context/fee-context"
import { useHousehold } from "@/lib/context/household-context"
import { FeeAssignmentItem } from "@/lib/api/fee/feeAssignmentsApi"
import { Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

import { FeeCard } from "@/components/resident/fee/fee-card"
import { EmptyState } from "@/components/resident/fee/empty-state"
import { PaymentDialog } from "@/components/resident/fee/payment-dialog"

export default function HouseholdFeesPage() {
  const { household } = useHousehold()
  const { getHouseholdFees } = useFeeContext()

  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<FeeAssignmentItem[]>([])
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid')

  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedFee, setSelectedFee] = useState<FeeAssignmentItem | null>(null)

  const fetchFees = useCallback(async () => {
    if (household?.household?.id) {
      setLoading(true)
      try {
        const data = await getHouseholdFees(household.household.id)
        setAssignments(data || [])
      } catch (error) {
        console.error("Lỗi khi tải danh sách phí:", error)
      } finally {
        setLoading(false)
      }
    }
  }, [household, getHouseholdFees])

  useEffect(() => {
    fetchFees()
  }, [fetchFees])

  const unpaidFees = assignments.filter((item) => !item.isPaid)
  const paidFees = assignments.filter((item) => item.isPaid)

  const handlePaymentClick = (id: number) => {
    const feeItem = assignments.find(a => a.id === id)
    if (feeItem) {
      setSelectedFee(feeItem)
      setIsPaymentOpen(true)
    }
  }

  if (loading && assignments.length === 0) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!household) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground">
        <AlertCircle className="mb-2 h-10 w-10 opacity-50" />
        <p>Chưa có thông tin hộ gia đình.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        
        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Phí dịch vụ</h1>
            <p className="text-muted-foreground mt-1">
              Danh sách các khoản phí căn hộ <span className="font-medium text-foreground">{household.household.apartmentNumber}</span>
            </p>
          </div>
          
          {/* TABS NAVIGATION */}
          <div className="flex items-end space-x-8">
            <TabButton 
              isActive={activeTab === 'unpaid'} 
              onClick={() => setActiveTab('unpaid')}
              label="Chưa đóng"
              count={unpaidFees.length}
            />
            <TabButton 
              isActive={activeTab === 'paid'} 
              onClick={() => setActiveTab('paid')}
              label="Đã đóng"
              count={paidFees.length}
            />
          </div>
        </div>

        {/* LIST CONTENT */}
        <div className="space-y-6">
          {activeTab === 'unpaid' ? (
            <div className="animate-in slide-in-from-left-4 fade-in duration-300">
              <FeeList 
                items={unpaidFees} 
                type="unpaid" 
                onPaymentClick={handlePaymentClick} 
                emptyMessage="Tuyệt vời! Bạn đã hoàn thành tất cả khoản phí."
              />
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <FeeList 
                items={paidFees} 
                type="paid" 
                emptyMessage="Chưa có lịch sử thanh toán nào."
              />
            </div>
          )}
        </div>

        {/* PAYMENT DIALOG */}
        <PaymentDialog 
          open={isPaymentOpen}
          onOpenChange={setIsPaymentOpen}
          item={selectedFee}
          onSuccess={() => {
            // Sau khi thanh toán thành công, load lại dữ liệu để cập nhật trạng thái "Chờ duyệt"
            fetchFees()
          }}
        />

      </div>
    </div>
  )
}


// Component hiển thị danh sách
function FeeList({ 
  items, 
  type, 
  emptyMessage,
  onPaymentClick 
}: { 
  items: FeeAssignmentItem[], 
  type: 'paid' | 'unpaid',
  emptyMessage: string,
  onPaymentClick?: (id: number) => void
}) {
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map(item => (
        <FeeCard 
          key={item.id} 
          item={item} 
          type={type} 
          onPaymentClick={onPaymentClick}
        />
      ))}
    </div>
  )
}

// Component nút Tab
function TabButton({ isActive, onClick, label, count }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative pb-2 text-xl font-semibold transition-all outline-none",
        isActive 
          ? "text-primary after:absolute after:bottom-[-17px] after:left-0 after:h-[3px] after:w-full after:bg-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label} 
      <span className={cn("ml-2 text-sm font-normal align-top", isActive ? "text-primary" : "text-muted-foreground")}>
        {count}
      </span>
    </button>
  )
}