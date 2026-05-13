"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { useHousehold } from "@/lib/context/household-context"
import { AddMemberDialog } from "@/components/resident/add-member-dialog"
import { EditMemberDialog } from "@/components/resident/edit-member-dialog"
import { EditHouseholdDialog } from "@/components/resident/edit-household-dialog"
import { Member } from "@/components/resident/member-card"
import { MembersList } from "@/components/resident/member-list"
import { HouseholdInfoCard } from "@/components/resident/household-info-card"
import { ConfirmDeleteMemberDialog } from "@/components/resident/confirm-delete-member"

export default function ResidentPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const {
    household,
    isLoading: isHouseholdLoading,
    members: residentMembers,
    updateMember,
    deleteMember, // Thêm hàm xóa member từ context
  } = useHousehold()

  // Convert ResidentMember[] to Member[] for UI
  const members: Member[] = residentMembers.map((m) => ({
    id: String(m.id),
    fullname: m.fullname,
    nationalId: m.nationalId,
    relationshipToHead: m.relationshipToHead,
    dateOfBirth: m.dateOfBirth,
    gender: m.gender,
    occupation: m.occupation,
    email: m.email,
    phoneNumber: m.phoneNumber,
    workingAdress: m.workingAdress,
    placeOfOrigin: m.placeOfOrigin,
    residentStatus: m.residencStatus,
    informationStatus: undefined // ResidentMember does not have this, set undefined
  }))

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isEditHouseholdOpen, setIsEditHouseholdOpen] = useState(false)

  // Mở dialog sửa
  const handleEditMember = (member: Member) => {
    if (!household) return
    const status = (member.informationStatus || "").toUpperCase()
    const lockedHousehold = household && household.household && ((household.household.informationStatus || "").toUpperCase() === "DELETING" || (household.household.informationStatus || "").toUpperCase() === "ENDED")
    const lockedMember = status === "DELETING" || status === "ENDED"
    if (lockedHousehold || lockedMember) {
      return
    }
    setSelectedMember(member)
    setIsEditDialogOpen(true)
  }

  // Khi bấm xóa, chỉ mở dialog xác nhận
  const handleDeleteMember = (id: string) => {
    if (!household) return
    const m = members.find(x => x.id === id)
    const status = (m?.informationStatus || "").toUpperCase()
    const lockedHousehold = household && household.household && ((household.household.informationStatus || "").toUpperCase() === "DELETING" || (household.household.informationStatus || "").toUpperCase() === "ENDED")
    const lockedMember = status === "DELETING" || status === "ENDED"
    if (lockedHousehold || lockedMember) {
      return
    }
    setConfirmDeleteId(id)
  }

  // Hàm xác nhận xóa thật sự
  const confirmDelete = async () => {
    if (!confirmDeleteId) return
    setDeleteLoading(true)
    setDeleteError("")
    try {
      await deleteMember(confirmDeleteId)
      setConfirmDeleteId(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Lỗi khi xóa thành viên")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Điều hướng khi chưa đăng nhập
  useEffect(() => {
    if (!isAuthLoading && !user) router.replace("/auth/login")
  }, [isAuthLoading, user, router])

  // Điều hướng khi chưa có hộ khẩu
  useEffect(() => {
    if (isAuthLoading || isHouseholdLoading) return
    if (!user) return router.replace("/auth/login")
    if (!household) router.replace("/resident/form")
  }, [isAuthLoading, isHouseholdLoading, user, household, router])


  if (isAuthLoading || isHouseholdLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Đang tải dữ liệu...</p>
      </div>
    )
  }

  if (!user || !household) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {(() => {
          if (!household) return null
          const status = (household.household.informationStatus || "").toUpperCase()
          const locked = status === "DELETING" || status === "ENDED"
          return locked ? (
            <div className="mb-4 p-3 border rounded text-sm text-muted-foreground bg-muted">
              Thông tin hộ khẩu đang ở trạng thái "{household.household.informationStatus}". Các thao tác sửa/xóa tạm thời bị khóa.
            </div>
          ) : null
        })()}
        {/* Banner chào người dùng
        <WelcomeBanner userName={user.username} /> */}
        {/* Sidebar is provided by resident layout */}

        {/* Thông tin hộ khẩu */}
        <HouseholdInfoCard
          info={{
                  houseHoldCode: String(household.household.houseHoldCode),
                  apartmentNumber: household.household.apartmentNumber,
                  buildingNumber: household.household.buildingNumber,
                  street: household.household.street,
                  ward: household.household.ward,
                  province: household.household.province,
              status: household.household.status,
              informationStatus: household.household.informationStatus,
                  head: household.head?.fullname ?? "Chưa có chủ hộ",
                  numMotorbike: household.household.numMotorbike,
                  numCars: household.household.numCars,
                }}
          onEdit={()=>{
            console.log(">> Bấm nút Chỉnh sửa hộ khẩu")
            setIsEditHouseholdOpen(true)
          }} 
          disableEdit={(() => {
            if (!household) return false
            const status = (household.household.informationStatus || "").toUpperCase()
            return status === "DELETING" || status === "ENDED"
          })()}
        />
        <EditHouseholdDialog
          household={household.household}
          open={isEditHouseholdOpen}
          onOpenChange={setIsEditHouseholdOpen}
        />

        {/* Danh sách thành viên */}
        <MembersList
          members={members}
          onAddMember={() => setIsDialogOpen(true)}
          onEditMember={handleEditMember}
          onDeleteMember={handleDeleteMember}
          disabledActions={(() => {
            if (!household) return false
            const status = (household.household.informationStatus || "").toUpperCase()
            return status === "DELETING" || status === "ENDED"
          })()}
        />

        {/* Dialog thêm thành viên  */}
        <AddMemberDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />

        <ConfirmDeleteMemberDialog
          open={!!confirmDeleteId}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={confirmDelete}
          loading={deleteLoading}
          error={deleteError}
        />

        {/* Dialog chỉnh sửa thành viên */}
        {selectedMember && (
          <EditMemberDialog
            member={selectedMember}
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open)
              if (!open) setSelectedMember(null)
            }}
            onUpdateMember={async (id, data) => {
              await updateMember(Number(id), data)
            }}
          />
        )}
      </div>
    </div>
  )
}
